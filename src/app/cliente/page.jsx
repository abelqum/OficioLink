"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MapPin,
  CheckCircle2,
  Star,
  ShieldCheck,
  Banknote,
  Clock,
  HardHat,
  Loader2,
} from "lucide-react";
import BotonSalir from "@/components/ui/BotonSalir";
import BotonEliminar from "@/components/ui/BotonEliminar";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

export default function ClienteDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [ubicacionCliente, setUbicacionCliente] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const cargarDatos = async (user) => {
    // 1. Cargar el buscador de trabajadores
    const { data: dataTrabajadores } = await supabase
      .from("trabajadores")
      .select(`*, oficios(nombre, costo_defecto)`);

    if (dataTrabajadores) setTrabajadores(dataTrabajadores);

    // 2. Cargar el historial (Ajustado para evitar errores de relación)
    const { data: dataHistorial, error: errorHistorial } = await supabase
      .from("solicitudes")
      .select(
        `
        id, estado, metodo_pago, servicio_detalle, creado_en, trabajador_id,
        trabajadores (
          nombre_completo,
          oficios (nombre)
        )
      `,
      )
      .eq("cliente_id", user.id)
      .order("creado_en", { ascending: false });

    if (errorHistorial) {
      console.error("Error al cargar historial:", errorHistorial);
    } else if (dataHistorial) {
      setHistorial(dataHistorial);
    }

    setCargandoDatos(false);
  };
  useEffect(() => {
    let canalRealtime;

    const inicializar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      setUsuarioActual(session.user);
      await cargarDatos(session.user);

      // MAGIA EN TIEMPO REAL: Le ponemos un nombre único al canal con Date.now()
      canalRealtime = supabase.channel(`cambios-${Date.now()}`);

      canalRealtime
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "solicitudes",
            filter: `cliente_id=eq.${session.user.id}`,
          },
          (payload) => {
            setHistorial((historialActual) =>
              historialActual.map((item) =>
                item.id === payload.new.id
                  ? { ...item, estado: payload.new.estado }
                  : item,
              ),
            );
          },
        )
        .subscribe();
    };

    inicializar();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) router.push("/login");
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
      // Muy importante limpiar el canal al salir
      if (canalRealtime) supabase.removeChannel(canalRealtime);
    };
  }, [router, supabase]);

  const obtenerMiUbicacion = () => {
    if (!navigator.geolocation)
      return toast.error("Geolocalización no soportada");
    navigator.geolocation.getCurrentPosition((pos) => {
      setUbicacionCliente({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  };

  const trabajadoresFiltrados = trabajadores.filter(
    (t) =>
      t.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.nombre_zona?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.oficios?.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  if (cargandoDatos)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#14A5B8]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Image
            src="/logo-letras.png"
            alt="Oficio Link"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="hidden md:inline text-sm text-slate-500 font-medium">
              Panel de Cliente
            </span>
            <div className="flex gap-2">
              <BotonSalir />
              {usuarioActual && (
                <BotonEliminar
                  tipoUsuario="cliente"
                  userId={usuarioActual.id}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Usamos las Tabs y marcamos dinámicamente cuántas contrataciones hay */}
        <Tabs defaultValue="historial" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-slate-200/50 p-1 rounded-xl mx-auto md:mx-0">
            <TabsTrigger
              value="buscar"
              className="rounded-lg data-[state=active]:bg-[#14A5B8] data-[state=active]:text-white transition-all"
            >
              Buscar Expertos
            </TabsTrigger>
            <TabsTrigger
              value="historial"
              className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
            >
              Mis Contrataciones ({historial.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buscar" className="space-y-8">
            <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#14A5B8] rounded-full blur-3xl opacity-20 pointer-events-none"></div>
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-4xl font-extrabold mb-4 leading-tight">
                  Encuentra a los mejores expertos{" "}
                  <span className="text-[#14A5B8]">cerca de ti</span>
                </h1>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      placeholder="Ej. Electricista en Satélite..."
                      className="pl-12 bg-white/10 border-slate-700 text-white placeholder:text-slate-400 h-14 rounded-xl text-lg"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={obtenerMiUbicacion}
                    className="h-14 px-8 rounded-xl bg-[#14A5B8] hover:bg-[#0f8494] text-white font-semibold text-lg"
                  >
                    <MapPin className="mr-2 h-5 w-5" />
                    Mi ubicación
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trabajadoresFiltrados.map((trabajador) => {
                const distancia = calcularDistancia(
                  ubicacionCliente?.lat,
                  ubicacionCliente?.lng,
                  trabajador.ubicacion_latitud,
                  trabajador.ubicacion_longitud,
                );
                return (
                  <Card
                    key={trabajador.id}
                    className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group bg-white"
                  >
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${trabajador.nombre_completo}`}
                            alt="Avatar"
                            className="w-16 h-16 bg-slate-100 rounded-full border-2 border-white shadow-sm"
                          />
                          <Badge className="bg-[#14A5B8]/10 text-[#14A5B8] border-0 font-semibold px-3 py-1">
                            {trabajador.oficios?.nombre}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">
                          {trabajador.nombre_completo}
                        </h3>
                        <p className="flex items-center gap-2 text-sm text-slate-600 mb-6">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {trabajador.nombre_zona}
                        </p>
                      </div>
                      <div className="p-4 border-t bg-slate-50 group-hover:bg-[#14A5B8]/5">
                        <Link href={`/perfil/${trabajador.id}`}>
                          <Button className="w-full bg-slate-900 hover:bg-[#14A5B8] text-white transition-colors h-12 rounded-xl">
                            Ver Detalles del Experto
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ======================================================== */}
          {/* PESTAÑA HISTORIAL (AQUÍ ESTÁ LO QUE NO VEÍAS)            */}
          {/* ======================================================== */}
          <TabsContent value="historial" className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Tu Historial de Servicios
                </h2>
                <p className="text-slate-500 mt-2">
                  Aquí verás el estatus en tiempo real de tus pedidos.
                </p>
              </div>
              <HardHat className="h-12 w-12 text-slate-200 hidden sm:block" />
            </div>

            {historial.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700">
                  Aún no has contratado a nadie
                </h3>
                <p className="text-slate-500">
                  Vuelve a la pestaña -Buscar Expertos- para hacer tu primera
                  solicitud.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {historial.map((item) => (
                  <Card
                    key={item.id}
                    className="border-0 shadow-sm overflow-hidden bg-white"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div
                        className={`w-full md:w-3 h-2 md:h-auto ${
                          item.estado === "pendiente"
                            ? "bg-amber-400"
                            : item.estado === "en_proceso"
                              ? "bg-[#14A5B8]"
                              : "bg-green-500"
                        }`}
                      />

                      <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-slate-900">
                            Experto:{" "}
                            {item.trabajadores?.nombre_completo ||
                              "Desconocido"}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-slate-500 border-slate-200"
                          >
                            {item.trabajadores?.oficios?.nombre ||
                              "Oficio General"}
                          </Badge>
                          <p className="text-sm text-slate-500 mt-2">
                            <span className="font-bold">Detalle:</span>{" "}
                            {item.servicio_detalle}
                          </p>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                          {/* ESTA ES LA ETIQUETA DE ESTADO QUE CAMBIA DE COLOR */}
                          <Badge
                            className={`${
                              item.estado === "pendiente"
                                ? "bg-amber-100 text-amber-800"
                                : item.estado === "en_proceso"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                            } uppercase tracking-wider px-4 py-2 text-xs font-bold border-0`}
                          >
                            {item.estado === "pendiente"
                              ? "⏳ Esperando Confirmación"
                              : item.estado === "en_proceso"
                                ? "🛠️ Trabajo en Proceso"
                                : "✅ Completado"}
                          </Badge>

                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Banknote className="h-4 w-4" /> Pago:{" "}
                            {item.metodo_pago}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
