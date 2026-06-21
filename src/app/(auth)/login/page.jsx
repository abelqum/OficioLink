"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordField from "@/components/ui/PasswordField";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { ArrowLeft } from "lucide-react";
export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [estadoOperacion, setEstadoOperacion] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensajeError("");
    setEstadoOperacion("Verificando correo y contraseña...");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    // 1. Validar correo y contraseña en Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setMensajeError("Correo o contraseña incorrectos. Revisa tus datos e intenta de nuevo.");
      setEstadoOperacion("");
      toast.error("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }
    const userId = authData.user.id;
    setEstadoOperacion("Identificando tu tipo de cuenta...");

    // 2. ¿A dónde lo mandamos? Revisamos si es Trabajador
    const { data: trabajador } = await supabase
      .from("trabajadores")
      .select("id")
      .eq("id", userId)
      .single();

    if (trabajador) {
      // Si encontró su ID en la tabla trabajadores, va para allá
      setEstadoOperacion("Abriendo tu panel de trabajador...");
      toast.success("¡Bienvenido de nuevo!");
      router.push("/trabajador");
    } else {
      // Si no es trabajador, entonces es cliente
      setEstadoOperacion("Abriendo tu panel de cliente...");
      router.push("/cliente");
    }
  };

  return (
    <div className="brand-shell flex min-h-screen relative">
      {/* Columna Izquierda: Branding */}
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-slate-700 lg:text-white/80 hover:text-[#1E6FD9] lg:hover:text-white transition-colors font-bold z-50 bg-white/80 lg:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/40 lg:border-white/15 shadow-sm"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="brand-dark hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
        <div className="w-fit rounded-2xl bg-white px-4 py-3 shadow-2xl shadow-black/20">
          <Image
            src="/logo-letras.png"
            alt="Oficio Link Logo"
            width={180}
            height={54}
            className="h-10 w-auto"
          />
        </div>

        <div className="max-w-lg">
          <div className="brand-eyebrow">Acceso seguro</div>
          <h1 className="mt-6 text-5xl font-black leading-tight">
            Retoma tus servicios con toda la información en orden.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/75">
            Cotizaciones, citas, reseñas y mensajes viven en una experiencia clara.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["Verificación", "Cotización", "Agenda"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-bold text-white/80 backdrop-blur">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Columna Derecha: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="mock-panel w-full max-w-md p-8 md:p-10">
          <div className="mb-10 flex flex-col gap-2">
            <div className="light-eyebrow w-fit">Cuenta</div>
            <h2 className="mt-3 text-3xl font-black text-[#1E0A4E]">
              Bienvenido de Nuevo
            </h2>
            <p className="text-slate-600">Inicia sesión para continuar.</p>
          </div>

          <form onSubmit={handleLogin} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  className="h-11 pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <PasswordField disabled={loading} />

            {(loading || mensajeError) && (
              <div
                role={mensajeError ? "alert" : "status"}
                aria-live="polite"
                className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${
                  mensajeError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-[#14A5B8]/20 bg-[#14A5B8]/10 text-[#0f8494]"
                }`}
              >
                {mensajeError ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
                )}
                <span>{mensajeError || estadoOperacion}</span>
              </div>
            )}

            <Button
              disabled={loading}
              className="brand-gradient-button w-full h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="font-semibold text-[#14A5B8] hover:underline"
            >
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
