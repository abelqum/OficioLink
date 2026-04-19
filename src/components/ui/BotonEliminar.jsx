"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BotonEliminar({ tipoUsuario, userId }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEliminarCuenta = async () => {
    const confirmacion = window.confirm(
      "¿ESTÁS SEGURO? Esta acción es irreversible. Se borrarán todos tus datos y tu historial.",
    );

    if (!confirmacion) return;

    setLoading(true);

    try {
      // 1. Si es trabajador, borramos sus fotos físicas del disco duro primero
      if (tipoUsuario === "trabajador") {
        const { data: fotos } = await supabase
          .from("portafolios")
          .select("imagen_url")
          .eq("trabajador_id", userId);
        if (fotos && fotos.length > 0) {
          const archivosABorrar = fotos.map((f) =>
            f.imagen_url.split("/").pop(),
          );
          await supabase.storage.from("fotos_trabajos").remove(archivosABorrar);
        }
      }

      // 2. Ejecutamos la súper función SQL que borra TODO el rastro del usuario
      const { error } = await supabase.rpc("eliminar_mi_cuenta");

      if (error) throw error;

      // 3. Cerramos sesión y lo echamos
      await supabase.auth.signOut();
      toast.success("Tu cuenta ha sido eliminada por completo.");
      router.push("/registro");
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al eliminar tu cuenta.");
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleEliminarCuenta}
      disabled={loading}
      className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
    >
      {loading ? (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      ) : (
        <Trash2 className="h-4 w-4 mr-2" />
      )}
      Eliminar mi cuenta definitivamente
    </Button>
  );
}
