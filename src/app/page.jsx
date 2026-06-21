import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
  Droplet,
  Paintbrush,
} from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-[#14A5B8] selection:text-white">
      {/* NAVBAR PÚBLICO */}
      <nav className="fixed top-0 w-full bg-[#14A5B8] backdrop-blur-md z-50 border-b border-[#14A5B8] ">
        <div className="max-w-7xl mx-auto px-12 h-20 flex items-center justify-between">
          <Image
            src="/logo-letras.png"
            alt="Oficio Link"
            width={150}
            height={40}
            className="h-full w-auto"
          />
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="font-bold text-slate-600 hover:text-[#14A5B8]"
              >
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button className="bg-[#14A5B8] hover:bg-[#0f8494] font-bold rounded-xl px-6">
                Regístrate
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 md:pt-48 md:pb-32 overflow-hidden relative">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-[#14A5B8]/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-8 text-sm font-bold text-slate-600">
            <Star className="h-4 w-4 text-yellow-500 fill-current" /> La red de
            oficios más confiable
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-8">
            Encuentra al <span className="text-[#14A5B8]">experto ideal</span>{" "}
            para cualquier reparación.
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Conectamos a clientes que necesitan soluciones rápidas con
            profesionales calificados, verificados y cerca de su ubicación.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/registro">
              <Button className="w-full sm:w-auto bg-[#14A5B8] hover:bg-[#0f8494] text-white h-14 px-8 rounded-2xl font-bold text-lg shadow-lg shadow-[#14A5B8]/20 transition-all hover:scale-105">
                Necesito un servicio
              </Button>
            </Link>
            <Link href="/registro">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 hover:border-[#14A5B8] hover:text-[#14A5B8] h-14 px-8 rounded-2xl font-bold text-lg transition-all"
              >
                Ofrecer mis servicios <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN: ¿CÓMO FUNCIONA? */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              La forma inteligente de contratar
            </h2>
            <p className="text-slate-500 text-lg">
              Un proceso transparente, seguro y sin complicaciones.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Search,
                title: "1. Busca cerca de ti",
                desc: "Usa nuestra geolocalización para encontrar expertos disponibles en tu misma zona.",
              },
              {
                icon: ShieldCheck,
                title: "2. Contrata seguro",
                desc: "Revisa su portafolio, precios base y opiniones de otros clientes antes de decidir.",
              },
              {
                icon: Star,
                title: "3. Califica el trabajo",
                desc: "Finaliza el servicio y deja tu reseña para ayudar a mantener la calidad de la comunidad.",
              },
            ].map((paso, i) => (
              <div key={i} className="text-center group">
                <div className="mx-auto w-20 h-20 bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-[#14A5B8]/10 group-hover:border-[#14A5B8]/30 transition-all duration-300 group-hover:scale-110">
                  <paso.icon className="h-8 w-8 text-[#14A5B8]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {paso.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN: CATEGORÍAS POPULARES */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-10 text-center">
            Servicios más solicitados
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Zap,
                nombre: "Electricidad",
                color: "text-amber-500",
                bg: "bg-amber-100",
              },
              {
                icon: Droplet,
                nombre: "Plomería",
                color: "text-blue-500",
                bg: "bg-blue-100",
              },
              {
                icon: Wrench,
                nombre: "Mecánica",
                color: "text-slate-700",
                bg: "bg-slate-200",
              },
              {
                icon: Paintbrush,
                nombre: "Pintura",
                color: "text-rose-500",
                bg: "bg-rose-100",
              },
            ].map((cat, i) => (
              <Link href="/registro" key={i}>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center cursor-pointer group">
                  <div
                    className={`mx-auto w-14 h-14 ${cat.bg} rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
                  >
                    <cat.icon className={`h-6 w-6 ${cat.color}`} />
                  </div>
                  <h3 className="font-bold text-slate-900">{cat.nombre}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL & FOOTER */}
      <section className="py-24 bg-slate-900 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
          <Wrench className="w-96 h-96 text-white" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            ¿Eres un experto en tu oficio?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Únete a cientos de profesionales que ya están consiguiendo más
            clientes y digitalizando su negocio con Oficio Link.
          </p>
          <Link href="/registro">
            <Button className="bg-[#14A5B8] hover:bg-[#0f8494] text-white h-14 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-[#14A5B8]/20">
              Crear mi perfil profesional gratis
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-slate-950 py-8 text-center border-t border-slate-800">
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} Oficio Link. Todos los derechos
          reservados.
        </p>
      </footer>
    </div>
  );
}
