"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  HardHat,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import BotonSalir from "@/components/ui/BotonSalir";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
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

const getOficioIds = (trabajador) => {
  if (Array.isArray(trabajador.oficio_ids) && trabajador.oficio_ids.length) {
    return trabajador.oficio_ids.map(String);
  }
  return trabajador.oficio_id ? [String(trabajador.oficio_id)] : [];
};

const getOficioNombres = (trabajador, oficios) => {
  const ids = getOficioIds(trabajador);
  const nombres = ids
    .map((id) => oficios.find((oficio) => String(oficio.id) === id)?.nombre)
    .filter(Boolean);

  if (nombres.length) return nombres;
  return trabajador.oficios?.nombre ? [trabajador.oficios.nombre] : ["Oficio general"];
};

const getPrecioBase = (trabajador, oficios) => {
  const precios = getOficioIds(trabajador)
    .map((id) => oficios.find((oficio) => String(oficio.id) === id)?.costo_defecto)
    .filter((precio) => precio !== null && precio !== undefined)
    .map(Number);

  if (precios.length) return Math.min(...precios);
  return Number(trabajador.oficios?.costo_defecto || 0);
};

export default function ClienteDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [trabajadores, setTrabajadores] = useState([]);
  const [oficios, setOficios] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [ubicacionCliente, setUbicacionCliente] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [oficiosFiltro, setOficiosFiltro] = useState([]);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [soloVerificados, setSoloVerificados] = useState(false);
  const [zonaFiltro, setZonaFiltro] = useState("");
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const responderCotizacion = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from("solicitudes")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (error) {
      toast.error("Hubo un error al responder");
    } else {
      toast.success(
        nuevoEstado === "en_proceso" ? "Trabajo aceptado" : "Presupuesto rechazado",
      );
      window.location.reload();
    }
  };

  const cargarDatos = async (user) => {
    const [{ data: dataTrabajadores }, { data: dataOficios }] = await Promise.all([
      supabase.from("trabajadores").select(`*, oficios(nombre, costo_defecto)`),
      supabase.from("oficios").select("id, nombre, costo_defecto").order("nombre"),
    ]);

    if (dataTrabajadores) setTrabajadores(dataTrabajadores);
    if (dataOficios) setOficios(dataOficios);

    const { data: dataHistorial, error: errorHistorial } = await supabase
      .from("solicitudes")
      .select(
        `
        *,
        trabajadores (
          *,
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

      await cargarDatos(session.user);

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
                      precio_acordado: payload.new.precio_acordado,
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
      toast.success("Ubicación tomada para calcular distancia");
    });
  };

  const toggleOficioFiltro = (id) => {
    setOficiosFiltro((actuales) =>
      actuales.includes(String(id))
        ? actuales.filter((item) => item !== String(id))
        : [...actuales, String(id)],
    );
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setOficiosFiltro([]);
    setPrecioMin("");
    setPrecioMax("");
    setSoloVerificados(false);
    setZonaFiltro("");
  };

  const trabajadoresFiltrados = useMemo(() => {
    return trabajadores.filter((trabajador) => {
      const nombresOficios = getOficioNombres(trabajador, oficios);
      const textoBusqueda = [
        trabajador.nombre_completo,
        trabajador.nombre_zona,
        ...(trabajador.zonas_cobertura || []),
        ...nombresOficios,
      ]
        .join(" ")
        .toLowerCase();
      const precioBase = getPrecioBase(trabajador, oficios);
      const ids = getOficioIds(trabajador);
      const coincideTexto = textoBusqueda.includes(busqueda.toLowerCase());
      const coincideOficio =
        oficiosFiltro.length === 0 ||
        oficiosFiltro.some((idFiltro) => ids.includes(idFiltro));
      const coincidePrecioMin = !precioMin || precioBase >= Number(precioMin);
      const coincidePrecioMax = !precioMax || precioBase <= Number(precioMax);
      const coincideZona =
        !zonaFiltro ||
        [trabajador.nombre_zona, ...(trabajador.zonas_cobertura || [])]
          .join(" ")
          .toLowerCase()
          .includes(zonaFiltro.toLowerCase());
      const coincideVerificacion =
        !soloVerificados || trabajador.verificacion_estado === "verificado";

      return (
        coincideTexto &&
        coincideOficio &&
        coincidePrecioMin &&
        coincidePrecioMax &&
        coincideZona &&
        coincideVerificacion
      );
    });
  }, [
    busqueda,
    oficios,
    oficiosFiltro,
    precioMax,
    precioMin,
    soloVerificados,
    trabajadores,
    zonaFiltro,
  ]);

  if (cargandoDatos)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#1E6FD9]" />
      </div>
    );

  return (
    <div className="app-shell flex min-h-screen">
      <Sidebar rol="cliente" />

      <div className="flex-1 md:ml-64 flex flex-col">
        <header className="md:hidden flex justify-between items-center bg-white/90 p-4 border-b border-slate-200 backdrop-blur">
          <Image
            src="/logo-letras.png"
            alt="Oficio Link"
            width={100}
            height={30}
            className="h-6 w-auto"
          />
          <BotonSalir />
        </header>

        <main className="flex-1 p-5 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
          <div className="hero-panel p-7 md:p-10">
            <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">
              <div className="max-w-2xl">
                <p className="text-cyan-100 font-bold uppercase tracking-widest text-xs mb-3">
                  Red profesional de oficios
                </p>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                  Encuentra expertos por oficio, cobertura y presupuesto.
                </h1>
                <p className="mt-4 text-cyan-50/85 text-base md:text-lg max-w-xl">
                  Filtra, revisa su perfil y agenda una visita para cotizar antes de contratar.
                </p>
                <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="stat-pill">
                    <span className="block text-2xl font-black">{trabajadores.length}</span>
                    Expertos activos
                  </div>
                  <div className="stat-pill">
                    <span className="block text-2xl font-black">{oficios.length}</span>
                    Oficios disponibles
                  </div>
                  <div className="stat-pill">
                    <span className="block text-2xl font-black">{historial.length}</span>
                    Servicios solicitados
                  </div>
                </div>
              </div>
              <div className="flex lg:items-start">
                <Button
                  onClick={obtenerMiUbicacion}
                  className="h-12 px-6 rounded-xl bg-white text-slate-950 hover:bg-cyan-50 font-black shadow-lg shadow-slate-950/20"
                >
                  <MapPin className="mr-2 h-5 w-5 text-[#1E6FD9]" />
                  Usar mi ubicación
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="buscar" className="w-full">
            <TabsList className="surface-card grid w-full max-w-md grid-cols-2 mb-8 p-1">
              <TabsTrigger
                value="buscar"
                className="rounded-xl data-[state=active]:bg-[#1E6FD9] data-[state=active]:text-white transition-all"
              >
                Buscar Expertos
              </TabsTrigger>
              <TabsTrigger
                value="historial"
                className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
              >
                Mis Contrataciones ({historial.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buscar" className="space-y-6">
              <Card className="surface-card">
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E6FD9]/10">
                          <Filter className="h-5 w-5 text-[#1E6FD9]" />
                        </span>
                        Filtros de búsqueda
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Puedes combinar varios oficios y rango de precio.
                      </p>
                    </div>
                    <Button variant="outline" onClick={limpiarFiltros} className="h-10 rounded-xl">
                      Limpiar
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Nombre, oficio o zona"
                        className="filter-field pl-10"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Zona"
                      className="filter-field"
                      value={zonaFiltro}
                      onChange={(e) => setZonaFiltro(e.target.value)}
                    />
                    <label className="filter-field flex items-center gap-2 px-3 text-sm font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={soloVerificados}
                        onChange={(e) => setSoloVerificados(e.target.checked)}
                      />
                      Solo verificados
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-400 uppercase">
                        Oficios
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {oficios.map((oficio) => (
                          <button
                            key={oficio.id}
                            type="button"
                            onClick={() => toggleOficioFiltro(oficio.id)}
                            className={`filter-chip ${
                              oficiosFiltro.includes(String(oficio.id))
                                ? "filter-chip-active"
                                : "filter-chip-idle"
                            }`}
                          >
                            {oficio.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-400 uppercase">
                        Rango de precio base
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Mínimo"
                          className="filter-field"
                          value={precioMin}
                          onChange={(e) => setPrecioMin(e.target.value)}
                        />
                        <Input
                          type="number"
                          min="0"
                          placeholder="Máximo"
                          className="filter-field"
                          value={precioMax}
                          onChange={(e) => setPrecioMax(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/65 px-5 py-3 shadow-sm backdrop-blur">
                <p className="text-sm font-bold text-slate-600">
                  {trabajadoresFiltrados.length} expertos encontrados
                </p>
                <p className="hidden sm:block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Ordenados para comparar rápido
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {trabajadoresFiltrados.map((trabajador) => {
                  const distancia = calcularDistancia(
                    ubicacionCliente?.lat,
                    ubicacionCliente?.lng,
                    trabajador.ubicacion_latitud,
                    trabajador.ubicacion_longitud,
                  );
                  const nombresOficios = getOficioNombres(trabajador, oficios);
                  const precioBase = getPrecioBase(trabajador, oficios);
                  const verificado = trabajador.verificacion_estado === "verificado";

                  return (
                    <Card
                      key={trabajador.id}
                      className="expert-card overflow-hidden"
                    >
                      <CardContent className="p-0">
                        <div className="p-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <img
                              src={
                                trabajador.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${trabajador.nombre_completo}`
                              }
                              alt="Avatar"
                              className="w-16 h-16 bg-slate-100 rounded-2xl border-4 border-white object-cover shadow-md ring-1 ring-slate-200"
                            />
                            <Badge
                              className={
                                verificado
                                  ? "bg-blue-50 text-blue-700 border-0"
                                  : "bg-slate-100 text-slate-500 border-0"
                              }
                            >
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              {verificado ? "Verificado" : "Sin verificar"}
                            </Badge>
                          </div>

                          <div>
                            <h3 className="text-xl font-black text-slate-900">
                              {trabajador.nombre_completo}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {nombresOficios.map((nombre) => (
                                <Badge
                                  key={nombre}
                                  className="bg-[#1E6FD9]/10 text-[#1557b7] border-0"
                                >
                                  {nombre}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Estrellas calificacion={5} tamano="h-4 w-4" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              5.0 Excelente
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              {distancia ? `${distancia} km` : trabajador.nombre_zona}
                            </p>
                            <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">
                              <Banknote className="h-4 w-4 text-green-500" />
                              Desde ${precioBase || "N/D"}
                            </p>
                          </div>
                        </div>
                        <div className="soft-divider p-4 bg-slate-50/80">
                          <Link href={`/perfil/${trabajador.id}`}>
                            <Button className="w-full bg-slate-900 hover:bg-[#1E6FD9] text-white h-11 rounded-xl">
                              Ver perfil y agendar
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="historial" className="space-y-6">
              <div className="surface-card p-8 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Tu Historial de Servicios
                  </h2>
                  <p className="text-slate-500 mt-2">
                    Revisa cotizaciones, citas y trabajos completados.
                  </p>
                </div>
                <HardHat className="h-12 w-12 text-slate-200 hidden sm:block" />
              </div>

              {historial.length === 0 ? (
                <div className="surface-card text-center py-20 border-dashed border-slate-300">
                  <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700">
                    Aún no has contratado a nadie
                  </h3>
                  <p className="text-slate-500">
                    Vuelve a Buscar Expertos para hacer tu primera solicitud.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {historial.map((item) => (
                    <Card
                      key={item.id}
                      className="expert-card overflow-hidden flex flex-col"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div
                          className={`w-full md:w-3 h-2 md:h-auto ${
                            item.estado === "pendiente"
                              ? "bg-amber-400"
                              : item.estado === "cotizado"
                                ? "bg-purple-500"
                                : item.estado === "en_proceso"
                                  ? "bg-[#1E6FD9]"
                                  : item.estado === "rechazado"
                                    ? "bg-red-500"
                                    : "bg-green-500"
                          }`}
                        />

                        <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="space-y-3">
                            <h3 className="text-xl font-bold text-slate-900">
                              Experto:{" "}
                              {item.trabajadores?.nombre_completo || "Desconocido"}
                            </h3>
                            <Badge variant="outline" className="text-slate-500 border-slate-200">
                              {getOficioNombres(item.trabajadores || {}, oficios).join(", ")}
                            </Badge>
                            <p className="text-sm text-slate-500">
                              <span className="font-bold">Detalle:</span>{" "}
                              {item.servicio_detalle}
                            </p>
                            {item.cita_presupuesto && (
                              <p className="text-sm text-slate-600 flex items-center gap-2">
                                <CalendarClock className="h-4 w-4 text-[#1E6FD9]" />
                                Cita para presupuesto:{" "}
                                {new Date(item.cita_presupuesto).toLocaleString()} (
                                {item.modalidad_cita || "por definir"})
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
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
                              {item.estado.replace("_", " ")}
                            </Badge>

                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Banknote className="h-4 w-4" /> Pago: {item.metodo_pago}
                            </p>

                            {item.estado === "completado" && (
                              <ModalCalificar solicitud={item} />
                            )}
                          </div>
                        </div>
                      </div>

                      {item.estado === "cotizado" && (
                        <div className="bg-[#1E6FD9]/5 border-t border-[#1E6FD9]/20 p-6 md:pl-9">
                          <p className="font-black text-[#1E6FD9] text-xl mb-1">
                            El experto propone: ${item.precio_acordado} MXN
                          </p>
                          <p className="text-sm text-slate-600 mb-5">
                            Acepta el presupuesto para iniciar el trabajo.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              onClick={() => responderCotizacion(item.id, "en_proceso")}
                              className="bg-[#1E6FD9] hover:bg-[#1557b7] text-white font-bold h-12 rounded-xl px-8 shadow-md"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Aceptar y Contratar
                            </Button>
                            <Button
                              onClick={() => responderCotizacion(item.id, "rechazado")}
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
        </main>
      </div>
    </div>
  );
}
