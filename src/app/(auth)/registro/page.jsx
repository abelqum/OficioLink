"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordField from "@/components/ui/PasswordField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";

const zonasSugeridas = [
  "Centro",
  "Norte",
  "Sur",
  "Oriente",
  "Poniente",
  "Área metropolitana",
];

export default function RegistroPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [estadoRegistro, setEstadoRegistro] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [oficios, setOficios] = useState([]);
  const [oficiosSeleccionados, setOficiosSeleccionados] = useState([]);
  const [zonasCobertura, setZonasCobertura] = useState([]);
  const [zonaManual, setZonaManual] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [identidadFile, setIdentidadFile] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null, name: "" });
  const [direccion, setDireccion] = useState({
    calle: "",
    numero_ext: "",
    numero_int: "",
    colonia: "",
    cp: "",
    referencias: "",
  });

  useEffect(() => {
    const fetchOficios = async () => {
      const { data } = await supabase.from("oficios").select("id, nombre");
      if (data) setOficios(data);
    };
    fetchOficios();
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

  const handleGetLocation = (tipo) => {
    if (!navigator.geolocation) {
      return toast.error("Geolocalización no soportada en este navegador.");
    }

    if (tipo === "cliente") {
      setEstadoRegistro("Buscando tu dirección con GPS...");
      setDireccion((prev) => ({
        ...prev,
        calle: "Buscando...",
        colonia: "Buscando...",
      }));
    } else {
      setEstadoRegistro("Buscando tu zona de cobertura...");
      setLocation((prev) => ({
        ...prev,
        name: "Buscando zona y coordenadas...",
      }));
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const exactitud = pos.coords.accuracy;

        if (exactitud > 500) {
          toast.warning(
            `Señal débil (precisión: ${Math.round(exactitud)}m). Verifica los datos.`,
          );
        }

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          );
          const data = await response.json();
          const addr = data.address;

          if (!addr) throw new Error("No se encontró dirección");

          const calleEncontrada =
            addr.road || addr.pedestrian || addr.street || addr.path || "";
          const coloniaEncontrada =
            addr.neighbourhood ||
            addr.suburb ||
            addr.residential ||
            addr.village ||
            "";
          const municipio =
            addr.municipality || addr.city || addr.town || addr.county || "";
          const estado = addr.state || "";

          if (tipo === "cliente") {
            setDireccion((prev) => ({
              ...prev,
              calle: calleEncontrada,
              numero_ext: addr.house_number || "",
              colonia: coloniaEncontrada,
              cp: addr.postcode || "",
            }));
            setEstadoRegistro("Dirección detectada. Revisa los datos antes de continuar.");
          } else {
            const zonaTexto = municipio
              ? `${municipio}, ${estado}`
              : `${coloniaEncontrada}, ${estado}`;
            const zonaLimpia = zonaTexto
              .replace(/^, | ,$|(, )+/g, ", ")
              .replace(/^, /, "");

            setLocation({ lat, lng, name: zonaLimpia });
            if (zonaLimpia && !zonasCobertura.includes(zonaLimpia)) {
              setZonasCobertura((actuales) => [...actuales, zonaLimpia]);
            }
            setEstadoRegistro("Zona detectada. Puedes agregar más zonas si trabajas en varias.");
          }
        } catch (error) {
          console.error("Error al traducir coordenadas:", error);
          toast.error(
            "El servicio de mapas falló. Por favor, llena los datos manualmente.",
          );
          if (tipo === "cliente")
            setDireccion((prev) => ({ ...prev, calle: "", colonia: "" }));
          else setLocation((prev) => ({ ...prev, name: "" }));
          setEstadoRegistro("");
        }
      },
      () => {
        toast.error(
          "No pudimos acceder a tu ubicación. Verifica los permisos de tu navegador.",
        );
        if (tipo === "cliente")
          setDireccion((prev) => ({ ...prev, calle: "", colonia: "" }));
        else setLocation((prev) => ({ ...prev, name: "" }));
        setEstadoRegistro("");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleRegistro = async (e, tipo) => {
    e.preventDefault();
    setLoading(true);
    setMensajeError("");
    setEstadoRegistro("Creando tu cuenta segura...");
    const formData = new FormData(e.target);

    if (tipo === "trabajador" && oficiosSeleccionados.length === 0) {
      const mensaje = "Selecciona al menos un oficio.";
      setMensajeError(mensaje);
      setEstadoRegistro("");
      toast.error(mensaje);
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (authError) {
      setMensajeError(authError.message);
      setEstadoRegistro("");
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    if (tipo === "cliente") {
      setEstadoRegistro("Guardando tu dirección de servicio...");
      const { error: dbError } = await supabase.from("usuarios").insert({
        id: userId,
        nombre_completo: formData.get("nombre"),
        telefono: formData.get("telefono"),
        calle: direccion.calle,
        numero_ext: direccion.numero_ext,
        numero_int: direccion.numero_int,
        colonia: direccion.colonia,
        codigo_postal: direccion.cp,
        referencias: direccion.referencias,
      });

      if (dbError) {
        console.error("ERROR AL GUARDAR CLIENTE:", dbError);
        const mensaje = `Error en la base de datos: ${dbError.message}`;
        setMensajeError(mensaje);
        setEstadoRegistro("");
        toast.error(mensaje);
        setLoading(false);
        return;
      }

      setEstadoRegistro("Cuenta creada. Abriendo tu panel...");
      router.push("/cliente");
      setLoading(false);
      return;
    }

    try {
      setEstadoRegistro("Subiendo foto y documentos, si los agregaste...");
      const avatarUrl = await subirArchivo("avatares", avatarFile, userId, "perfil");
      const identidadUrl = await subirArchivo(
        "verificaciones_identidad",
        identidadFile,
        userId,
        "identidad",
      );
      const zonasFinales = zonasCobertura.length ? zonasCobertura : [location.name];
      const payloadCompleto = {
        id: userId,
        nombre_completo: formData.get("nombre"),
        telefono: formData.get("telefono"),
        oficio_id: oficiosSeleccionados[0],
        oficio_ids: oficiosSeleccionados,
        ubicacion_latitud: location.lat,
        ubicacion_longitud: location.lng,
        nombre_zona: location.name || zonasFinales.filter(Boolean).join(", "),
        zonas_cobertura: zonasFinales.filter(Boolean),
        avatar_url: avatarUrl,
        identidad_url: identidadUrl,
        verificacion_estado: identidadUrl ? "pendiente" : "sin_enviar",
      };

      setEstadoRegistro("Guardando tu perfil profesional...");
      const { error } = await supabase.from("trabajadores").insert(payloadCompleto);

      if (error) {
        console.warn("Fallback a esquema anterior de trabajadores:", error);
        const { error: fallbackError } = await supabase.from("trabajadores").insert({
          id: userId,
          nombre_completo: formData.get("nombre"),
          telefono: formData.get("telefono"),
          oficio_id: oficiosSeleccionados[0],
          ubicacion_latitud: location.lat,
          ubicacion_longitud: location.lng,
          nombre_zona: location.name || zonasFinales.filter(Boolean).join(", "),
        });

        if (fallbackError) throw fallbackError;

        toast.warning(
          "Cuenta creada. Aplica la migración de Supabase para activar multi-oficio, foto y verificación.",
        );
      }

      setEstadoRegistro("Perfil creado. Abriendo tu panel de trabajador...");
      router.push("/trabajador");
    } catch (error) {
      console.error("ERROR AL GUARDAR TRABAJADOR:", error);
      const mensaje = `Error al crear el perfil: ${error.message}`;
      setMensajeError(mensaje);
      setEstadoRegistro("");
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen relative bg-slate-50">
      <Link
        href="/login"
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-slate-600 hover:text-[#14A5B8] transition-colors font-bold z-50 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
      >
        <ArrowLeft className="h-5 w-5" />
        Volver
      </Link>

      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-950 p-12 text-white">
        <Image src="/logo-letras.png" alt="Logo" width={250} height={250} />
        <div className="space-y-5 max-w-md">
          <p className="text-sm uppercase tracking-[0.25em] text-[#14A5B8] font-bold">
            OficioLink Pro
          </p>
          <h1 className="text-5xl font-black leading-tight">
            Perfiles completos para trabajos reales.
          </h1>
          <p className="text-lg text-slate-300">
            Registra tus oficios, zonas, portafolio e identidad desde el inicio.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
          <Tabs defaultValue="cliente">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="trabajador">Trabajador</TabsTrigger>
            </TabsList>

            <TabsContent value="cliente">
              <form onSubmit={(e) => handleRegistro(e, "cliente")} className="grid gap-4">
                <CamposBasicos disabled={loading} />
                <div className="border-t pt-4 mt-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <Label className="text-lg font-bold text-[#14A5B8]">
                      Dirección del Servicio
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => handleGetLocation("cliente")}
                      className="text-[#14A5B8] border-[#14A5B8]"
                    >
                      <MapPin className="h-4 w-4 mr-2" /> Autocompletar con GPS
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CampoDireccion
                        label="Calle"
                        value={direccion.calle}
                        onChange={(value) => setDireccion({ ...direccion, calle: value })}
                      />
                      <CampoDireccion
                        label="Colonia"
                        value={direccion.colonia}
                        onChange={(value) =>
                          setDireccion({ ...direccion, colonia: value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <CampoDireccion
                        label="No. Ext"
                        value={direccion.numero_ext}
                        onChange={(value) =>
                          setDireccion({ ...direccion, numero_ext: value })
                        }
                      />
                      <CampoDireccion
                        label="No. Int"
                        value={direccion.numero_int}
                        required={false}
                        onChange={(value) =>
                          setDireccion({ ...direccion, numero_int: value })
                        }
                      />
                      <CampoDireccion
                        label="C.P."
                        value={direccion.cp}
                        onChange={(value) => setDireccion({ ...direccion, cp: value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Referencias para llegar</Label>
                      <Input
                        placeholder="Ej. Portón negro frente al parque"
                        value={direccion.referencias}
                        onChange={(e) =>
                          setDireccion({ ...direccion, referencias: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <EstadoFormulario
                  loading={loading}
                  estado={estadoRegistro}
                  error={mensajeError}
                />

                <Button disabled={loading} className="bg-[#14A5B8] h-12 mt-4 text-lg">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Creando cuenta...
                    </>
                  ) : (
                    "Crear cuenta de Cliente"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="trabajador">
              <form
                onSubmit={(e) => handleRegistro(e, "trabajador")}
                className="grid gap-5"
              >
                <CamposBasicos disabled={loading} />

                <div className="grid gap-3 border-t pt-5">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-[#14A5B8]" />
                    Oficios que ofreces
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
                </div>

                <div className="grid gap-3 border-t pt-5">
                  <Label className="text-base font-bold">Zonas de cobertura</Label>
                  <Input
                    name="zona"
                    value={location.name}
                    onChange={(e) => setLocation({ ...location, name: e.target.value })}
                    placeholder="Zona principal, municipio o alcaldía"
                    required
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={zonaManual}
                      onChange={(e) => setZonaManual(e.target.value)}
                      placeholder="Agregar otra zona"
                    />
                    <Button type="button" variant="outline" onClick={agregarZonaManual}>
                      Agregar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {zonasSugeridas.map((zona) => (
                      <button
                        type="button"
                        key={zona}
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
                          type="button"
                          key={zona}
                          onClick={() => toggleZona(zona)}
                          className="rounded-full px-3 py-1.5 text-xs font-bold border bg-slate-900 text-white border-slate-900"
                        >
                          {zona} x
                        </button>
                      ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleGetLocation("trabajador")}
                    className="border-[#14A5B8] text-[#14A5B8]"
                  >
                    <MapPin className="h-4 w-4 mr-2" /> Detectar mi ubicación
                  </Button>
                </div>

                <div className="grid gap-4 border-t pt-5">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-[#14A5B8]" />
                    Perfil profesional
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Foto de perfil</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                        Identificación para verificar
                      </Label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setIdentidadFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                </div>

                <EstadoFormulario
                  loading={loading}
                  estado={estadoRegistro}
                  error={mensajeError}
                />

                <Button disabled={loading} className="bg-[#14A5B8] h-12 mt-2">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Creando perfil...
                    </>
                  ) : (
                    "Unirse como experto"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function CampoDireccion({ label, value, onChange, required = true }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

function EstadoFormulario({ loading, estado, error }) {
  if (!loading && !error && !estado) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      aria-live="polite"
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[#14A5B8]/20 bg-[#14A5B8]/10 text-[#0f8494]"
      }`}
    >
      {error ? (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      ) : loading ? (
        <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      <span>{error || estado}</span>
    </div>
  );
}

function CamposBasicos({ disabled = false }) {
  return (
    <>
      <div className="grid gap-2">
        <Label>Nombre Completo</Label>
        <Input name="nombre" disabled={disabled} required />
      </div>
      <div className="grid gap-2">
        <Label>Teléfono</Label>
        <Input name="telefono" type="tel" disabled={disabled} required />
      </div>
      <div className="grid gap-2">
        <Label>Correo</Label>
        <Input name="email" type="email" autoComplete="email" disabled={disabled} required />
      </div>
      <PasswordField
        disabled={disabled}
        autoComplete="new-password"
        helperText="Usa una contraseña segura y revisa Bloq Mayús."
      />
    </>
  );
}
