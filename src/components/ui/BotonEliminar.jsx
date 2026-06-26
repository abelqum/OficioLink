"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function BotonEliminar({ tipoUsuario, userId }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState("");
  const puedeEliminar = textoConfirmacion.trim().toUpperCase() === "ELIMINAR";

  const handleEliminarCuenta = async () => {
    if (!puedeEliminar) {
      toast.error("Escribe ELIMINAR para confirmar.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const idActual = userId || session?.user?.id;

      if (!idActual) throw new Error("No se encontró una sesión activa.");

      if (tipoUsuario === "trabajador") {
        const { data: fotos } = await supabase
          .from("portafolios")
          .select("imagen_url")
          .eq("trabajador_id", idActual);

        if (fotos && fotos.length > 0) {
          const archivosABorrar = fotos
            .map((f) => f.imagen_url?.split("/").pop())
            .filter(Boolean);

          if (archivosABorrar.length > 0) {
            await supabase.storage.from("fotos_trabajos").remove(archivosABorrar);
          }
        }
      }

      const { error } = await supabase.rpc("eliminar_mi_cuenta");
      if (error) throw error;

      await supabase.auth.signOut();
      toast.success("Tu cuenta fue eliminada por completo.");
      router.push("/registro");
    } catch (error) {
      console.error(error);
      toast.error(
        error.message?.includes("function")
          ? "Falta aplicar la migración eliminar_mi_cuenta en Supabase."
          : "Hubo un error al eliminar tu cuenta.",
      );
      setLoading(false);
    }
  };

  if (!confirmando) {
    return (
      <Button
        variant="destructive"
        onClick={() => setConfirmando(true)}
        className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Eliminar mi cuenta
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-black text-red-700">Esta acción es permanente.</p>
          <p className="text-sm text-red-700/80 mt-1">
            Se eliminarán tus datos, solicitudes, historial, reseñas relacionadas y
            perfil. Para evitar errores accidentales, escribe ELIMINAR.
          </p>
        </div>
      </div>

      <Input
        value={textoConfirmacion}
        onChange={(e) => setTextoConfirmacion(e.target.value)}
        placeholder="Escribe ELIMINAR"
        disabled={loading}
        className="bg-white"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="destructive"
          disabled={loading || !puedeEliminar}
          onClick={handleEliminarCuenta}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? (
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Confirmar eliminación
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setConfirmando(false);
            setTextoConfirmacion("");
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
