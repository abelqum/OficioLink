"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import Estrellas from "@/components/ui/Estrellas";

const getOficioIds = (trabajador) => {
  if (Array.isArray(trabajador?.oficio_ids) && trabajador.oficio_ids.length) {
    return trabajador.oficio_ids.map(String);
  }
  return trabajador?.oficio_id ? [String(trabajador.oficio_id)] : [];
};

const getOficioNombres = (trabajador, oficios) => {
  const ids = getOficioIds(trabajador);
  const nombres = ids
    .map((id) => oficios.find((oficio) => String(oficio.id) === id)?.nombre)
    .filter(Boolean);

  if (nombres.length) return nombres;
  return trabajador?.oficios?.nombre ? [trabajador.oficios.nombre] : ["Oficio general"];
};

const getPrecioBase = (trabajador, oficios) => {
  const precios = getOficioIds(trabajador)
    .map((id) => oficios.find((oficio) => String(oficio.id) === id)?.costo_defecto)
    .filter((precio) => precio !== null && precio !== undefined)
    .map(Number);

  if (precios.length) return Math.min(...precios);
  return Number(trabajador?.oficios?.costo_defecto || 0);
};

export default function PerfilExperto() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [trabajador, setTrabajador] = useState(null);
  const [oficios, setOficios] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      const [
        { data: dataTrabajador },
        { data: dataFotos },
        { data: dataResenas },
        { data: dataOficios },
      ] = await Promise.all([
        supabase
          .from("trabajadores")
          .select(
            `
            *,
            oficios(nombre, costo_defecto),
            promedio_trabajadores(promedio, total_resenas)
          `,
          )
          .eq("id", id)
          .single(),
        supabase
          .from("portafolios")
          .select("*")
          .eq("trabajador_id", id)
          .order("creado_en", { ascending: false }),
        supabase
          .from("resenas")
          .select(
            `
            *,
            usuarios(nombre_completo)
          `,
          )
          .eq("trabajador_id", id)
          .order("creado_en", { ascending: false }),
        supabase.from("oficios").select("id, nombre, costo_defecto").order("nombre"),
      ]);

      if (!isMounted) return;

      setSession(currentSession);
      setTrabajador(dataTrabajador);
      setFotos(dataFotos || []);
      setResenas(dataResenas || []);
      setOficios(dataOficios || []);
      setLoading(false);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, supabase]);

  const handleContratar = async (e) => {
    e.preventDefault();
    if (!session) return router.push("/login");

    setEnviando(true);
    const formData = new FormData(e.target);
    const oficioSeleccionado =
      formData.get("oficio_id") || getOficioIds(trabajador)[0] || trabajador?.oficio_id;
    const citaPresupuesto = formData.get("cita_presupuesto");

    const payloadCompleto = {
      cliente_id: session.user.id,
      trabajador_id: id,
      servicio_detalle: formData.get("detalle"),
      metodo_pago: formData.get("pago"),
      estado: "pendiente",
      oficio_id: oficioSeleccionado,
      cita_presupuesto: citaPresupuesto || null,
      modalidad_cita: formData.get("modalidad_cita"),
      requiere_visita_presupuesto: Boolean(citaPresupuesto),
    };

    const { error } = await supabase.from("solicitudes").insert(payloadCompleto);

    if (error) {
      console.warn("Fallback a esquema anterior de solicitudes:", error);
      const { error: fallbackError } = await supabase.from("solicitudes").insert({
        cliente_id: session.user.id,
        trabajador_id: id,
        servicio_detalle: formData.get("detalle"),
        metodo_pago: formData.get("pago"),
        estado: "pendiente",
      });

      if (fallbackError) {
        toast.error("Error al enviar la solicitud");
        setEnviando(false);
        return;
      }

      toast.warning(
        "Solicitud enviada. Aplica la migración para guardar cita y oficio específico.",
      );
    } else {
      toast.success("Solicitud enviada");
    }

    router.push("/cliente");
    setEnviando(false);
  };

  const fotosPorOficio = useMemo(() => {
    const grupos = {};
    fotos.forEach((foto) => {
      const key = foto.oficio_id ? String(foto.oficio_id) : "general";
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(foto);
    });
    return grupos;
  }, [fotos]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#1E6FD9]" />
      </div>
    );

  const infoReputacion = trabajador?.promedio_trabajadores?.[0] || {
    promedio: 0,
    total_resenas: 0,
  };
  const nombresOficios = getOficioNombres(trabajador, oficios);
  const precioBase = getPrecioBase(trabajador, oficios);
  const verificado = trabajador?.verificacion_estado === "verificado";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-6xl mx-auto p-6">
        <Link href="/cliente">
          <Button
            variant="ghost"
            className="text-slate-500 hover:text-[#1E6FD9] gap-2 font-bold mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a la búsqueda
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white">
              <div className="h-36 bg-slate-950 w-full relative">
                <div className="absolute -bottom-16 left-8">
                  <div className="h-32 w-32 rounded-2xl bg-white p-1 shadow-lg">
                    <img
                      src={
                        trabajador?.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${trabajador?.nombre_completo}`
                      }
                      className="rounded-xl bg-slate-100 w-full h-full object-cover"
                      alt="Avatar"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-20 pb-8 px-8">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                      {trabajador?.nombre_completo}
                      <ShieldCheck
                        className={`h-6 w-6 ${verificado ? "text-blue-500" : "text-slate-300"}`}
                      />
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {nombresOficios.map((nombre) => (
                        <Badge
                          key={nombre}
                          className="bg-[#1E6FD9] hover:bg-[#1E6FD9] px-3 py-1 rounded-lg"
                        >
                          {nombre}
                        </Badge>
                      ))}
                      <Badge className="bg-blue-50 text-blue-700 border-0">
                        {verificado ? "Identidad verificada" : "Verificación pendiente"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Estrellas
                        calificacion={infoReputacion.promedio}
                        tamano="h-4 w-4"
                      />
                      <span className="text-sm font-bold text-slate-400">
                        {infoReputacion.promedio} ({infoReputacion.total_resenas} reseñas)
                      </span>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-[#1E6FD9] hover:bg-[#1557b7] px-8 h-12 rounded-xl font-bold shadow-lg shadow-[#1E6FD9]/20">
                        Solicitar o agendar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl p-8 sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                          Solicitar a {trabajador?.nombre_completo}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleContratar} className="space-y-5 mt-4">
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold">
                            Oficio para esta solicitud
                          </Label>
                          <select
                            name="oficio_id"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-[#1E6FD9]"
                            defaultValue={getOficioIds(trabajador)[0]}
                          >
                            {getOficioIds(trabajador).map((oficioId) => {
                              const oficio = oficios.find(
                                (item) => String(item.id) === String(oficioId),
                              );
                              return (
                                <option key={oficioId} value={oficioId}>
                                  {oficio?.nombre || trabajador?.oficios?.nombre}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold">
                            Detalle de lo que necesitas
                          </Label>
                          <textarea
                            name="detalle"
                            required
                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#1E6FD9] outline-none h-24 resize-none"
                            placeholder="Ej: Necesito revisar el centro de carga..."
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold">
                              Cita para presupuesto
                            </Label>
                            <input
                              name="cita_presupuesto"
                              type="datetime-local"
                              className="w-full p-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-[#1E6FD9]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-700 font-semibold">
                              Modalidad
                            </Label>
                            <select
                              name="modalidad_cita"
                              className="w-full p-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-[#1E6FD9]"
                            >
                              <option value="Visita a domicilio">Visita a domicilio</option>
                              <option value="Videollamada">Videollamada</option>
                              <option value="Llamada telefónica">Llamada telefónica</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700 font-semibold">
                            Método de Pago Preferido
                          </Label>
                          <select
                            name="pago"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-[#1E6FD9]"
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Transferencia">Transferencia</option>
                          </select>
                        </div>
                        <Button
                          disabled={enviando}
                          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg"
                        >
                          {enviando ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                          ) : (
                            "Enviar solicitud"
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-10 pt-8 border-t border-slate-100">
                  <InfoItem
                    label="Cobertura"
                    icon={<MapPin className="h-4 w-4 text-[#1E6FD9]" />}
                    value={
                      Array.isArray(trabajador?.zonas_cobertura) &&
                      trabajador.zonas_cobertura.length
                        ? trabajador.zonas_cobertura.join(", ")
                        : trabajador?.nombre_zona
                    }
                  />
                  <InfoItem
                    label="Costo mínimo"
                    icon={<Banknote className="h-4 w-4 text-green-500" />}
                    value={`$${precioBase || "N/D"} MXN`}
                  />
                  <InfoItem
                    label="Contacto"
                    icon={<Phone className="h-4 w-4 text-blue-500" />}
                    value={trabajador?.telefono}
                  />
                </div>
              </div>
            </Card>

            <section className="space-y-6 pt-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
                Opiniones de Clientes ({resenas.length})
              </h2>

              {resenas.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-dashed text-center">
                  <MessageSquare className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">
                    Este experto aún no tiene opiniones escritas.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {resenas.map((r) => (
                    <Card
                      key={r.id}
                      className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#1E6FD9] text-lg">
                              {r.usuarios?.nombre_completo?.[0] || "U"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {r.usuarios?.nombre_completo || "Usuario"}
                              </p>
                              <Estrellas calificacion={r.calificacion} tamano="h-3 w-3" />
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            {new Date(r.creado_en).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm italic leading-relaxed">
                          {r.comentario || "Calificó el servicio sin dejar un comentario."}
                        </p>
                        {Array.isArray(r.imagenes) && r.imagenes.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            {r.imagenes.map((url) => (
                              <img
                                key={url}
                                src={url}
                                alt="Foto de la reseña"
                                className="h-24 w-full rounded-xl object-cover bg-slate-100"
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-[#1E6FD9]" /> Portafolio
            </h2>
            {fotos.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-dashed text-center">
                <p className="text-sm text-slate-400 font-medium">
                  Sin fotos de trabajos previos.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(fotosPorOficio).map(([oficioId, fotosGrupo]) => {
                  const oficio = oficios.find((item) => String(item.id) === oficioId);
                  return (
                    <section key={oficioId} className="space-y-3">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
                        {oficio?.nombre || "Portafolio general"}
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {fotosGrupo.map((foto) => (
                          <Card
                            key={foto.id}
                            className="border-0 shadow-sm overflow-hidden rounded-2xl group"
                          >
                            <div className="relative aspect-square">
                              <img
                                src={foto.imagen_url}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                alt="Trabajo realizado"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex items-end">
                                <p className="text-white text-sm font-medium leading-snug">
                                  {foto.descripcion}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, icon, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-700 flex items-center gap-1">
        {icon} {value || "No disponible"}
      </p>
    </div>
  );
}
