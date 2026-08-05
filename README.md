# TekCoat Construct, S.R.L. — Sistema de Cotización en Línea

Migración del sitio original (HTML/CSS/JS + localStorage) a una
aplicación full-stack real:

- **Frontend:** React + Vite (misma identidad visual: navy `#1B3A5C` + gold `#C8960C`)
- **Backend:** Python + Flask
- **Base de datos:** Supabase (PostgreSQL + Auth) — reemplaza el `localStorage` del prototipo

## Estructura del proyecto

```
proyecto/
├── backend/
│   ├── app.py                  # App Flask principal (blueprints, CORS, JWT)
│   ├── config.py               # Configuración central del backend (Supabase, JWT, CORS)
│   ├── auth_utils.py           # Decoradores admin_required / cliente_required
│   ├── supabase_client.py      # Cliente Supabase (singleton)
│   ├── schema.sql              # Script SQL para crear/migrar la tabla en Supabase
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       ├── solicitudes.py      # POST público + rutas admin + rutas /mias (portal cliente)
│       └── auth.py             # Login/signup de admin y de cliente
└── frontend/
    ├── src/
    │   ├── api.js               # Cliente Axios (maneja token de admin y de cliente por separado)
    │   ├── AuthContext.jsx      # Sesión del panel admin
    │   ├── ClienteAuthContext.jsx  # Sesión del portal de clientes
    │   ├── servicios.js         # Catálogo de servicios compartido por todo el frontend
    │   ├── App.jsx
    │   ├── styles.css           # Paleta e identidad de TekCoat Construct
    │   ├── pages/
    │   │   ├── PublicForm.jsx       # Landing pública: hero, servicios, formulario, contacto
    │   │   ├── AdminLogin.jsx / AdminSignup.jsx
    │   │   ├── AdminDashboard.jsx   # Stats, buscador, filtros, exportar CSV
    │   │   ├── ClienteLogin.jsx / ClienteSignup.jsx  # Login/registro del portal de clientes
    │   │   └── ClientePortal.jsx    # Historial + editar/cancelar solicitudes pendientes
    │   └── components/
    │       └── SolicitudDetalle.jsx
    ├── package.json
    └── vite.config.js
```

## Qué cambió respecto al prototipo original

| Prototipo original | Esta versión |
|---|---|
| Todo en `localStorage` del navegador | Base de datos real en Supabase (PostgreSQL) |
| Contraseña única hardcodeada (`tekcoat2026`) en `admin.js` | Login por usuario + contraseña vía **Supabase Auth**, con JWT propio del backend |
| Cálculo de estimación automática por m² en el navegador (`app.js`) | Ya no hay estimación automática: el precio (`estimacion`) queda pendiente hasta que el CEO (José Castillo) lo defina manualmente tras el levantamiento / inspección |
| Un solo archivo HTML por página | Componentes React reutilizables y con estado |
| Exportar CSV desde `localStorage` | Exportar CSV desde los datos reales de Supabase |
| Solo existía cuenta de administrador | **Portal de clientes**: login/registro propio para ver historial y editar/cancelar solicitudes pendientes |
| Catálogo genérico de 4 servicios | Catálogo alineado al objeto social registrado de la empresa (8 servicios) |

## Portal de clientes (nuevo)

- `/portal/signup` y `/portal/login` — el cliente crea una cuenta o inicia sesión, independiente de la cuenta de administrador.
- `/portal` (protegido) — historial de "mis solicitudes"; si una solicitud está **pendiente**, el cliente puede **editarla** (dirección, servicio, m², pisos, descripción) o **cancelarla**. Una vez que el admin la marca como atendida/rechazada, deja de ser editable/cancelable.
- Si el cliente tiene sesión iniciada al enviar el formulario público, la solicitud queda **asociada automáticamente** a su cuenta (columna `cliente_id`); si no tiene cuenta, el formulario sigue funcionando igual que antes (envío sin login).
- Los JWT llevan un claim `role` (`admin` o `cliente`); el backend valida ese rol en cada endpoint protegido, así que un token de cliente no puede usarse contra las rutas del panel admin, y viceversa.

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta el contenido de `backend/schema.sql`.
   - Si ya tenías la tabla `solicitudes` creada de una versión anterior, usa los comandos `alter table` comentados al final de `schema.sql` para migrarla sin perder datos (agrega `cliente_id` y el estado `cancelada`).
3. Ve a **Authentication > Users** y crea el usuario administrador (correo + contraseña) que usará el panel — o regístralo desde `/admin/signup` en el frontend.
4. Ve a **Project Settings > API** y copia:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (¡nunca la `anon` key!) → `SUPABASE_SERVICE_KEY`

## 2. Backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # y completa tus credenciales de Supabase
python app.py
```

El backend corre en `http://localhost:5000`.

## 3. Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

El frontend corre en `http://localhost:5173`.

