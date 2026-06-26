"use client";

import { useEffect, useRef, useState } from "react";
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
  Plus,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { verificarIdentidadLocal } from "@/lib/identityVerification";

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
  const [passwordRegistro, setPasswordRegistro] = useState("");
  const [passwordValida, setPasswordValida] = useState(false);
  const [pasoTrabajador, setPasoTrabajador] = useState(1);
  const [datosTrabajador, setDatosTrabajador] = useState({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [oficios, setOficios] = useState([]);
  const [oficiosSeleccionados, setOficiosSeleccionados] = useState([]);
  const [zonasCobertura, setZonasCobertura] = useState([]);
  const [zonaManual, setZonaManual] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [identidadFile, setIdentidadFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [resultadoVerificacion, setResultadoVerificacion] = useState(null);
  const [verificandoIdentidad, setVerificandoIdentidad] = useState(false);
  const verificacionSecuencia = useRef(0);
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

  const actualizarDatoTrabajador = (campo, valor) => {
    setDatosTrabajador((actuales) => ({ ...actuales, [campo]: valor }));
  };

  const revisarIdentidadAutomatica = async (documento, selfie) => {
    verificacionSecuencia.current += 1;
    const solicitudActual = verificacionSecuencia.current;

    if (!documento || !selfie) {
      setResultadoVerificacion(null);
      setVerificandoIdentidad(false);
      return;
    }

    setVerificandoIdentidad(true);
    setResultadoVerificacion(null);

    try {
      const resultado = await verificarIdentidadLocal(documento, selfie);
      if (verificacionSecuencia.current === solicitudActual) {
        setResultadoVerificacion(resultado);
      }
    } catch (error) {
      if (verificacionSecuencia.current !== solicitudActual) return;
      setResultadoVerificacion({
        estado: "pendiente",
        score: null,
        metodo: "comparacion_facial_local",
        mensaje: `Archivos recibidos. No se pudo completar la revisión automática: ${error.message}`,
      });
    } finally {
      if (verificacionSecuencia.current === solicitudActual) {
        setVerificandoIdentidad(false);
      }
    }
  };

  const seleccionarIdentidad = (archivo) => {
    setIdentidadFile(archivo);
    revisarIdentidadAutomatica(archivo, selfieFile);
  };

  const seleccionarSelfie = (archivo) => {
    setSelfieFile(archivo);
    revisarIdentidadAutomatica(identidadFile, archivo);
  };

  const avanzarPasoTrabajador = () => {
    setMensajeError("");
    if (pasoTrabajador === 1) {
      if (
        !datosTrabajador.nombre.trim() ||
        !datosTrabajador.telefono.trim() ||
        !datosTrabajador.email.trim()
      ) {
        const mensaje = "Completa nombre, teléfono y correo para continuar.";
        setMensajeError(mensaje);
        toast.error(mensaje);
        return;
      }
      if (!passwordValida) {
        const mensaje =
          "La contraseña debe incluir al menos una mayúscula y un símbolo especial.";
        setMensajeError(mensaje);
        toast.error(mensaje);
        return;
      }
    }

    if (pasoTrabajador === 2) {
      if (!oficiosSeleccionados.length) {
        const mensaje = "Selecciona al menos un oficio que ofreces.";
        setMensajeError(mensaje);
        toast.error(mensaje);
        return;
      }
      if (!location.name.trim()) {
        const mensaje = "Escribe tu zona principal de trabajo.";
        setMensajeError(mensaje);
        toast.error(mensaje);
        return;
      }
    }

    setPasoTrabajador((actual) => Math.min(actual + 1, 3));
  };

  const retrocederPasoTrabajador = () => {
    setMensajeError("");
    setPasoTrabajador((actual) => Math.max(actual - 1, 1));
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

    if (tipo === "trabajador" && pasoTrabajador < 3) {
      avanzarPasoTrabajador();
      return;
    }

    setLoading(true);
    setMensajeError("");
    setEstadoRegistro("Creando tu cuenta segura...");
    const formData = new FormData(e.target);
    const nombreRegistro =
      tipo === "trabajador" ? datosTrabajador.nombre : formData.get("nombre");
    const telefonoRegistro =
      tipo === "trabajador" ? datosTrabajador.telefono : formData.get("telefono");
    const emailRegistro =
      tipo === "trabajador" ? datosTrabajador.email : formData.get("email");
    const password =
      tipo === "trabajador"
        ? passwordRegistro
        : formData.get("password")?.toString() || "";

    if (
      tipo === "trabajador" &&
      (!nombreRegistro?.trim() || !telefonoRegistro?.trim() || !emailRegistro?.trim())
    ) {
      const mensaje = "Completa tus datos personales antes de crear la cuenta.";
      setMensajeError(mensaje);
      setEstadoRegistro("");
      toast.error(mensaje);
      setLoading(false);
      setPasoTrabajador(1);
      return;
    }

    if (!/[A-ZÁÉÍÓÚÑ]/.test(password) || !/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]/.test(password)) {
      const mensaje =
        "La contraseña debe incluir al menos una letra mayúscula y un símbolo especial.";
      setMensajeError(mensaje);
      setEstadoRegistro("");
      toast.error(mensaje);
      setLoading(false);
      return;
    }

    if (tipo === "trabajador" && oficiosSeleccionados.length === 0) {
      const mensaje = "Selecciona al menos un oficio.";
      setMensajeError(mensaje);
      setEstadoRegistro("");
      toast.error(mensaje);
      setLoading(false);
      setPasoTrabajador(2);
      return;
    }

    if (tipo === "trabajador" && !location.name.trim()) {
      const mensaje = "Indica tu zona principal de trabajo.";
      setMensajeError(mensaje);
      setEstadoRegistro("");
      toast.error(mensaje);
      setLoading(false);
      setPasoTrabajador(2);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailRegistro,
      password,
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
        nombre_completo: nombreRegistro,
        telefono: telefonoRegistro,
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
      const tieneIdentidadCompleta = Boolean(identidadFile && selfieFile);
      const tieneIdentidadParcial = Boolean(identidadFile || selfieFile);
      setEstadoRegistro(
        tieneIdentidadCompleta
          ? "Revisando identificación y foto del rostro..."
          : "Creando perfil sin verificación de identidad...",
      );
      const resultadoIdentidad =
        resultadoVerificacion ||
        (tieneIdentidadCompleta
          ? await verificarIdentidadLocal(identidadFile, selfieFile)
          : null);
      setResultadoVerificacion(resultadoIdentidad);

      setEstadoRegistro(
        tieneIdentidadCompleta ? "Subiendo foto y documentos..." : "Guardando tu perfil...",
      );
      const avatarUrl = await subirArchivo("avatares", avatarFile, userId, "perfil");
      const identidadUrl = await subirArchivo(
        "verificaciones_identidad",
        identidadFile,
        userId,
        "identidad",
      );
      const selfieUrl = await subirArchivo(
        "verificaciones_identidad",
        selfieFile,
        userId,
        "selfie",
      );
      const zonasFinales = zonasCobertura.length ? zonasCobertura : [location.name];
      const payloadCompleto = {
        id: userId,
        nombre_completo: nombreRegistro,
        telefono: telefonoRegistro,
        oficio_id: oficiosSeleccionados[0],
        oficio_ids: oficiosSeleccionados,
        ubicacion_latitud: location.lat,
        ubicacion_longitud: location.lng,
        nombre_zona: location.name || zonasFinales.filter(Boolean).join(", "),
        zonas_cobertura: zonasFinales.filter(Boolean),
        avatar_url: avatarUrl,
        identidad_url: identidadUrl,
        identidad_selfie_url: selfieUrl,
        verificacion_estado:
          resultadoIdentidad?.estado || (tieneIdentidadParcial ? "pendiente" : "sin_enviar"),
        verificacion_score: resultadoIdentidad?.score ?? null,
        verificacion_metodo: resultadoIdentidad?.metodo || null,
        verificacion_mensaje:
          resultadoIdentidad?.mensaje ||
          (tieneIdentidadParcial
            ? "Recibimos parte de tus documentos. Sube identificación y foto del rostro para completar la verificación."
            : "Aún no envías una identificación. Los clientes podrían confiar menos en tu perfil hasta que completes la verificación."),
        verificacion_actualizada_en:
          resultadoIdentidad || tieneIdentidadParcial ? new Date().toISOString() : null,
      };

      setEstadoRegistro("Guardando tu perfil profesional...");
      const { error } = await supabase.from("trabajadores").insert(payloadCompleto);

      if (error) {
        console.warn("Fallback a esquema anterior de trabajadores:", error);
        const { error: fallbackError } = await supabase.from("trabajadores").insert({
          id: userId,
          nombre_completo: nombreRegistro,
          telefono: telefonoRegistro,
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

      if (!tieneIdentidadCompleta) {
        toast.warning(
          "Cuenta creada sin verificación. Puedes subir tu INE y foto de rostro después para generar más confianza.",
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
                <CamposBasicos
                  disabled={loading}
                  password={passwordRegistro}
                  onPasswordChange={(event) => setPasswordRegistro(event.target.value)}
                  onPasswordValidityChange={setPasswordValida}
                />
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

                <Button
                  disabled={loading || !passwordValida}
                  className="bg-[#14A5B8] h-12 mt-4 text-lg"
                >
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
                <PasoTrabajadorIndicador paso={pasoTrabajador} />

                {pasoTrabajador === 1 && (
                  <div className="grid gap-5">
                    <StepHeader
                      icon={User}
                      title="Datos de acceso"
                      description="Primero crea tus datos básicos. Con esto podrás iniciar sesión y recibir avisos de clientes."
                    />
                    <CamposBasicos
                      disabled={loading}
                      datos={datosTrabajador}
                      onDatoChange={actualizarDatoTrabajador}
                      password={passwordRegistro}
                      onPasswordChange={(event) =>
                        setPasswordRegistro(event.target.value)
                      }
                      onPasswordValidityChange={setPasswordValida}
                    />
                  </div>
                )}

                {pasoTrabajador === 2 && (
                  <div className="grid gap-6">
                    <StepHeader
                      icon={Camera}
                      title="Perfil profesional"
                      description="Ahora dinos qué servicios ofreces, dónde trabajas y qué foto verán los clientes."
                    />

                    <div className="grid gap-3">
                      <Label className="text-base font-bold flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-[#14A5B8]" />
                        Oficios que ofreces
                      </Label>
                      <p className="text-sm text-slate-500">
                        Puedes elegir más de uno. Esto ayuda a que aparezcas en
                        búsquedas correctas.
                      </p>
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

                    <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <Label className="text-base font-bold">
                          ¿Dónde puedes trabajar?
                        </Label>
                        <p className="mt-1 text-sm text-slate-500">
                          Escribe tu zona principal y agrega otras zonas cercanas
                          si también puedes atender servicios ahí.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Zona principal</Label>
                        <Input
                          name="zona"
                          value={location.name}
                          onChange={(e) =>
                            setLocation({ ...location, name: e.target.value })
                          }
                          placeholder="Ej. Centro de Monterrey, Guadalupe, San Pedro"
                        />
                        <p className="text-xs text-slate-500">
                          Esta será la primera zona que verán los clientes en tu perfil.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Zonas adicionales opcionales</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={zonaManual}
                            onChange={(e) => setZonaManual(e.target.value)}
                            placeholder="Ej. Cumbres, Apodaca, Área metropolitana"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={agregarZonaManual}
                            className="sm:w-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">
                          Sugerencias rápidas
                        </p>
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
                        </div>
                        <p className="text-xs text-slate-500">
                          Toca una sugerencia para agregarla o quitarla.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-bold text-slate-800">
                          Zonas adicionales seleccionadas
                        </p>
                        {zonasCobertura.length === 0 ? (
                          <p className="mt-2 text-sm text-slate-500">
                            Aún no agregas zonas extra. Puedes continuar solo con
                            tu zona principal.
                          </p>
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {zonasCobertura.map((zona) => (
                              <button
                                type="button"
                                key={zona}
                                onClick={() => toggleZona(zona)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                              >
                                {zona}
                                <X className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleGetLocation("trabajador")}
                          className="w-full border-[#14A5B8] text-[#14A5B8]"
                        >
                          <MapPin className="h-4 w-4 mr-2" /> Usar mi ubicación actual
                        </Button>
                        <p className="text-xs text-slate-500">
                          Esto intenta llenar tu zona principal con la ubicación
                          del navegador. Revísala antes de crear tu cuenta.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Foto de perfil</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-slate-500">
                        Usa una foto clara. Será visible en tu perfil público.
                      </p>
                    </div>
                  </div>
                )}

                {pasoTrabajador === 3 && (
                  <div className="grid gap-5">
                    <StepHeader
                      icon={ShieldCheck}
                      title="Verificación de identidad"
                      description="Puedes crear tu cuenta ahora y subir tu INE después. Verificarte ayuda a que los clientes confíen más al contratarte."
                    />

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      La verificación no es obligatoria en este momento. Si la dejas
                      pendiente, tu perfil aparecerá sin confirmar y algunos clientes
                      podrían sentirse menos seguros al elegir tus servicios.
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-blue-500" />
                          INE o identificación
                        </Label>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => seleccionarIdentidad(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-slate-500">
                          Puede ser una foto del INE o un PDF. Si quieres revisión
                          automática de rostro, usa una foto clara.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-blue-500" />
                          Selfie para comparar rostro
                        </Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => seleccionarSelfie(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-slate-500">
                          Rostro de frente, buena iluminación y sin lentes oscuros.
                        </p>
                      </div>
                    </div>

                    {verificandoIdentidad && (
                      <div
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-3 rounded-2xl border border-[#14A5B8]/20 bg-[#14A5B8]/10 p-4 text-sm font-semibold text-[#0f8494]"
                      >
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Revisando tus archivos automáticamente...
                      </div>
                    )}

                    {!identidadFile && !selfieFile && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="font-black text-slate-900">
                          Puedes continuar sin documentos
                        </p>
                        <p className="mt-1">
                          Tu cuenta se creará, pero el perfil quedará como no
                          verificado. Podrás completar este paso después desde tus
                          ajustes.
                        </p>
                      </div>
                    )}

                    {(identidadFile && !selfieFile) || (!identidadFile && selfieFile) ? (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                        Para intentar la revisión automática necesitas subir ambos:
                        identificación y foto del rostro. Si continúas así, la
                        verificación quedará pendiente.
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="font-black text-slate-900">Resumen antes de crear</p>
                      <div className="mt-3 grid gap-2">
                        <p>
                          <span className="font-bold">Nombre:</span>{" "}
                          {datosTrabajador.nombre || "Pendiente"}
                        </p>
                        <p>
                          <span className="font-bold">Oficios:</span>{" "}
                          {oficiosSeleccionados.length
                            ? oficios
                                .filter((oficio) =>
                                  oficiosSeleccionados.includes(oficio.id),
                                )
                                .map((oficio) => oficio.nombre)
                                .join(", ")
                            : "Pendiente"}
                        </p>
                        <p>
                          <span className="font-bold">Zona principal:</span>{" "}
                          {location.name || "Pendiente"}
                        </p>
                      </div>
                    </div>

                    {resultadoVerificacion && (
                      <VerificationResult result={resultadoVerificacion} />
                    )}
                  </div>
                )}

                <EstadoFormulario
                  loading={loading}
                  estado={estadoRegistro}
                  error={mensajeError}
                />

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={retrocederPasoTrabajador}
                    disabled={loading || pasoTrabajador === 1}
                    className="rounded-xl"
                  >
                    Atrás
                  </Button>

                  {pasoTrabajador < 3 ? (
                    <Button
                      type="button"
                      onClick={avanzarPasoTrabajador}
                      disabled={loading}
                      className="bg-[#14A5B8] h-12 rounded-xl font-bold"
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading || verificandoIdentidad}
                      className="bg-[#14A5B8] h-12 rounded-xl font-bold"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          Creando perfil...
                        </>
                      ) : (
                        "Crear cuenta de técnico"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

const pasosTrabajador = [
  { numero: 1, titulo: "Datos" },
  { numero: 2, titulo: "Perfil" },
  { numero: 3, titulo: "Identidad" },
];

function PasoTrabajadorIndicador({ paso }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-2">
      {pasosTrabajador.map((item) => {
        const activo = paso === item.numero;
        const completado = paso > item.numero;
        return (
          <div
            key={item.numero}
            className={`rounded-xl border px-3 py-3 text-center text-xs font-black transition-colors ${
              activo
                ? "border-[#14A5B8] bg-white text-[#0f8494] shadow-sm"
                : completado
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-transparent text-slate-400"
            }`}
          >
            <span className="block text-[10px] uppercase tracking-widest">
              Paso {item.numero}
            </span>
            <span>{item.titulo}</span>
          </div>
        );
      })}
    </div>
  );
}

function StepHeader({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14A5B8]/10 text-[#0f8494]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
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

function VerificationResult({ result }) {
  const styles =
    result.estado === "verificado"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : result.estado === "rechazado"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className={`rounded-2xl border p-4 text-sm ${styles}`}>
      <p className="font-black">
        Resultado automático: {result.estado}
        {result.score !== null && result.score !== undefined
          ? ` · similitud ${Math.round(Number(result.score))}%`
          : ""}
      </p>
      <p className="mt-1">{result.mensaje}</p>
    </div>
  );
}

function CamposBasicos({
  disabled = false,
  datos,
  onDatoChange,
  password,
  onPasswordChange,
  onPasswordValidityChange,
}) {
  const controlledProps = (campo) =>
    datos && onDatoChange
      ? {
          value: datos[campo],
          onChange: (event) => onDatoChange(campo, event.target.value),
        }
      : {};

  return (
    <>
      <div className="grid gap-2">
        <Label>Nombre Completo</Label>
        <Input
          name="nombre"
          placeholder="Ej. Juan Pérez García"
          autoComplete="name"
          disabled={disabled}
          required
          {...controlledProps("nombre")}
        />
      </div>
      <div className="grid gap-2">
        <Label>Teléfono</Label>
        <Input
          name="telefono"
          type="tel"
          placeholder="Ej. 55 5555 5555"
          autoComplete="tel"
          disabled={disabled}
          required
          {...controlledProps("telefono")}
        />
      </div>
      <div className="grid gap-2">
        <Label>Correo</Label>
        <Input
          name="email"
          type="email"
          placeholder="Ej. nombre@correo.com"
          autoComplete="email"
          disabled={disabled}
          required
          {...controlledProps("email")}
        />
      </div>
      <PasswordField
        disabled={disabled}
        autoComplete="new-password"
        placeholder="Ej. TrabajoSeguro#25"
        helperText="Debe incluir una mayúscula y un símbolo especial."
        showStrength
        value={password}
        onChange={onPasswordChange}
        onValidityChange={onPasswordValidityChange}
      />
    </>
  );
}
