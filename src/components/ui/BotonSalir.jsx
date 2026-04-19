"use client";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function BotonSalir() {
  const supabase = createClient();
  const router = useRouter();

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Button
      variant="ghost"
      onClick={handleCerrarSesion}
      className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Cerrar Sesión
    </Button>
  );
}
