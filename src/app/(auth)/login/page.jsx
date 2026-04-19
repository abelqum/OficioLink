"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      toast.error("Correo o contraseña incorrectos."); // <- ¡Así de fácil!
      setLoading(false);
      return;
    }
    const userId = authData.user.id;

    // 2. ¿A dónde lo mandamos? Revisamos si es Trabajador
    const { data: trabajador } = await supabase
      .from("trabajadores")
      .select("id")
      .eq("id", userId)
      .single();

    if (trabajador) {
      // Si encontró su ID en la tabla trabajadores, va para allá
      toast.success("¡Bienvenido de nuevo!");
      router.push("/trabajador");
    } else {
      // Si no es trabajador, entonces es cliente
      router.push("/cliente");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Columna Izquierda: Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#14A5B8] p-12 text-white text-center">
        <Image
          src="/logo-letras.png"
          alt="Oficio Link Logo"
          width={300}
          height={300}
          className="mb-6 w-auto h-auto"
        />
        <h1 className="text-5xl font-extrabold leading-tight tracking-tighter mb-4">
          OFICIO LINK
        </h1>
        <p className="text-xl font-medium max-w-md">
          La red profesional de los oficios. Conectando expertos con
          oportunidades.
        </p>
      </div>

      {/* Columna Derecha: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl shadow-slate-200">
          <div className="mb-10 flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-slate-900">
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
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  name="password"
                  type="password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-slate-600"
                >
                  <EyeOff className="h-5 w-5" />
                </button>
              </div>
            </div>

            <Button
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-[#14A5B8] hover:bg-[#0f8494]"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                "Iniciar Sesión"
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
