import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 1. Creamos el cliente de Supabase para el Servidor
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 2. Obtenemos el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const urlActual = request.nextUrl.pathname;

  // 3. Definimos qué rutas necesitan seguridad
  const esRutaProtegida =
    urlActual.startsWith("/cliente") ||
    urlActual.startsWith("/trabajador") ||
    urlActual.startsWith("/perfil");
  const esRutaDeAuth =
    urlActual.startsWith("/login") || urlActual.startsWith("/registro");

  // 4. Lógica de redirección
  if (esRutaProtegida && !user) {
    // Si quiere entrar al dashboard y no está logueado -> Al Login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (esRutaDeAuth && user) {
    // Si ya está logueado y quiere ir al Login/Registro -> Lo mandamos al inicio
    // (En una app real aquí validarías si es cliente o trabajador para mandarlo a su panel exacto)
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Configuración de Next.js para ignorar archivos estáticos e imágenes
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
