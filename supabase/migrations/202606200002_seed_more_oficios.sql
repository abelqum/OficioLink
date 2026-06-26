-- Add more service trades to OficioLink.
-- Run this in the Supabase SQL Editor or through Supabase CLI with project-owner permissions.

with nuevos_oficios(categoria_id, nombre, costo_defecto) as (
  values
    (2, 'Albañilería', 450),
    (3, 'Jardinería', 300),
    (2, 'Herrería', 550),
    (1, 'Cerrajería', 350),
    (1, 'Aire acondicionado', 600),
    (2, 'Impermeabilización', 500),
    (1, 'Reparación de electrodomésticos', 450),
    (1, 'Instalación de cámaras', 650),
    (2, 'Mecánica automotriz', 500),
    (2, 'Techado y mantenimiento', 550)
)
insert into public.oficios (categoria_id, nombre, costo_defecto)
select categoria_id, nombre, costo_defecto
from nuevos_oficios nuevo
where not exists (
  select 1
  from public.oficios existente
  where lower(existente.nombre) = lower(nuevo.nombre)
);
