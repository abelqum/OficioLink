-- OficioLink professional profile features.
-- Run this in the Supabase SQL Editor before using the new UI in production.

alter table public.trabajadores
  add column if not exists oficio_ids bigint[] default '{}',
  add column if not exists zonas_cobertura text[] default '{}',
  add column if not exists avatar_url text,
  add column if not exists identidad_url text,
  add column if not exists verificacion_estado text not null default 'sin_enviar'
    check (verificacion_estado in ('sin_enviar', 'pendiente', 'verificado', 'rechazado'));

update public.trabajadores
set oficio_ids = array[oficio_id]::bigint[]
where oficio_id is not null
  and (oficio_ids is null or cardinality(oficio_ids) = 0);

update public.trabajadores
set zonas_cobertura = array[nombre_zona]
where nombre_zona is not null
  and nombre_zona <> ''
  and (zonas_cobertura is null or cardinality(zonas_cobertura) = 0);

alter table public.portafolios
  add column if not exists oficio_id bigint references public.oficios(id);

alter table public.resenas
  add column if not exists imagenes text[] default '{}';

alter table public.solicitudes
  add column if not exists oficio_id bigint references public.oficios(id),
  add column if not exists cita_presupuesto timestamptz,
  add column if not exists modalidad_cita text,
  add column if not exists requiere_visita_presupuesto boolean not null default false;

insert into storage.buckets (id, name, public)
values
  ('avatares', 'avatares', true),
  ('verificaciones_identidad', 'verificaciones_identidad', false),
  ('fotos_resenas', 'fotos_resenas', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read for avatar and review images'
  ) then
    create policy "Public read for avatar and review images"
    on storage.objects for select
    using (bucket_id in ('avatares', 'fotos_resenas'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users upload avatar and review images'
  ) then
    create policy "Authenticated users upload avatar and review images"
    on storage.objects for insert
    to authenticated
    with check (bucket_id in ('avatares', 'fotos_resenas'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users upload identity files'
  ) then
    create policy "Authenticated users upload identity files"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'verificaciones_identidad');
  end if;
end $$;
