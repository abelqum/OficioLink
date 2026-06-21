-- Allows authenticated users to delete their own OficioLink account data.
-- Run in Supabase SQL Editor with owner permissions.

create or replace function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  usuario_id uuid := auth.uid();
begin
  if usuario_id is null then
    raise exception 'No hay una sesion autenticada.';
  end if;

  delete from public.resenas
  where cliente_id = usuario_id
     or trabajador_id = usuario_id;

  delete from public.portafolios
  where trabajador_id = usuario_id;

  delete from public.solicitudes
  where cliente_id = usuario_id
     or trabajador_id = usuario_id;

  delete from public.trabajadores
  where id = usuario_id;

  delete from public.usuarios
  where id = usuario_id;

  delete from auth.users
  where id = usuario_id;
end;
$$;

revoke all on function public.eliminar_mi_cuenta() from public;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
