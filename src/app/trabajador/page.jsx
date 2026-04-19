"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bell,
  MapPin,
  Banknote,
  Clock,
  CheckCircle2,
  Loader2,
  TrendingUp,
  User,
  Calendar,
  ImageIcon,
  Upload,
  Trash2,
} from "lucide-react";
import BotonSalir from "@/components/ui/BotonSalir";
import BotonEliminar from "@/components/ui/BotonEliminar"; // Importamos el nuevo botón
import Image from "next/image";

export default function TrabajadorDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState([]);
  const [portafolios, setPortafolios] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [subiendo, setSubiendo] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [descripcionFoto, setDescripcionFoto] = useState("");

  const cargarDatos = async (userId) => {
    // Cambia la consulta de solicitudes a esto:
    const { data: dataSol } = await supabase
      .from("solicitudes")
      .select(
        `
    *, 
    usuarios(nombre_completo, telefono, calle, numero_ext, numero_int, colonia, codigo_postal, referencias)
  `,
      )
      .eq("trabajador_id", userId)
      .order("creado_en", { ascending: false });

    if (dataSol) setSolicitudes(dataSol);

    const { data: dataFotos } = await supabase
      .from("portafolios")
      .select("*")
      .eq("trabajador_id", userId)
      .order("creado_en", { ascending: false });

    if (dataFotos) setPortafolios(dataFotos);

    setLoading(false);
  };

  useEffect(() => {
    const verificarAcceso = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      const { data: trabajador, error } = await supabase
        .from("trabajadores")
        .select(`*, oficios(nombre)`)
        .eq("id", session.user.id)
        .single();

      if (error || !trabajador) return router.push("/cliente");

      setPerfil(trabajador);
      cargarDatos(session.user.id);
    };

    verificarAcceso();
  }, [router, supabase]);

  const actualizarEstado = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from("solicitudes")
      .update({ estado: nuevoEstado })
      .eq("id", id);
    if (!error)
      setSolicitudes(
        solicitudes.map((s) =>
          s.id === id ? { ...s, estado: nuevoEstado } : s,
        ),
      );
  };

  const subirFoto = async (e) => {
    e.preventDefault();
    if (!archivo) return toast.error("Selecciona una imagen primero");

    setSubiendo(true);

    try {
      const fileExt = archivo.name.split(".").pop();
      const fileName = `${perfil.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos_trabajos")
        .upload(filePath, archivo);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("fotos_trabajos").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("portafolios").insert({
        trabajador_id: perfil.id,
        imagen_url: publicUrl,
        descripcion: descripcionFoto,
      });

      if (dbError) throw dbError;

      setArchivo(null);
      setDescripcionFoto("");
      document.getElementById("foto-input").value = "";
      toast.success("¡Foto subida con éxito!");
      cargarDatos(perfil.id);
    } catch (error) {
      console.error(error);
      toast.error("Error al subir la foto: " + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarFoto = async (id, url) => {
    if (!confirm("¿Seguro que deseas eliminar esta foto?")) return;

    await supabase.from("portafolios").delete().eq("id", id);

    const nombreArchivo = url.split("/").pop();
    await supabase.storage.from("fotos_trabajos").remove([nombreArchivo]);

    cargarDatos(perfil.id);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#14A5B8]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-letras.png"
              alt="Oficio Link"
              width={110}
              height={35}
              className="h-7 w-auto"
            />
            <Badge
              variant="outline"
              className="hidden sm:flex border-[#14A5B8] text-[#14A5B8] bg-[#14A5B8]/5"
            >
              Panel del Experto
            </Badge>
          </div>

          {/* Aquí agrupamos los botones de sesión y eliminar cuenta */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <BotonSalir />
            {perfil && (
              <BotonEliminar tipoUsuario="trabajador" userId={perfil.id} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="w-64 h-64 text-[#14A5B8]" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-[#14A5B8] font-semibold tracking-wider uppercase text-sm mb-2">
                ¡Hola, {perfil?.nombre_completo.split(" ")[0]}!
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Bienvenido a tu <br /> jornada laboral
              </h1>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                  <MapPin className="h-4 w-4 text-[#14A5B8]" />
                  <span className="text-sm font-medium">
                    {perfil?.nombre_zona}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                  <CheckCircle2 className="h-4 w-4 text-[#14A5B8]" />
                  <span className="text-sm font-medium">
                    {perfil?.oficios?.nombre}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Solicitudes de hoy
            </h2>
            {solicitudes.length === 0 ? (
              <Card className="border-dashed border-2 py-20 text-center">
                <p className="text-slate-500 font-medium">
                  Aún no hay servicios solicitados.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {solicitudes.map((sol) => (
                  <Card
                    key={sol.id}
                    className="group border-0 shadow-sm bg-white overflow-hidden"
                  >
                    <div className="flex">
                      <div
                        className={`w-2 ${sol.estado === "pendiente" ? "bg-amber-400" : sol.estado === "en_proceso" ? "bg-[#14A5B8]" : "bg-green-500"}`}
                      />
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-4 items-center">
                            <div className="bg-slate-100 h-12 w-12 rounded-full flex items-center justify-center">
                              <User className="text-slate-400 h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-slate-900">
                                {sol.usuarios?.nombre_completo}
                              </h3>
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />{" "}
                                {new Date(sol.creado_en).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className="uppercase text-[10px] px-3 py-1 bg-slate-100 text-slate-700">
                            {sol.estado.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              Detalle del servicio
                            </p>
                            <p className="text-sm text-slate-700 font-medium">
                              {sol.servicio_detalle}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              Pago esperado
                            </p>
                            <p className="text-sm text-slate-700 flex items-center gap-1 font-medium">
                              <Banknote className="h-4 w-4 text-green-500" />{" "}
                              {sol.metodo_pago}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                          {sol.estado === "pendiente" && (
                            <Button
                              onClick={() =>
                                actualizarEstado(sol.id, "en_proceso")
                              }
                              className="flex-1 bg-[#14A5B8] hover:bg-[#0f8494]"
                            >
                              Aceptar Trabajo
                            </Button>
                          )}
                          {sol.estado === "en_proceso" && (
                            <Button
                              onClick={() =>
                                actualizarEstado(sol.id, "completado")
                              }
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              Finalizar Trabajo
                            </Button>
                          )}
                        </div>
                        {/* Agrega esto dentro del div "flex-1 p-6" de la tarjeta del trabajador */}
                        <div className="bg-slate-50 p-4 rounded-xl mt-4 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Dirección del Cliente
                          </p>
                          <p className="text-sm font-medium text-slate-800">
                            {sol.usuarios?.calle} #{sol.usuarios?.numero_ext}
                            {sol.usuarios?.numero_int
                              ? ` (Int. ${sol.usuarios?.numero_int})`
                              : ""}
                            ,{sol.usuarios?.colonia}, C.P.{" "}
                            {sol.usuarios?.codigo_postal}
                          </p>
                          {sol.usuarios?.referencias && (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              {sol.usuarios?.referencias}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-[#14A5B8]" />
              Mi Portafolio
            </h2>

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-md">Subir nuevo trabajo</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={subirFoto} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="foto-input">Imagen (JPG, PNG)</Label>
                    <Input
                      id="foto-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setArchivo(e.target.files[0])}
                      className="cursor-pointer file:bg-[#14A5B8] file:text-white file:border-0 file:rounded-md file:px-4 file:py-1 hover:file:bg-[#0f8494]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descripción corta</Label>
                    <Input
                      placeholder="Ej. Instalación de centro de carga"
                      value={descripcionFoto}
                      onChange={(e) => setDescripcionFoto(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <Button
                    disabled={subiendo || !archivo}
                    type="submit"
                    className="w-full bg-slate-900"
                  >
                    {subiendo ? (
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {subiendo ? "Subiendo..." : "Subir a mi perfil"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {portafolios.map((foto) => (
                <div
                  key={foto.id}
                  className="relative group rounded-xl overflow-hidden shadow-sm h-32 bg-slate-200"
                >
                  <img
                    src={foto.imagen_url}
                    alt="Portafolio"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button
                      onClick={() => eliminarFoto(foto.id, foto.imagen_url)}
                      className="self-end text-red-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <p className="text-white text-[10px] truncate">
                      {foto.descripcion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
