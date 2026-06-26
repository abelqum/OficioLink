-- Demo profiles for presentation/testing.
-- Login credentials:
-- cliente.demo@oficiolink.mx / DemoSeguro#25
-- tecnico.demo@oficiolink.mx / DemoSeguro#25

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  demo_cliente uuid := '11111111-1111-4111-8111-111111111111';
  demo_tecnico uuid := '22222222-2222-4222-8222-222222222222';
begin
  delete from public.resenas
  where cliente_id in (demo_cliente, demo_tecnico)
     or trabajador_id in (demo_cliente, demo_tecnico);

  delete from public.solicitudes
  where cliente_id in (demo_cliente, demo_tecnico)
     or trabajador_id in (demo_cliente, demo_tecnico);

  delete from public.portafolios
  where trabajador_id = demo_tecnico;

  delete from public.trabajadores
  where id = demo_tecnico;

  delete from public.usuarios
  where id = demo_cliente;

  delete from auth.identities
  where user_id in (demo_cliente, demo_tecnico)
     or email in ('cliente.demo@oficiolink.mx', 'tecnico.demo@oficiolink.mx');

  delete from auth.users
  where id in (demo_cliente, demo_tecnico)
     or email in ('cliente.demo@oficiolink.mx', 'tecnico.demo@oficiolink.mx');
end $$;

with demo_auth_users(id, email, full_name) as (
  values
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'cliente.demo@oficiolink.mx',
      'Mariana López Demo'
    ),
    (
      '22222222-2222-4222-8222-222222222222'::uuid,
      'tecnico.demo@oficiolink.mx',
      'Carlos Hernández Demo'
    )
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  extensions.crypt('DemoSeguro#25', extensions.gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', array['email']),
  jsonb_build_object('nombre_completo', full_name),
  false,
  now(),
  now(),
  false,
  false
from demo_auth_users;

with demo_auth_identities(id, user_id, email, full_name) as (
  values
    (
      '33333333-3333-4333-8333-333333333333'::uuid,
      '11111111-1111-4111-8111-111111111111'::uuid,
      'cliente.demo@oficiolink.mx',
      'Mariana López Demo'
    ),
    (
      '44444444-4444-4444-8444-444444444444'::uuid,
      '22222222-2222-4222-8222-222222222222'::uuid,
      'tecnico.demo@oficiolink.mx',
      'Carlos Hernández Demo'
    )
)
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  user_id::text,
  user_id,
  jsonb_build_object(
    'sub', user_id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false,
    'nombre_completo', full_name
  ),
  'email',
  now(),
  now(),
  now()
from demo_auth_identities;

insert into public.usuarios (
  id,
  nombre_completo,
  telefono,
  calle,
  numero_ext,
  numero_int,
  colonia,
  codigo_postal,
  referencias
)
values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  'Mariana López Demo',
  '55 5555 5555',
  'Av. Insurgentes Sur',
  '1234',
  '4B',
  'Del Valle',
  '03100',
  'Edificio gris, recepción en planta baja'
);

with oficio_pool as (
  select id, nombre, row_number() over (order by nombre) as rn
  from (
    select id, nombre
    from public.oficios
    order by nombre
    limit 10
  ) base
)
insert into public.trabajadores (
  id,
  oficio_id,
  nombre_completo,
  telefono,
  ubicacion_latitud,
  ubicacion_longitud,
  radio_cobertura_km,
  nombre_zona,
  oficio_ids,
  zonas_cobertura,
  avatar_url,
  identidad_url,
  identidad_selfie_url,
  verificacion_estado,
  verificacion_score,
  verificacion_metodo,
  verificacion_mensaje,
  verificacion_actualizada_en
)
select
  '22222222-2222-4222-8222-222222222222'::uuid,
  (select id from oficio_pool where rn = 1),
  'Carlos Hernández Demo',
  '55 4444 4444',
  19.432608,
  -99.133209,
  18,
  'Centro Histórico, Ciudad de México',
  array(select id::bigint from oficio_pool order by rn),
  array[
    'Centro Histórico',
    'Roma Norte',
    'Condesa',
    'Del Valle',
    'Narvarte',
    'Coyoacán'
  ],
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos-Hernandez-Demo',
  'demo/ine-carlos-hernandez.jpg',
  'demo/selfie-carlos-hernandez.jpg',
  'verificado',
  96,
  'demo_manual',
  'Perfil demo verificado para pruebas y presentación.',
  now();

with oficio_pool as (
  select id, nombre, row_number() over (order by nombre) as rn
  from (
    select id, nombre
    from public.oficios
    order by nombre
    limit 10
  ) base
)
insert into public.portafolios (
  trabajador_id,
  imagen_url,
  descripcion,
  oficio_id,
  creado_en
)
select
  '22222222-2222-4222-8222-222222222222'::uuid,
  'https://placehold.co/900x650/0f172a/ffffff?text=' || replace(nombre, ' ', '+'),
  'Trabajo demo de ' || nombre || ' realizado con acabado profesional.',
  id,
  now() - (rn || ' days')::interval
