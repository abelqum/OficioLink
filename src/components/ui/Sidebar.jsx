"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import BotonSalir from "./BotonSalir";
import Image from "next/image";

export default function Sidebar({ rol }) {
  // Hook de Next.js para saber en qué página estamos y "pintar" el botón activo
  const pathname = usePathname();

  // 1. Menú del Cliente
  const menuCliente = [
    { nombre: "Buscar Expertos", ruta: "/cliente", icono: Search },
    { nombre: "Configuración", ruta: "/cliente/ajustes", icono: Settings },
  ];

  // 2. Menú del Trabajador
  const menuTrabajador = [
    {
      nombre: "Panel de Trabajos",
      ruta: "/trabajador",
      icono: LayoutDashboard,
    },
    { nombre: "Configuración", ruta: "/trabajador/ajustes", icono: Settings },
  ];

  // Elegimos qué menú mostrar según el rol que le pasemos al componente
  const menu = rol === "cliente" ? menuCliente : menuTrabajador;

  return (
    <aside className="brand-dark hidden md:flex flex-col w-64 text-white border-r border-white/10 h-screen fixed left-0 top-0 z-40 shadow-2xl">
      {/* Sección del Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <div className="rounded-2xl bg-white px-3 py-2 shadow-lg shadow-black/20">
          <Image
            src="/logo-letras.png"
            alt="Oficio Link"
            width={130}
            height={40}
            className="w-auto h-8"
          />
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
        <p className="text-[10px] font-black text-cyan-200/70 uppercase tracking-widest mb-4 px-3">
          Menú Principal
        </p>

        {menu.map((item) => {
          const activo = pathname === item.ruta;
          const Icono = item.icono;

          return (
            <Link
              key={item.nombre}
              href={item.ruta}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-semibold text-sm ${
                activo
                  ? "bg-gradient-to-r from-[#1E6FD9] to-[#7A4FD6] text-white shadow-lg shadow-[#1E6FD9]/25"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icono
                className={`h-5 w-5 ${activo ? "text-white" : "text-slate-400"}`}
              />
              {item.nombre}
            </Link>
          );
        })}
      </nav>

      {/* Footer del Sidebar (Botón de salir) */}
      <div className="p-4 border-t border-white/10 bg-white/[0.03]">
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-widest text-white/60">
            OficioLink
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Trabajo local con perfiles más confiables.
          </p>
        </div>
        <div className="w-full flex items-center justify-center">
          <BotonSalir className="w-full bg-white text-slate-800 border-white hover:bg-red-50 hover:text-red-600 hover:border-red-100" />
        </div>
      </div>
    </aside>
  );
}
