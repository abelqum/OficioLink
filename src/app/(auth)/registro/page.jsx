"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
export default function RegistroPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [oficios, setOficios] = useState([]);
  const [location, setLocation] = useState({ lat: null, lng: null, name: "" });
  const [direccion, setDireccion] = useState({
    calle: "",
    numero_ext: "",
    numero_int: "",
    colonia: "",
    cp: "",
    referencias: "",
  });
  // Cargar oficios desde la base de datos
  useEffect(() => {
    const fetchOficios = async () => {
      const { data } = await supabase.from("oficios").select("id, nombre");
      if (data) setOficios(data);
    };
    fetchOficios();
  }, []);

  const handleGetLocation = (tipo) => {
    if (!navigator.geolocation) {
      return toast.error("Geolocalización no soportada en este navegador.");
    }

    // 1. Mostrar estado de carga dependiendo de quién lo pidió
    if (tipo === "cliente") {
      setDireccion((prev) => ({
        ...prev,
        calle: "Buscando...",
        colonia: "Buscando...",
      }));
    } else {
      setLocation((prev) => ({
        ...prev,
        name: "Buscando zona y coordenadas...",
      }));
    }

    const opcionesGPS = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const exactitud = pos.coords.accuracy;

        if (exactitud > 500) {
          toast.warning(
            `Señal débil (precisión: ${Math.round(exactitud)}m). Verifica los datos.`,
          );
        }

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          );
          const data = await response.json();
          const addr = data.address;

          if (!addr) throw new Error("No se encontró dirección");

          // Extracción masiva de datos de OpenStreetMap
          const calleEncontrada =
            addr.road || addr.pedestrian || addr.street || addr.path || "";
          const coloniaEncontrada =
            addr.neighbourhood ||
            addr.suburb ||
            addr.residential ||
            addr.village ||
            "";
          const municipio =
            addr.municipality || addr.city || addr.town || addr.county || "";
          const estado = addr.state || "";

          // 2. Guardar donde corresponde según el tipo de usuario
          if (tipo === "cliente") {
            setDireccion((prev) => ({
              ...prev,
              calle: calleEncontrada,
              numero_ext: addr.house_number || "",
              colonia: coloniaEncontrada,
              cp: addr.postcode || "",
            }));
          } else {
            // El trabajador necesita Lat, Lng y una "Zona" general (Ej. Naucalpan, Estado de México)
            const zonaTexto = municipio
              ? `${municipio}, ${estado}`
              : `${coloniaEncontrada}, ${estado}`;

            setLocation({
              lat: lat,
              lng: lng,
              name: zonaTexto
                .replace(/^, | ,$|(, )+/g, ", ")
                .replace(/^, /, ""), // Limpia comas extra
            });
          }
        } catch (error) {
          console.error("Error al traducir coordenadas:", error);
          toast.error(
            "El servicio de mapas falló. Por favor, llena los datos manualmente.",
          );
          if (tipo === "cliente")
            setDireccion((prev) => ({ ...prev, calle: "", colonia: "" }));
          else setLocation((prev) => ({ ...prev, name: "" }));
        }
      },
      (error) => {
        toast.error(
          "No pudimos acceder a tu ubicación. Verifica los permisos de tu navegador.",
        );
        if (tipo === "cliente")
          setDireccion((prev) => ({ ...prev, calle: "", colonia: "" }));
        else setLocation((prev) => ({ ...prev, name: "" }));
      },
      opcionesGPS,
    );
  };
  const handleRegistro = async (e, tipo) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    if (tipo === "cliente") {
      const { error: dbError } = await supabase.from("usuarios").insert({
        id: userId,
        nombre_completo: formData.get("nombre"),
        telefono: formData.get("telefono"),
        calle: direccion.calle,
        numero_ext: direccion.numero_ext,
        numero_int: direccion.numero_int,
        colonia: direccion.colonia,
        codigo_postal: direccion.cp,
        referencias: direccion.referencias,
      });

      // 👇 ESTO ES LO QUE NOS FALTABA 👇
      if (dbError) {
        console.error("🚨 ERROR AL GUARDAR CLIENTE:", dbError);
        toast.error(`Error en la base de datos: ${dbError.message}`);
        setLoading(false);
        return;
      }

      router.push("/cliente");
    } else {
      await supabase.from("trabajadores").insert({
        id: userId,
        nombre_completo: formData.get("nombre"),
        telefono: formData.get("telefono"),
        oficio_id: formData.get("oficio"),
        ubicacion_latitud: location.lat,
        ubicacion_longitud: location.lng,
        nombre_zona: location.name,
      });
      router.push("/trabajador");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#14A5B8] p-12 text-white">
        <Image
          src="/logo-letras.png"
          alt="Logo"
          width={250}
          height={250}
          className="mb-6"
        />
        <h1 className="text-5xl font-bold italic mb-4">OFICIO LINK</h1>
        <p className="text-xl text-center">
          Únete a la comunidad más grande de expertos y clientes.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-6 overflow-y-auto">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl">
          <Tabs defaultValue="cliente">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="trabajador">Trabajador</TabsTrigger>
            </TabsList>

            <TabsContent value="cliente">
              <form
                onSubmit={(e) => handleRegistro(e, "cliente")}
                className="grid gap-4"
              >
                <CamposBasicos />

                <div className="border-t pt-4 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-bold text-[#14A5B8]">
                      Dirección del Servicio
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetLocation("cliente")}
                      className="text-[#14A5B8] border-[#14A5B8]"
                    >
                      <MapPin className="h-4 w-4 mr-2" /> Autocompletar con GPS
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Calle</Label>
                        <Input
                          value={direccion.calle}
                          onChange={(e) =>
                            setDireccion({
                              ...direccion,
                              calle: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Colonia</Label>
                        <Input
                          value={direccion.colonia}
                          onChange={(e) =>
                            setDireccion({
                              ...direccion,
                              colonia: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>N° Ext</Label>
                        <Input
                          value={direccion.numero_ext}
                          onChange={(e) =>
                            setDireccion({
                              ...direccion,
                              numero_ext: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>N° Int (Opcional)</Label>
                        <Input
                          value={direccion.numero_int}
                          onChange={(e) =>
                            setDireccion({
                              ...direccion,
                              numero_int: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>C.P.</Label>
                        <Input
                          value={direccion.cp}
                          onChange={(e) =>
                            setDireccion({ ...direccion, cp: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Referencias para llegar</Label>
                      <Input
                        placeholder="Ej. Casa de dos pisos con portón negro frente al parque"
                        value={direccion.referencias}
                        onChange={(e) =>
                          setDireccion({
                            ...direccion,
                            referencias: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button
                  disabled={loading}
                  className="bg-[#14A5B8] h-12 mt-4 text-lg"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Crear cuenta de Cliente"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="trabajador">
              <form
                onSubmit={(e) => handleRegistro(e, "trabajador")}
                className="grid gap-4"
              >
                <CamposBasicos />
                <div className="grid gap-2">
                  <Label>Oficio</Label>
                  <Select name="oficio" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu oficio" />
                    </SelectTrigger>
                    <SelectContent>
                      {oficios.map((o) => (
                        <SelectItem key={o.id} value={o.id.toString()}>
                          {o.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 border-t pt-4">
                  <Label>Zona de Cobertura</Label>
                  <Input
                    name="zona"
                    value={location.name}
                    onChange={(e) =>
                      setLocation({ ...location, name: e.target.value })
                    }
                    placeholder="Escribe tu zona o usa el botón"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleGetLocation("trabajador")}
                    className="border-[#14A5B8] text-[#14A5B8]"
                  >
                    <MapPin className="h-4 w-4 mr-2" /> Detectar mi ubicación
                  </Button>
                </div>

                <Button disabled={loading} className="bg-[#14A5B8] h-12 mt-4">
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Unirse como experto"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function CamposBasicos() {
  return (
    <>
      <div className="grid gap-2">
        <Label>Nombre Completo</Label>
        <Input name="nombre" required />
      </div>
      <div className="grid gap-2">
        <Label>Teléfono</Label>
        <Input name="telefono" type="tel" required />
      </div>
      <div className="grid gap-2">
        <Label>Correo</Label>
        <Input name="email" type="email" required />
      </div>
      <div className="grid gap-2">
        <Label>Contraseña</Label>
        <Input name="password" type="password" required />
      </div>
    </>
  );
}