- Sitio público (landing + formulario): `http://localhost:5173/`
- Portal de clientes: `http://localhost:5173/portal/login` (registro en `/portal/signup`)
- Login admin: `http://localhost:5173/admin/login`
- Panel admin: `http://localhost:5173/admin` (requiere login)

## Catálogo de servicios (frontend/src/servicios.js)

Basado en el objeto social y principales productos/servicios registrados de TekCoat Construct, S.R.L.
(pintura residencial/comercial/industrial, lavado a presión, remodelación, masilla, textura,
limpieza, herrería y construcción general).

**Precios:** TekCoat ya no muestra ni calcula un rango de RD$/m² automático en el formulario
público. Cada solicitud se guarda con `estimacion = null`, y es **José Castillo (CEO)** quien
define el precio final manualmente después de realizar el levantamiento / inspección del
proyecto en sitio. El panel admin y el portal de clientes muestran "Pendiente de inspección"
mientras ese precio no se haya definido.

## Endpoints implementados

| Método | Ruta                              | Auth          | Descripción                                     |
|--------|------------------------------------|---------------|--------------------------------------------------|
| POST   | /api/solicitudes                  | No (opcional) | Crea solicitud (sin estimación automática). Si hay JWT de cliente, se asocia a su cuenta. |
| GET    | /api/solicitudes                  | JWT admin     | Lista todas las solicitudes (filtro `?estado=`)  |
| PATCH  | /api/solicitudes/:id              | JWT admin     | Cambia el estado de una solicitud                |
| GET    | /api/solicitudes/mias             | JWT cliente   | Historial del cliente autenticado                |
| PATCH  | /api/solicitudes/mias/:id         | JWT cliente   | Edita su propia solicitud (solo si está pendiente) |
| PATCH  | /api/solicitudes/mias/:id/cancelar| JWT cliente   | Cancela su propia solicitud (solo si está pendiente) |
| POST   | /api/auth/login                   | No            | Login admin vía Supabase Auth → JWT propio       |
| POST   | /api/auth/signup                  | No            | Registro de cuenta admin                         |
| POST   | /api/auth/cliente/login           | No            | Login cliente vía Supabase Auth → JWT propio     |
| POST   | /api/auth/cliente/signup          | No            | Registro de cuenta de cliente                    |
| DELETE | /api/solicitudes/:id              | JWT admin     | Elimina definitivamente una solicitud (solo si ya no está "pendiente") |
| GET    | /api/servicios                    | No            | Catálogo de servicios activos (landing pública)  |
| GET    | /api/servicios/admin              | JWT admin     | Catálogo completo (activos e inactivos)          |
| POST   | /api/servicios                    | JWT admin     | Crea un servicio en el catálogo                  |
| PUT    | /api/servicios/:id                | JWT admin     | Edita un servicio (título, descripción, orden, activo) |
| DELETE | /api/servicios/:id                | JWT admin     | Elimina definitivamente un servicio              |

## Tercera entidad: perfil de cliente (nuevo)

Supabase Auth (`auth.users`) solo guarda correo y contraseña hasheada.
Ahora, al registrarse en `/portal/signup`, el cliente también indica
su **nombre** y **teléfono**, que se guardan en una tabla propia
`clientes` (con `id` referenciando a `auth.users`). El login del
portal (`/api/auth/cliente/login`) devuelve ese perfil junto al JWT,
así el portal puede saludar al cliente por su nombre.

## Segunda entidad: catálogo de servicios (nuevo)

La sección "Nuestros Servicios" del sitio público ya no es un array
fijo en el frontend: ahora vive en la tabla `servicios_catalogo` de
Supabase, con CRUD completo desde `/admin/servicios` (crear, editar,
activar/desactivar y eliminar). El sitio público consume
`GET /api/servicios` (solo activos) sin necesidad de login.

**Migración si ya tenías la base de datos creada:** vuelve a correr
`backend/schema.sql` completo en el SQL Editor de Supabase — el
`create table if not exists` y el `insert ... on conflict do nothing`
son seguros de re-ejecutar, no duplican ni borran nada existente.

## Pendiente para próximas fases

- Endpoint/campo en el panel admin para que el CEO capture el precio final (`estimacion`) tras la inspección, en vez de editarlo directamente en Supabase. El precio se calcula manualmente en base a las tarifas de RD$/m² del mercado — no es un cálculo que viva en el código.
- Notificación por WhatsApp/correo automática al cliente cuando cambia el estado.
- Subida de fotos del proyecto en el formulario público.
- Tests automatizados (pytest / Vitest).
- Despliegue: backend en Render/Railway, frontend en Vercel/Netlify.
- Definir quién en TekCoat tendrá cuenta de administrador (hoy cualquiera que se registre en `/admin/signup` obtiene acceso — para producción conviene restringir el registro de admin o crear las cuentas manualmente desde Supabase).
