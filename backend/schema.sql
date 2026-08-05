-- =========================================================
-- TekCoat Construct, S.R.L. — Sistema Web de Gestión de Cotizaciones
-- Script SQL para crear la tabla en Supabase (PostgreSQL)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================

create table if not exists solicitudes (
    id            bigint generated always as identity primary key,
    created_at    timestamptz not null default now(),
    nombre        text not null,
    telefono      text not null,
    correo        text,
    direccion     text not null,
    servicio      text not null
                  check (servicio in ('pintura_interior', 'pintura_exterior',
                                       'lavado_presion', 'remodelacion',
                                       'aplicacion_masilla', 'aplicacion_textura',
                                       'limpieza', 'herreria_construccion')),
    metros        numeric not null check (metros > 0),
    pisos         numeric not null default 1 check (pisos >= 1),
    descripcion   text,
    -- El precio ya no se calcula automáticamente por m²: José Castillo
    -- (CEO) lo define manualmente luego del levantamiento / inspección
    -- del proyecto, por lo que esta columna queda nula hasta entonces.
    estimacion    numeric,
    estado        text not null default 'pendiente'
                  check (estado in ('pendiente', 'atendida', 'rechazada', 'cancelada')),
    -- Cliente dueño de la solicitud (si la creó estando autenticado en
    -- el portal de clientes). Null = solicitud enviada sin cuenta.
    cliente_id    uuid references auth.users(id)
);

-- Índice para filtrar rápido por estado desde el panel admin
create index if not exists idx_solicitudes_estado on solicitudes (estado);

-- Índice para que el portal de clientes cargue rápido "mis solicitudes"
create index if not exists idx_solicitudes_cliente on solicitudes (cliente_id);

-- Si ya tenías la tabla creada de antes de esta migración, corre esto
-- para actualizarla sin perder datos:
--   alter table solicitudes add column if not exists cliente_id uuid references auth.users(id);
--   alter table solicitudes drop constraint if exists solicitudes_servicio_check;
--   alter table solicitudes add constraint solicitudes_servicio_check
--     check (servicio in ('pintura_interior', 'pintura_exterior', 'lavado_presion',
--                          'remodelacion', 'aplicacion_masilla', 'aplicacion_textura',
--                          'limpieza', 'herreria_construccion'));
--   alter table solicitudes drop constraint if exists solicitudes_estado_check;
--   alter table solicitudes add constraint solicitudes_estado_check
--     check (estado in ('pendiente', 'atendida', 'rechazada', 'cancelada'));
--   -- Si tu tabla venía del sistema anterior con estimación automática
--   -- por m², quita el NOT NULL para que quede pendiente hasta que el
--   -- CEO defina el precio tras la inspección:
--   alter table solicitudes alter column estimacion drop not null;

-- =========================================================
-- Seguridad: Row Level Security
-- El frontend NUNCA accede directamente a Supabase, solo el backend
-- Flask usa la service_role key, así que RLS puede quedar restrictivo.
-- =========================================================
alter table solicitudes enable row level security;

-- Ninguna política pública: solo el backend (service_role) puede
-- leer/escribir, ya que service_role bypassea RLS por diseño.
-- No se crean policies para anon/authenticated a propósito.

-- =========================================================
-- Tercera entidad: perfil de cliente
-- Supabase Auth (auth.users) solo guarda email + password hasheado.
-- Esta tabla extiende esa cuenta con los datos reales del cliente
-- (nombre, teléfono) que se piden en el registro del portal.
-- =========================================================
create table if not exists clientes (
    id            uuid primary key references auth.users(id) on delete cascade,
    created_at    timestamptz not null default now(),
    nombre        text not null,
    telefono      text not null,
    correo        text not null
);

alter table clientes enable row level security;
-- Mismo criterio que las demás tablas: solo el backend (service_role)
-- lee/escribe esta tabla, así que no se crean policies para anon/authenticated.

-- =========================================================
-- Segunda entidad: catálogo de servicios (gestionado por el admin)
-- Alimenta la sección "Nuestros Servicios" de la landing pública.
-- CRUD completo: el admin puede crear, editar, desactivar/eliminar
-- servicios sin tocar código (antes vivían hardcodeados en el
-- frontend, en SERVICIOS_INFO).
-- =========================================================
create table if not exists servicios_catalogo (
    id            bigint generated always as identity primary key,
    created_at    timestamptz not null default now(),
    clave         text not null unique,
    icono         text not null default '🛠️',
    titulo        text not null,
    descripcion   text not null,
    orden         integer not null default 0,
    activo        boolean not null default true
);

create index if not exists idx_servicios_activo_orden
    on servicios_catalogo (activo, orden);

alter table servicios_catalogo enable row level security;
-- Igual que 'solicitudes': solo el backend (service_role) lee/escribe,
-- el endpoint público de solo-lectura pasa por Flask, no por Supabase
-- directamente, así que no se necesitan policies para anon/authenticated.

-- Datos iniciales: el catálogo actual de TekCoat, para no partir de
-- una tabla vacía en la primera migración.
insert into servicios_catalogo (clave, icono, titulo, descripcion, orden) values
    ('pintura_interior', '🎨', 'Pintura Residencial, Comercial e Industrial', 'Interiores y exteriores con acabados de alta calidad, para hogares, negocios e industria.', 1),
    ('lavado_presion', '💦', 'Lavado a Presión', 'Limpieza profunda de fachadas, techos y áreas exteriores con equipo especializado.', 2),
    ('remodelacion', '🔨', 'Remodelación', 'Renovamos y mejoramos espacios adaptándonos a tu visión y presupuesto.', 3),
    ('aplicacion_masilla', '🧱', 'Aplicación de Masilla', 'Resane y nivelación de superficies previo a pintura o acabado final.', 4),
    ('aplicacion_textura', '🖌️', 'Aplicación de Textura', 'Acabados texturizados decorativos para paredes interiores y exteriores.', 5),
    ('limpieza', '🧹', 'Servicios de Limpieza', 'Limpieza post-construcción y de mantenimiento para todo tipo de espacios.', 6),
    ('herreria_construccion', '⚒️', 'Herrería y Construcción General', 'Trabajos de herrería y construcción general, así como cualquier otra actividad de lícito comercio.', 7)
on conflict (clave) do nothing;

-- =========================================================
-- Nota sobre precios:
-- TekCoat ya no maneja una tabla de precios de referencia por m².
-- Cada solicitud queda con `estimacion` en null hasta que el CEO
-- (José Castillo) realice el levantamiento / inspección del proyecto
-- y defina el precio final manualmente (por ahora, directamente en
-- Supabase; si luego se quiere un campo/endpoint en el panel admin
-- para capturarlo desde ahí, se puede agregar fácilmente).
-- =========================================================
