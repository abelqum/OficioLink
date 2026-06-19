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
// Agrega estas dos líneas en tus imports
import Sidebar from "@/components/ui/Sidebar";
import Estrellas from "@/components/ui/Estrellas";
import ModalCalificar from "@/components/ui/ModalCalificar";
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
const responderCotizacion = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from('solicitudes')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (error) {
      toast.error("Hubo un error al responder");
    } else {
      toast.success(nuevoEstado === 'en_proceso' ? "¡Trabajo aceptado!" : "Trabajo rechazado");
      window.location.reload();
    }
  };
  const cargarDatos = async (user) => {
    // 1. Cargar el buscador de trabajadores
    const { data: dataTrabajadores } = await supabase
      .from("trabajadores")
      .select(`*, oficios(nombre, costo_defecto)`);

    if (dataTrabajadores) setTrabajadores(dataTrabajadores);

    // 2. Cargar el historial (Ajustado para evitar errores de relación)
   // 2. Cargar el historial (Ajustado)
    const { data: dataHistorial, error: errorHistorial } = await supabase
      .from("solicitudes")
      .select(
        `
        id, estado, metodo_pago, servicio_detalle, creado_en, trabajador_id, precio_acordado,
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
                  ? { 
                      ...item, 
                      estado: payload.new.estado,
                      precio_acordado: payload.new.precio_acordado // <-- ¡ESTO ES LO NUEVO!
                    }
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
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* 1. NUESTRO COMPONENTE SIDEBAR */}
      <Sidebar rol="cliente" />

      {/* 2. CONTENEDOR PRINCIPAL */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Topbar móvil */}
        <header className="md:hidden flex justify-between items-center bg-white p-4 border-b border-slate-200">
          <Image
            src="/logo-letras.png"
            alt="Oficio Link"
            width={100}
            height={30}
            className="h-6 w-auto"
          />
          <BotonSalir />
        </header>

        <main className="flex-1 p-6 md:p-10 space-y-8 max-w-6xl mx-auto w-full">
          {/* Banner de Bienvenida del Cliente */}
          <div className="bg-[#14A5B8] rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  ¿Qué necesitas <br /> reparar hoy?
                </h1>
                <p className="mt-4 text-white/90 text-lg font-medium">
                  Encuentra a los mejores expertos cerca de tu ubicación.
                </p>
              </div>
            </div>
          </div>

          {/* CONTENEDOR BLANCO PARA TUS TABS */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
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
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                              {trabajador.nombre_completo}
                            </h3>

                            {/* NUEVO: ESTRELLAS EN LA BÚSQUEDA */}
                            <div className="flex items-center gap-2 mb-4">
                              <Estrellas calificacion={5} tamano="h-4 w-4" />
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                5.0 Excelente
                              </span>
                            </div>

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
              {/* PESTAÑA HISTORIAL CON BOTÓN DE CALIFICAR                   */}
              {/* ======================================================== */}
             {/* ======================================================== */}
              {/* PESTAÑA HISTORIAL CON BOTÓN DE CALIFICAR                   */}
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
                      Vuelve a la pestaña -Buscar Expertos- para hacer tu
                      primera solicitud.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {historial.map((item) => (
                      <Card
                        key={item.id}
                        className="border-0 shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow flex flex-col"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* BARRA LATERAL DE COLOR SEGÚN ESTADO ACTUALIZADA */}
                          <div
                            className={`w-full md:w-3 h-2 md:h-auto ${
                              item.estado === "pendiente"
                                ? "bg-amber-400"
                                : item.estado === "cotizado"
                                  ? "bg-purple-500"
                                  : item.estado === "en_proceso"
                                    ? "bg-[#14A5B8]"
                                    : item.estado === "rechazado"
                                      ? "bg-red-500"
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
                              {/* BADGE DE ESTADO ACTUALIZADO */}
                              <Badge
                                className={`${
                                  item.estado === "pendiente"
                                    ? "bg-amber-100 text-amber-800"
                                    : item.estado === "cotizado"
                                      ? "bg-purple-100 text-purple-800"
                                      : item.estado === "en_proceso"
                                        ? "bg-blue-100 text-blue-800"
                                        : item.estado === "rechazado"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-green-100 text-green-800"
                                } uppercase tracking-wider px-4 py-2 text-xs font-bold border-0`}
                              >
                                {item.estado === "pendiente"
                                  ? "⏳ Esperando Confirmación"
                                  : item.estado === "cotizado"
                                    ? "💰 Presupuesto Recibido"
                                    : item.estado === "en_proceso"
                                      ? "🛠️ Trabajo en Proceso"
                                      : item.estado === "rechazado"
                                        ? "❌ Rechazado"
                                        : "✅ Completado"}
                              </Badge>

                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Banknote className="h-4 w-4" /> Pago:{" "}
                                {item.metodo_pago}
                              </p>

                              {/* BOTÓN DE CALIFICAR */}
                              {item.estado === "completado" && (
                                <ModalCalificar solicitud={item} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ======================================================== */}
                        {/* LÓGICA DE APROBACIÓN DEL CLIENTE (COTIZACIÓN)            */}
                        {/* ======================================================== */}
                        {item.estado === 'cotizado' && (
                          <div className="bg-[#14A5B8]/5 border-t border-[#14A5B8]/20 p-6 md:pl-9">
                            <p className="font-black text-[#14A5B8] text-xl mb-1">
                              El experto propone: ${item.precio_acordado} MXN
                            </p>
                            <p className="text-sm text-slate-600 mb-5">
                              ¿Aceptas este presupuesto para que el experto comience el trabajo en tu ubicación?
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button 
                                onClick={() => responderCotizacion(item.id, 'en_proceso')} 
                                className="bg-[#14A5B8] hover:bg-[#0f8494] text-white font-bold h-12 rounded-xl px-8 shadow-md"
                              >
                                Aceptar y Contratar
                              </Button>
                              <Button 
                                onClick={() => responderCotizacion(item.id, 'rechazado')} 
                                variant="outline" 
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold h-12 rounded-xl px-8"
                              >
                                Rechazar Presupuesto
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
