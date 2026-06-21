import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  Hammer,
  MapPin,
  MessageSquare,
  Paintbrush,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

const stats = [
  { value: "1,200+", label: "servicios solicitados" },
  { value: "98%", label: "clientes satisfechos" },
  { value: "24h", label: "respuesta promedio" },
];

const features = [
  {
    icon: Search,
    title: "Encuentra expertos sin perder contexto",
    desc: "Filtra por oficio, zona, verificación y rango de precio antes de solicitar una cotización.",
  },
  {
    icon: ShieldCheck,
    title: "Perfiles profesionales más confiables",
    desc: "Portafolio por oficio, identidad verificada, reseñas y fotos del trabajo terminado.",
  },
  {
    icon: CalendarClock,
    title: "Agenda antes de contratar",
    desc: "Solicita una visita o llamada para revisar presupuesto sin cerrar el trabajo a ciegas.",
  },
];

const categories = [
  { icon: Zap, label: "Electricidad", tone: "bg-amber-100 text-amber-600" },
  { icon: Wrench, label: "Plomería", tone: "bg-blue-100 text-blue-600" },
  { icon: Hammer, label: "Carpintería", tone: "bg-violet-100 text-violet-600" },
  { icon: Paintbrush, label: "Pintura", tone: "bg-rose-100 text-rose-600" },
];

