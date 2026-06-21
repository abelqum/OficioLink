-- Stores the automatic identity face-check result for service providers.

alter table public.trabajadores
  add column if not exists identidad_selfie_url text,
  add column if not exists verificacion_score numeric,
  add column if not exists verificacion_metodo text,
  add column if not exists verificacion_mensaje text,
  add column if not exists verificacion_actualizada_en timestamptz;
