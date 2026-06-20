"use client";

import { useId, useState } from "react";
import { AlertTriangle, Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordField({
  label = "Contraseña",
  name = "password",
  disabled = false,
  helperText = "Revisa que no tengas Bloq Mayús activo.",
  autoComplete = "current-password",
  required = true,
}) {
  const inputId = useId();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [capsLockActivo, setCapsLockActivo] = useState(false);

  const detectarCapsLock = (event) => {
    setCapsLockActivo(event.getModifierState?.("CapsLock") || false);
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
          className="h-11 pl-10 pr-12"
          required={required}
          disabled={disabled}
          aria-describedby={`${inputId}-help`}
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
    </div>
  );
}