from oficio_pool;

with oficio_pool as (
  select id, nombre, row_number() over (order by nombre) as rn
  from (
    select id, nombre
    from public.oficios
    order by nombre
    limit 10
  ) base
),
demo_servicios(n, detalle, precio, calificacion, comentario) as (
  values
    (1, 'Reparación rápida con explicación clara del problema.', 650, 5, 'Excelente atención, llegó puntual y dejó todo funcionando.'),
    (2, 'Mantenimiento preventivo y revisión de seguridad.', 780, 5, 'Muy profesional y ordenado. Lo volvería a contratar.'),
    (3, 'Instalación solicitada con materiales incluidos.', 1250, 4, 'Buen servicio y comunicación durante todo el trabajo.'),
    (4, 'Corrección de falla reportada el mismo día.', 540, 5, 'Resolvió el problema rápido y dejó recomendaciones útiles.'),
    (5, 'Trabajo completo en domicilio con garantía verbal.', 920, 4, 'Quedé satisfecha, solo tardó un poco más de lo previsto.'),
    (6, 'Diagnóstico, compra de pieza y reparación final.', 1450, 5, 'Muy confiable. Explicó el costo antes de iniciar.'),
    (7, 'Servicio programado para mejorar funcionamiento.', 700, 4, 'Trabajo limpio y trato amable.'),
    (8, 'Ajuste técnico y prueba final con el cliente.', 860, 5, 'Todo quedó perfecto, excelente presentación.'),
    (9, 'Revisión general y solución de detalle pendiente.', 600, 4, 'Buen resultado y precio justo.'),
    (10, 'Instalación nueva con validación de seguridad.', 1600, 5, 'Servicio impecable, muy recomendable.'),
    (11, 'Mantenimiento correctivo por desgaste normal.', 680, 5, 'Fue claro, puntual y dejó el área limpia.'),
    (12, 'Cambio de componente y pruebas finales.', 980, 4, 'Buena calidad de trabajo y buena actitud.'),
    (13, 'Atención a solicitud urgente de fin de semana.', 1150, 5, 'Respondió rápido y solucionó sin complicaciones.'),
    (14, 'Servicio de mejora estética y funcional.', 890, 4, 'Cumplió con lo solicitado y respetó el presupuesto.'),
    (15, 'Trabajo preventivo con revisión completa.', 760, 5, 'Excelente experiencia, se nota la experiencia.'),
    (16, 'Reparación de detalle reportado por el cliente.', 580, 4, 'Servicio recomendable y trato respetuoso.'),
    (17, 'Instalación y limpieza posterior del área.', 1320, 5, 'Muy buen trabajo, todo quedó como esperaba.'),
    (18, 'Diagnóstico inicial y servicio final en una visita.', 720, 5, 'Rápido, honesto y con buena explicación.'),
    (19, 'Revisión de funcionamiento y ajuste fino.', 640, 4, 'Buen servicio general y precio razonable.'),
    (20, 'Trabajo completo con recomendaciones de uso.', 1010, 5, 'Gran atención al detalle, lo recomiendo ampliamente.')
),
inserted as (
  insert into public.solicitudes (
    cliente_id,
    trabajador_id,
    servicio_detalle,
    estado,
    metodo_pago,
    creado_en,
    precio_acordado,
    comision_app,
    oficio_id,
    cita_presupuesto,
    modalidad_cita,
    requiere_visita_presupuesto
  )
  select
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    oficio_pool.nombre || ' demo #' || demo_servicios.n || ': ' || demo_servicios.detalle,
    'completado',
    case when demo_servicios.n % 2 = 0 then 'Tarjeta' else 'Efectivo' end,
    now() - (demo_servicios.n || ' days')::interval,
    demo_servicios.precio,
    round(demo_servicios.precio * 0.10, 2),
    oficio_pool.id,
    now() - ((demo_servicios.n + 1) || ' days')::interval,
    case when demo_servicios.n % 3 = 0 then 'virtual' else 'presencial' end,
    demo_servicios.n % 3 <> 0
  from demo_servicios
  join oficio_pool on oficio_pool.rn = ((demo_servicios.n - 1) % 10) + 1
  returning id, servicio_detalle, creado_en
)
insert into public.resenas (
  solicitud_id,
  cliente_id,
  trabajador_id,
  calificacion,
  comentario,
  creado_en,
  imagenes
)
select
  inserted.id,
  '11111111-1111-4111-8111-111111111111'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid,
  demo_servicios.calificacion,
  demo_servicios.comentario,
  inserted.creado_en + interval '2 hours',
  case
    when demo_servicios.n in (3, 10, 17) then
      array[
        'https://placehold.co/600x400/14A5B8/ffffff?text=Trabajo+' || demo_servicios.n
      ]
    else '{}'
  end
from inserted
join demo_servicios
  on inserted.servicio_detalle like '% demo #' || demo_servicios.n || ':%';
