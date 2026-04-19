"use client";
import { useState, useEffect, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  ShieldCheck,
  Banknote,
  Phone,
  ArrowLeft,
  Star,
  Loader2,
  CreditCard,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PerfilTrabajador({ params }) {
  const { id } = use(params);
  const supabase = createClient();
  const router = useRouter();

  const [trabajador, setTrabajador] = useState(null);
  const [portafolios, setPortafolios] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para el pago
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [loadingPago, setLoadingPago] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) setUsuarioActual(session.user);

      // 1. Buscamos la info del trabajador
      const { data: dataTrabajador, error: errTrabajador } = await supabase
        .from("trabajadores")
        .select(`*, oficios(nombre, costo_defecto)`)
        .eq("id", id)
        .single();

      if (errTrabajador) {
        toast.error("Trabajador no encontrado");
        router.push("/cliente");
        return;
      }

      // 2. Buscamos sus fotos del portafolio
      const { data: dataFotos } = await supabase
        .from("portafolios")
        .select("*")
        .eq("trabajador_id", id)
        .order("creado_en", { ascending: false });

      setTrabajador(dataTrabajador);
      if (dataFotos) setPortafolios(dataFotos);

      setLoading(false);
    };

    cargarDatos();
  }, [id, router, supabase]);

  const contactarWhatsApp = () => {
    const numeroLimpio = trabajador.telefono.replace(/\D/g, "");
    const numeroFinal = numeroLimpio.startsWith("52")
      ? numeroLimpio
      : `52${numeroLimpio}`;
    const mensaje = `Hola ${trabajador.nombre_completo}, te encontré en Oficio Link. Me interesa cotizar un servicio de ${trabajador.oficios?.nombre}. ¿Estás disponible?`;
    const url = `https://wa.me/${numeroFinal}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  const procesarContratacion = async (e) => {
    e.preventDefault();
    if (!usuarioActual)
      return toast.error("Debes iniciar sesión para contratar.");

    setLoadingPago(true);

    const { error } = await supabase.from("solicitudes").insert({
      cliente_id: usuarioActual.id,
      trabajador_id: trabajador.id,
      servicio_detalle: `Contratación directa. Oficio: ${trabajador.oficios?.nombre}`,
      metodo_pago:
        metodoPago === "efectivo" ? "Efectivo" : "Tarjeta (Simulado)",
    });

    setLoadingPago(false);

    // 👇 ¡AQUÍ ESTÁ EL CAMBIO PARA VER EL ERROR! 👇
    if (error) {
      console.error("🚨 ERROR DE SUPABASE:", error);
      toast.error(`Error DB: ${error.message}`);
      return;
    }

    setPagoExitoso(true);
    setTimeout(() => {
      setPagoExitoso(false);
      router.push("/cliente");
    }, 3000);
  };
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#14A5B8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      {/* Encabezado Azul */}
      <div className="bg-[#14A5B8] h-48 relative">
        <div className="max-w-5xl mx-auto px-6 pt-6">
          <Link href="/cliente">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al buscador
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 space-y-8">
        {/* TARJETA PRINCIPAL DEL PERFIL */}
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg bg-slate-100">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${trabajador.nombre_completo}`}
                />
                <AvatarFallback>
                  {trabajador.nombre_completo.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-extrabold text-slate-900">
                    {trabajador.nombre_completo}
                  </h1>
                  <ShieldCheck
                    className="h-6 w-6 text-green-500"
                    title="Perfil Verificado"
                  />
                  <Badge className="bg-[#14A5B8]/10 text-[#14A5B8] hover:bg-[#14A5B8]/20 border-0">
                    {trabajador.oficios?.nombre}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-yellow-500">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="text-slate-600 font-medium ml-1">
                    5.0 Excelencia
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 border-t pt-10">
              {/* Columna Izquierda: Info */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Detalles del Servicio
                </h3>

                <div className="space-y-4 text-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <MapPin className="h-5 w-5 text-[#14A5B8]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Zona de Cobertura
                      </p>
                      <p className="font-medium text-slate-900">
                        {trabajador.nombre_zona}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <Banknote className="h-5 w-5 text-[#14A5B8]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Costo Estimado Base
                      </p>
                      <p className="font-medium text-slate-900">
                        ${trabajador.oficios?.costo_defecto} MXN
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Contratación */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Contratar Experto
                </h3>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full h-14 text-lg bg-[#14A5B8] hover:bg-[#0f8494] shadow-lg shadow-[#14A5B8]/30 text-white rounded-xl">
                      <Banknote className="mr-2 h-5 w-5" />
                      Solicitar Servicio
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Confirmar Solicitud</DialogTitle>
                      <DialogDescription>
                        Selecciona cómo pagarás el servicio de{" "}
                        {trabajador.nombre_completo}.
                      </DialogDescription>
                    </DialogHeader>

                    {!pagoExitoso ? (
                      <form
                        onSubmit={procesarContratacion}
                        className="grid gap-4 py-4"
                      >
                        <div className="grid gap-2">
                          <Label>Método de Pago</Label>
                          <Select
                            value={metodoPago}
                            onValueChange={setMetodoPago}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un método" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="efectivo">
                                Pago en Efectivo (Al terminar)
                              </SelectItem>
                              <SelectItem value="tarjeta">
                                Pago con Tarjeta (Seguro)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {metodoPago === "tarjeta" && (
                          <div className="grid gap-4 mt-2 p-4 bg-slate-50 rounded-xl border">
                            <div className="grid gap-2">
                              <Label>Número de Tarjeta</Label>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  placeholder="0000 0000 0000 0000"
                                  maxLength="16"
                                  className="pl-9"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>Vencimiento</Label>
                                <Input
                                  placeholder="MM/YY"
                                  maxLength="5"
                                  required
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>CVC</Label>
                                <Input
                                  placeholder="123"
                                  maxLength="3"
                                  type="password"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {metodoPago === "efectivo" && (
                          <p className="text-sm text-slate-500 bg-amber-50 p-3 rounded-xl border border-amber-100 mt-2">
                            Pagarás directamente al experto una vez finalizado
                            el trabajo. Acuerda el precio final en persona.
                          </p>
                        )}

                        <DialogFooter className="mt-4">
                          <Button
                            disabled={loadingPago}
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800"
                          >
                            {loadingPago ? (
                              <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                              "Confirmar Solicitud"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    ) : (
                      <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <h3 className="text-xl font-bold text-slate-900">
                          ¡Solicitud Enviada!
                        </h3>
                        <p className="text-slate-500">
                          El trabajador ha sido notificado en su panel.
                        </p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold">
                    o escríbele directo
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <Button
                  onClick={contactarWhatsApp}
                  variant="outline"
                  className="w-full h-12 text-md border-green-500 text-green-600 hover:bg-green-50 rounded-xl font-semibold"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Mensaje por WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NUEVA SECCIÓN: GALERÍA DE TRABAJOS */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-[#14A5B8]" />
            Trabajos Anteriores
          </h2>

          {portafolios.length === 0 ? (
            <Card className="border-dashed border-2 py-12 text-center bg-transparent">
              <p className="text-slate-500">
                Este experto aún no ha subido fotos de sus trabajos.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {portafolios.map((foto) => (
                <div
                  key={foto.id}
                  className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all h-64 bg-slate-200"
                >
                  <img
                    src={foto.imagen_url}
                    alt={foto.descripcion || "Trabajo realizado"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {foto.descripcion && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                      <p className="text-white text-sm font-medium">
                        {foto.descripcion}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
