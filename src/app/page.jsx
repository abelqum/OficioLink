import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MapPin, Zap, ChevronRight, Wrench } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. BARRA DE NAVEGACIÓN */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* Logo de Oficio Link */}
            <Image
              src="/logo.png"
              alt="Oficio Link Logo"
              width={150}
              height={50}
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-[#14A5B8]"
            >
              Iniciar Sesión
            </Link>
            <Link href="/registro">
              <Button className="bg-[#14A5B8] hover:bg-[#0f8494] text-white">
                Regístrate Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. SECCIÓN HERO (Principal) */}
      <main className="flex-1">
        <section className="relative bg-slate-900 overflow-hidden">
          {/* Fondo decorativo con tu color de marca */}
          <div className="absolute inset-0 bg-[#14A5B8]/10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#14A5B8]/20 via-slate-900 to-slate-900"></div>

          <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32 flex flex-col items-center text-center">
            <BadgeOficio />
            <h1 className="mt-8 text-5xl sm:text-7xl font-extrabold text-white tracking-tight max-w-4xl">
              El experto ideal para tu hogar,{" "}
              <span className="text-[#14A5B8]">a un clic de distancia.</span>
            </h1>
            <p className="mt-6 text-xl text-slate-300 max-w-2xl">
              Oficio Link es la red profesional que conecta a clientes con
              plomeros, electricistas, carpinteros y más expertos locales de
              confianza.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/registro" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-14 px-8 text-lg bg-[#14A5B8] hover:bg-[#0f8494]">
                  Necesito un Servicio <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/registro" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 text-lg bg-transparent border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
                >
                  Soy Trabajador
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 3. SECCIÓN DE BENEFICIOS */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">
                ¿Por qué usar Oficio Link?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Diseñado para darte seguridad y rapidez en cada trabajo.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <FeatureCard
                icon={<MapPin className="h-8 w-8 text-[#14A5B8]" />}
                title="Cerca de ti"
                description="Nuestro mapa inteligente te conecta con los trabajadores más cercanos a tu ubicación en tiempo real."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-8 w-8 text-[#14A5B8]" />}
                title="Perfiles Verificados"
                description="Revisa calificaciones, reseñas y el historial de trabajos de cada experto antes de contratarlo."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-[#14A5B8]" />}
                title="Contacto Inmediato"
                description="Sin intermediarios lentos. Chatea o llama al trabajador al instante y acuerda el servicio."
              />
            </div>
          </div>
        </section>
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-slate-50 border-t py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <Image
              src="/logo-letras.png"
              alt="Logo"
              width={100}
              height={30}
              className="h-6 w-auto"
            />
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Oficio Link. Proyecto Escolar - Todos
            los derechos reservados.
          </p>
          <div className="flex gap-4 text-sm font-medium text-slate-600">
            <span className="hover:text-[#14A5B8] cursor-pointer">
              Términos
            </span>
            <span className="hover:text-[#14A5B8] cursor-pointer">
              Privacidad
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Subcomponente para el pequeño botón decorativo arriba del título
function BadgeOficio() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-sm text-slate-300">
      <Wrench className="h-4 w-4 text-[#14A5B8]" />
      <span>La nueva era de los oficios</span>
    </div>
  );
}

// Subcomponente para las tarjetas de beneficios
function FeatureCard({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
