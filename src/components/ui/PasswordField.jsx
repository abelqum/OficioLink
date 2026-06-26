"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordField({
  label = "Contraseña",
  name = "password",
  disabled = false,
  helperText = "Revisa que no tengas Bloq Mayús activo.",
  autoComplete = "current-password",
  placeholder = "Ej. OficioLink#2026",
  required = true,
  showStrength = false,
  value,
  onChange,
  onValidityChange,
}) {
  const inputId = useId();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [capsLockActivo, setCapsLockActivo] = useState(false);
  const [valorInterno, setValorInterno] = useState("");

  const password = value ?? valorInterno;

  const seguridad = useMemo(() => {
    const reglas = {
      longitud: password.length >= 8,
      mayuscula: /[A-ZÁÉÍÓÚÑ]/.test(password),
      simbolo: /[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]/.test(password),
      numero: /\d/.test(password),
    };
    const puntaje = Object.values(reglas).filter(Boolean).length;
    const porcentaje = Math.round((puntaje / 4) * 100);
    const etiqueta =
      puntaje <= 1
        ? "Muy débil"
        : puntaje === 2
          ? "Básica"
          : puntaje === 3
            ? "Buena"
            : "Segura";
    const color =
      puntaje <= 1
        ? "bg-red-500"
        : puntaje === 2
          ? "bg-amber-500"
          : puntaje === 3
            ? "bg-[#14A5B8]"
            : "bg-emerald-500";

    return {
      ...reglas,
      puntaje,
      porcentaje,
      etiqueta,
      color,
      valida: reglas.mayuscula && reglas.simbolo,
    };
  }, [password]);

  useEffect(() => {
    if (showStrength) onValidityChange?.(seguridad.valida);
  }, [onValidityChange, seguridad.valida, showStrength]);

  const detectarCapsLock = (event) => {
    setCapsLockActivo(event.getModifierState?.("CapsLock") || false);
  };

  const handleChange = (event) => {
    setValorInterno(event.target.value);
    onChange?.(event);
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          id={inputId}
          name={name}
          type={mostrarPassword ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-11 pl-10 pr-12"
          required={required}
          disabled={disabled}
          aria-describedby={`${inputId}-help`}
          value={value}
          onChange={handleChange}
          onKeyDown={detectarCapsLock}
          onKeyUp={detectarCapsLock}
          onBlur={() => setCapsLockActivo(false)}
        />
        <button
          type="button"
          onClick={() => setMostrarPassword((actual) => !actual)}
          aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={mostrarPassword}
          disabled={disabled}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-50"
        >
          {mostrarPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      <div id={`${inputId}-help`} aria-live="polite" className="min-h-5">
        {capsLockActivo ? (
          <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Bloq Mayús está activado.
          </p>
        ) : (
          <p className="text-xs font-medium text-slate-400">{helperText}</p>
        )}
      </div>

      {showStrength && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Seguridad
            </p>
            <p className="text-xs font-black text-slate-700">{seguridad.etiqueta}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${seguridad.color}`}
              style={{ width: `${seguridad.porcentaje}%` }}
            />
          </div>
          <div className="grid gap-2 text-xs font-semibold">
            <Regla activa={seguridad.mayuscula}>Incluye una letra mayúscula</Regla>
            <Regla activa={seguridad.simbolo}>Incluye un símbolo especial</Regla>
            <Regla activa={seguridad.longitud}>Recomendado: mínimo 8 caracteres</Regla>
            <Regla activa={seguridad.numero}>Recomendado: agrega un número</Regla>
          </div>
        </div>
      )}
    </div>
  );
}

function Regla({ activa, children }) {
  return (
    <div className={`flex items-center gap-2 ${activa ? "text-emerald-700" : "text-slate-500"}`}>
      {activa ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-slate-300" />
      )}
      <span>{children}</span>
    </div>
  );
}
