"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PasswordField from "@/components/ui/PasswordField";
import BotonEliminar from "@/components/ui/BotonEliminar";
import { createClient } from "@/utils/supabase/client";
import {
  AlertCircle,
  HelpCircle,
  Loader2,
  Lock,
  MapPin,
  Save,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export default function AjustesCliente() {
  const supabase = createClient();
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardandoDireccion, setGuardandoDireccion] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [passwordValida, setPasswordValida] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return router.push("/login");

      setUsuario(session.user);

      const { data } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setPerfil(data || {});
      setLoading(false);
    };

    cargarDatos();
  }, [router, supabase]);

  const actualizarDireccion = async (e) => {
    e.preventDefault();
    setGuardandoDireccion(true);
    const formData = new FormData(e.target);

    const { error } = await supabase
      .from("usuarios")
      .update({
        calle: formData.get("calle"),
        colonia: formData.get("colonia"),
        numero_ext: formData.get("numero_ext"),
        numero_int: formData.get("numero_int"),
        codigo_postal: formData.get("codigo_postal"),
        referencias: formData.get("referencias"),
      })
      .eq("id", usuario.id);

    setGuardandoDireccion(false);

    if (error) {
      toast.error("No se pudo actualizar la dirección.");
      return;
    }

    toast.success("Dirección actualizada.");
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    if (!passwordValida) {
      toast.error("La contraseña debe tener mayúscula y símbolo especial.");
      return;
    }

    setCambiandoPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setCambiandoPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setPassword("");
    toast.success("Contraseña actualizada.");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-[#14A5B8]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar rol="cliente" />

      <div className="flex-1 md:ml-64 p-6 md:p-10 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <p className="text-sm font-bold text-[#14A5B8] uppercase tracking-widest">
            Configuración
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Cuenta y privacidad
          </h1>
          <p className="mt-2 text-slate-500">
            Mantén tus datos correctos para evitar errores al solicitar servicios.
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={actualizarDireccion}>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#14A5B8]">
                  <MapPin className="h-5 w-5" /> Mi Dirección Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <HelpBox>
                  Esta dirección se comparte con el prestador cuando aceptas una
                  cotización. Revisa calle, colonia y referencias antes de guardar.
                </HelpBox>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Calle" name="calle" value={perfil?.calle} required />
                  <Field label="Colonia" name="colonia" value={perfil?.colonia} required />
                  <Field label="No. exterior" name="numero_ext" value={perfil?.numero_ext} required />
                  <Field label="No. interior" name="numero_int" value={perfil?.numero_int} />
                  <Field label="Código postal" name="codigo_postal" value={perfil?.codigo_postal} required />
                </div>
                <div className="space-y-2">
                  <Label>Referencias adicionales</Label>
                  <Input
                    name="referencias"
                    defaultValue={perfil?.referencias || ""}
                    placeholder="Ej. Casa blanca con portón negro"
                  />
                </div>
                <Button
                  disabled={guardandoDireccion}
                  className="bg-slate-900 rounded-xl h-11"
                >
                  {guardandoDireccion ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Actualizar Dirección
                </Button>
              </CardContent>
            </Card>
          </form>

          <form onSubmit={cambiarPassword}>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Lock className="h-5 w-5" /> Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <HelpBox>
                  Cambia tu contraseña si crees que alguien más pudo acceder. El
                  botón se habilita cuando cumple los requisitos mínimos.
                </HelpBox>
                <PasswordField
                  label="Nueva contraseña"
                  autoComplete="new-password"
                  showStrength
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onValidityChange={setPasswordValida}
                  disabled={cambiandoPassword}
                  helperText="Debe incluir una mayúscula y un símbolo especial."
                />
                <Button
                  disabled={cambiandoPassword || !passwordValida}
                  variant="outline"
                  className="rounded-xl border-slate-200"
                >
                  {cambiandoPassword && (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  )}
                  Cambiar Contraseña
                </Button>
              </CardContent>
            </Card>
          </form>

          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="h-5 w-5" /> Zona de peligro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>
                  Eliminar tu cuenta borra tus datos e historial de forma
                  permanente. Usa esta opción solo si estás completamente seguro.
                </p>
              </div>
              <BotonEliminar tipoUsuario="cliente" userId={usuario?.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, required = false }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input name={name} defaultValue={value || ""} required={required} />
    </div>
  );
}

function HelpBox({ children }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
      <HelpCircle className="h-5 w-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
