import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: BASE_URL });

// Dos sesiones independientes pueden convivir en el navegador: el
// panel admin y el portal de clientes. Cada una guarda su propio
// token para no pisarse entre sí.
let adminToken = null;
export function setToken(token) { adminToken = token; }
export function clearToken() { adminToken = null; }

let clienteToken = null;
export function setClienteToken(token) { clienteToken = token; }
export function clearClienteToken() { clienteToken = null; }

api.interceptors.request.use((config) => {
  // Tres grupos de rutas:
  // - /mias y /auth/cliente/*            -> siempre token de cliente
  // - POST /solicitudes (form público)   -> token de cliente si hay sesión
  //   (para que la solicitud quede asociada a la cuenta automáticamente),
  //   nunca token de admin
  // - todo lo demás (panel admin)        -> token de admin
  const esPortalCliente = config.url?.includes("/mias") || config.url?.includes("/cliente/");
  const esCreacionPublica = config.url === "/solicitudes" && config.method === "post";

  const token = esPortalCliente || esCreacionPublica ? clienteToken : adminToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Públicos
export const crearSolicitud = (payload) => api.post("/solicitudes", payload);

// Auth admin
export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const signup = (email, password, confirmar_password) =>
  api.post("/auth/signup", { email, password, confirmar_password });

// Admin (requieren JWT admin)
export const listarSolicitudes = (estado) =>
  api.get("/solicitudes", { params: estado ? { estado } : {} });

export const actualizarEstado = (id, estado) =>
  api.patch(`/solicitudes/${id}`, { estado });

export const eliminarSolicitud = (id) => api.delete(`/solicitudes/${id}`);

// Servicios — lectura pública (landing) y CRUD admin
export const listarServiciosPublico = () => api.get("/servicios");

export const listarServiciosAdmin = () => api.get("/servicios/admin");

export const crearServicio = (payload) => api.post("/servicios", payload);

export const actualizarServicio = (id, payload) =>
  api.put(`/servicios/${id}`, payload);

export const eliminarServicio = (id) => api.delete(`/servicios/${id}`);

// Auth cliente (portal)
export const loginCliente = (email, password) =>
  api.post("/auth/cliente/login", { email, password });

export const signupCliente = (email, password, confirmar_password, nombre, telefono) =>
  api.post("/auth/cliente/signup", { email, password, confirmar_password, nombre, telefono });

// Portal de clientes (requieren JWT cliente)
export const misSolicitudes = () => api.get("/solicitudes/mias");

export const editarMiSolicitud = (id, payload) =>
  api.patch(`/solicitudes/mias/${id}`, payload);

export const cancelarMiSolicitud = (id) =>
  api.patch(`/solicitudes/mias/${id}/cancelar`);

export default api;