export default function LandingPage() {
  return (
    <div className="brand-shell min-h-screen selection:bg-[#1E6FD9] selection:text-white">
      <section className="brand-dark relative overflow-hidden px-5 pb-20 pt-5 text-white md:pb-28">
        <nav className="glass-nav mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl px-4 md:px-6">
          <Link href="/" className="shrink-0 rounded-xl bg-white px-3 py-2">
            <Image
              src="/logo-letras.png"
              alt="Oficio Link"
              width={132}
              height={38}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="#producto"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              Producto
            </a>
            <a
              href="#como-funciona"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cómo funciona
            </a>
            <a
              href="#oficios"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              Oficios
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-white/20 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/20 hover:text-white"
              >
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/registro" className="hidden sm:block">
              <Button className="brand-gradient-button h-10 px-4 text-sm">
                Crear cuenta
              </Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 pb-4 pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pt-24">
          <div>
            <div className="brand-eyebrow">
              <Sparkles className="h-4 w-4" />
              Servicios locales con decisiones claras
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
              Contrata expertos sin perder control del trabajo.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 md:text-xl">
              OficioLink une búsqueda, cotización, agenda, portafolio, reseñas y
              seguimiento en una experiencia clara para clientes y prestadores.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/registro">
                <Button className="green-action-button h-12 px-6">
                  Solicitar un servicio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/registro">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-white/20 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white"
                >
                  Ofrecer mis servicios
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold text-white/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mock-panel p-4 text-slate-950 md:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Solicitud activa
                </p>
                <h2 className="mt-1 text-xl font-black text-[#1E0A4E]">
                  Reparación eléctrica
                </h2>
              </div>
              <span className="mini-status bg-emerald-100 text-emerald-700">
                cotizado
              </span>
            </div>

            <div className="grid gap-3 py-5">
              {[
                ["10:00", "Visita para presupuesto", "Confirmado"],
                ["14:30", "Cambio de contactos", "En proceso"],
                ["18:00", "Foto y reseña final", "Pendiente"],
              ].map(([time, title, state]) => (
                <div
                  key={title}
                  className="flex items-center gap-4 rounded-2xl bg-[#FAFCFF] p-4"
                >
                  <div className="rounded-xl bg-[#EEF4FF] px-3 py-2 text-sm font-black text-[#1E6FD9]">
                    {time}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-[#1E0A4E]">{title}</p>
                    <p className="text-sm font-semibold text-slate-500">
                      {state}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-[#35C56A]" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#EEF4FF] p-4">
                <Banknote className="h-5 w-5 text-[#1E6FD9]" />
                <p className="mt-3 text-sm font-bold text-slate-500">
                  Presupuesto
                </p>
                <p className="text-2xl font-black text-[#1E0A4E]">$850</p>
              </div>
              <div className="rounded-2xl bg-[#EAFBF1] p-4">
                <MessageSquare className="h-5 w-5 text-[#35C56A]" />
                <p className="mt-3 text-sm font-bold text-slate-500">
                  Chat activo
                </p>
                <p className="text-2xl font-black text-[#1E0A4E]">3 msg</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#F3EEFF] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#7A4FD6]">
                verificación completa
              </p>
              <p className="mt-1 text-sm font-bold text-[#1E0A4E]">
                Identidad, portafolio y reseñas visibles antes de contratar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="producto" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="light-eyebrow">Producto</div>
            <h2 className="mt-5 text-3xl font-black text-[#1E0A4E] md:text-5xl">
              Una plataforma para contratar con claridad, no solo una lista de
              contactos.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="premium-card p-7">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1E6FD9]">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-[#1E0A4E]">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="brand-dark mx-5 rounded-[28px] px-6 py-16 text-white md:mx-8 md:px-10 md:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="brand-eyebrow">En acción</div>
            <h2 className="mt-5 text-3xl font-black md:text-5xl">
              Del primer filtro al trabajo terminado.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/75">
              La experiencia muestra lo que importa en cada paso: cobertura,
              cotización, cita, estado, pago y evidencia del trabajo final.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                "Filtros por oficio, precio y zona",
                "Cita para revisar presupuesto",
                "Portafolio separado por oficio",
                "Reseñas con fotos del trabajo terminado",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#35C56A]" />
                  <span className="font-bold text-white/85">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              <MiniCard
                icon={MapPin}
                label="Cobertura"
                title="Norte, Centro y Poniente"
                tone="bg-[#EEF4FF] text-[#1E6FD9]"
              />
              <MiniCard
                icon={Users}
                label="Prestador"
                title="Identidad verificada"
                tone="bg-[#EAFBF1] text-[#35C56A]"
              />
              <MiniCard
                icon={FileCheck2}
                label="Portafolio"
                title="12 fotos por oficio"
                tone="bg-[#F3EEFF] text-[#7A4FD6]"
              />
              <MiniCard
                icon={Star}
                label="Reseñas"
                title="4.9 promedio"
                tone="bg-amber-100 text-amber-600"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="oficios" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="light-eyebrow">Oficios</div>
              <h2 className="mt-5 text-3xl font-black text-[#1E0A4E] md:text-5xl">
                Servicios listos para contratar.
              </h2>
            </div>
            <Link href="/registro">
              <Button className="brand-gradient-button h-12 px-6">
                Crear solicitud
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link href="/registro" key={cat.label}>
                <div className="premium-card group p-6">
                  <div
                    className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl ${cat.tone}`}
                  >
                    <cat.icon className="h-7 w-7" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Servicio
                  </p>
                  <h3 className="mt-2 text-xl font-black text-[#1E0A4E]">
                    {cat.label}
                  </h3>
                  <p className="mt-4 text-sm font-bold text-[#1E6FD9]">
                    Ver expertos →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-8">
        <div className="brand-dark mx-auto max-w-7xl rounded-[28px] px-6 py-16 text-center text-white md:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="brand-eyebrow">Comienza hoy</div>
            <h2 className="mt-5 text-3xl font-black md:text-5xl">
              Construye confianza desde el primer contacto.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/75">
              Clientes ven mejores señales para decidir. Prestadores muestran su
              trabajo con una presencia más profesional.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/registro">
                <Button className="green-action-button h-12 px-6">
                  Crear cuenta gratis
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-white/20 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white"
                >
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-5 py-8 text-center">
        <p className="text-sm font-semibold text-slate-500">
          © {new Date().getFullYear()} Oficio Link. Hecho para contratar mejor.
        </p>
      </footer>
    </div>
  );
}

function MiniCard({ icon: Icon, label, title, tone }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-slate-950 shadow-[0_18px_44px_rgba(9,5,28,0.28)]">
      <div className={`mb-6 flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-[#1E0A4E]">{title}</p>
    </div>
  );
}
