"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Camera,
  HelpCircle,
  Loader2,
  Lock,
  MapPin,
  Save,
  ShieldCheck,
  ShieldAlert,
  User,
} from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import BotonEliminar from "@/components/ui/BotonEliminar";
import { toast } from "sonner";

const zonasSugeridas = [
  "Centro",
  "Norte",
  "Sur",
  "Oriente",
  "Poniente",
  "Área metropolitana",
];

export default function AjustesTrabajador() {
  const supabase = createClient();
  const [perfil, setPerfil] = useState(null);
  const [oficios, setOficios] = useState([]);
  const [oficiosSeleccionados, setOficiosSeleccionados] = useState([]);
  const [zonasCobertura, setZonasCobertura] = useState([]);
  const [zonaManual, setZonaManual] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [identidadFile, setIdentidadFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarPerfil = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("trabajadores")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setPerfil(data);
        setOficiosSeleccionados(
          Array.isArray(data?.oficio_ids) && data.oficio_ids.length
            ? data.oficio_ids
            : data?.oficio_id
              ? [data.oficio_id]
              : [],
        );
        setZonasCobertura(
          Array.isArray(data?.zonas_cobertura) && data.zonas_cobertura.length
            ? data.zonas_cobertura
            : data?.nombre_zona
              ? [data.nombre_zona]
              : [],
        );

        const { data: ofi } = await supabase.from("oficios").select("*");
        setOficios(ofi || []);
      }
      setLoading(false);
    };
    cargarPerfil();
  }, [supabase]);

  const toggleOficio = (id) => {
    setOficiosSeleccionados((actuales) =>
      actuales.includes(id)
        ? actuales.filter((item) => item !== id)
        : [...actuales, id],
    );
  };

  const toggleZona = (zona) => {
    setZonasCobertura((actuales) =>
      actuales.includes(zona)
        ? actuales.filter((item) => item !== zona)
        : [...actuales, zona],
    );
  };

  const agregarZonaManual = () => {
    const zona = zonaManual.trim();
    if (!zona) return;
    if (!zonasCobertura.includes(zona)) {
      setZonasCobertura((actuales) => [...actuales, zona]);
    }
    setZonaManual("");
  };

  const subirArchivo = async (bucket, archivo, userId, prefijo) => {
    if (!archivo) return null;
    const fileExt = archivo.name.split(".").pop();
    const filePath = `${userId}/${prefijo}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, archivo, {
      upsert: true,
    });
    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!oficiosSeleccionados.length) {
      toast.error("Selecciona al menos un oficio.");
      return;
    }

    setGuardando(true);
    const formData = new FormData(e.target);

    try {
      const avatarUrl = await subirArchivo("avatares", avatarFile, perfil.id, "perfil");
      const identidadUrl = await subirArchivo(
        "verificaciones_identidad",
        identidadFile,
        perfil.id,
        "identidad",
      );

      const payload = {
        nombre_completo: formData.get("nombre"),
        telefono: formData.get("telefono"),
        nombre_zona: formData.get("zona"),
        oficio_id: oficiosSeleccionados[0],
        oficio_ids: oficiosSeleccionados,
        zonas_cobertura: zonasCobertura,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        ...(identidadUrl
          ? { identidad_url: identidadUrl, verificacion_estado: "pendiente" }
          : {}),
      };

      const { data, error } = await supabase
        .from("trabajadores")
        .update(payload)
        .eq("id", perfil.id)
        .select()
        .single();

      if (error) {
        console.warn("Fallback a esquema anterior de ajustes:", error);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("trabajadores")
          .update({
            nombre_completo: formData.get("nombre"),
            telefono: formData.get("telefono"),
            nombre_zona: formData.get("zona"),
            oficio_id: oficiosSeleccionados[0],
          })
          .eq("id", perfil.id)
          .select()
          .single();

        if (fallbackError) throw fallbackError;
        setPerfil(fallbackData);
        toast.warning(
          "Perfil actualizado. Aplica la migración de Supabase para guardar oficios múltiples, fotos y verificación.",
        );
      } else {
        setPerfil(data);
        toast.success("¡Perfil actualizado con éxito!");
      }

      setAvatarFile(null);
      setIdentidadFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar perfil: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-[#14A5B8]" />
      </div>
    );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar rol="trabajador" />

      <div className="flex-1 md:ml-64 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#14A5B8] uppercase tracking-widest">
              Perfil profesional
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Configuración de Perfil
            </h1>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">
            Verificación:{" "}
            <span className="text-[#14A5B8]">
              {perfil?.verificacion_estado || "sin_enviar"}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-[#14A5B8]" /> Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid gap-4">
              <HelpBox>
                Esta información aparece en tu perfil público. Una foto clara y
                teléfono actualizado ayudan a que el cliente confíe antes de contratar.
              </HelpBox>
              <div className="flex items-center gap-4">
                <img
                  src={
                    perfil?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${perfil?.nombre_completo}`
                  }
                  alt="Foto de perfil"
                  className="h-20 w-20 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                />
                <div className="space-y-2 flex-1">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-[#14A5B8]" />
                    Cambiar foto de perfil
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input name="nombre" defaultValue={perfil?.nombre_completo} required />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input name="telefono" defaultValue={perfil?.telefono} required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#14A5B8]" /> Especialidades
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <HelpBox>
                Selecciona todos los oficios que realmente puedes atender. Esto
                mejora los filtros y evita solicitudes equivocadas.
              </HelpBox>
              <Label className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#14A5B8]" />
                Oficios visibles en tu perfil
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {oficios.map((oficio) => {
                  const activo = oficiosSeleccionados.includes(oficio.id);
                  return (
                    <button
                      key={oficio.id}
                      type="button"
                      onClick={() => toggleOficio(oficio.id)}
                      className={`text-left rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                        activo
                          ? "border-[#14A5B8] bg-[#14A5B8]/10 text-[#0f8494]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {oficio.nombre}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#14A5B8]" /> Cobertura
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <HelpBox>
                Agrega las zonas donde puedes trabajar. El cliente usará esta
                información para saber si estás dentro de su cobertura.
              </HelpBox>
              <div className="space-y-2">
                <Label>Zona de Cobertura Principal</Label>
                <Input name="zona" defaultValue={perfil?.nombre_zona} />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={zonaManual}
                  onChange={(e) => setZonaManual(e.target.value)}
                  placeholder="Agregar zona adicional"
                />
                <Button type="button" variant="outline" onClick={agregarZonaManual}>
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {zonasSugeridas.map((zona) => (
                  <button
                    key={zona}
                    type="button"
                    onClick={() => toggleZona(zona)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold border ${
                      zonasCobertura.includes(zona)
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-500 border-slate-200"
                    }`}
                  >
                    {zona}
                  </button>
                ))}
                {zonasCobertura
                  .filter((zona) => !zonasSugeridas.includes(zona))
                  .map((zona) => (
                    <button
                      key={zona}
                      type="button"
                      onClick={() => toggleZona(zona)}
                      className="rounded-full px-3 py-1.5 text-xs font-bold border bg-slate-900 text-white border-slate-900"
                    >
                      {zona} x
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" /> Verificación de
                identidad
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-slate-500">
                Sube una identificación oficial. El estado quedará pendiente para revisión.
              </p>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIdentidadFile(e.target.files?.[0] || null)}
              />
            </CardContent>
          </Card>

          <Button
            disabled={guardando}
            className="w-full md:w-auto bg-[#14A5B8] h-12 px-10 rounded-xl font-bold"
          >
            {guardando ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </form>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-700" /> Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Button variant="outline" className="rounded-xl border-slate-200">
              Cambiar Contraseña
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <ShieldAlert className="h-5 w-5" /> Zona de peligro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>
                Si eliminas tu cuenta, se borrarán tu perfil, portafolio,
                solicitudes y reseñas relacionadas. Esta acción no se puede deshacer.
              </p>
            </div>
            <BotonEliminar tipoUsuario="trabajador" userId={perfil?.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HelpBox({ children }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
      <HelpCircle className="h-5 w-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
