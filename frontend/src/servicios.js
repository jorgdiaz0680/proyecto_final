// Catálogo de servicios de TekCoat Construct, S.R.L., basado en el
// objeto social y principales productos/servicios registrados de la
// empresa: pintura residencial, comercial e industrial; lavado a
// presión; remodelación; aplicación de masilla; aplicación de
// textura; servicios de limpieza; y herrería y construcción general.

export const NOMBRE_SERVICIO = {
  pintura_interior: "Pintura Interior",
  pintura_exterior: "Pintura Exterior",
  lavado_presion: "Lavado a Presión",
  remodelacion: "Remodelación",
  aplicacion_masilla: "Aplicación de Masilla",
  aplicacion_textura: "Aplicación de Textura",
  limpieza: "Servicios de Limpieza",
  herreria_construccion: "Herrería y Construcción General",
};

// Para el <select> del formulario público, agrupados con su etiqueta
// de valor (clave del backend) — mismo orden en que aparecen en el
// objeto social de la empresa.
export const OPCIONES_SERVICIO = [
  { valor: "pintura_interior", etiqueta: "Pintura Interior (residencial/comercial/industrial)" },
  { valor: "pintura_exterior", etiqueta: "Pintura Exterior (residencial/comercial/industrial)" },
  { valor: "lavado_presion", etiqueta: "Lavado a Presión" },
  { valor: "remodelacion", etiqueta: "Remodelación" },
  { valor: "aplicacion_masilla", etiqueta: "Aplicación de Masilla" },
  { valor: "aplicacion_textura", etiqueta: "Aplicación de Textura" },
  { valor: "limpieza", etiqueta: "Servicios de Limpieza" },
  { valor: "herreria_construccion", etiqueta: "Herrería y Construcción General" },
];

// NOTA: la sección "Nuestros Servicios" de la landing pública ya NO usa
// un array estático — se carga en vivo desde GET /api/servicios, que
// lee la tabla `servicios_catalogo` en Supabase (gestionada por el
// admin en /admin/servicios con CRUD completo: crear, editar,
// activar/desactivar y eliminar). Los valores de abajo son solo los
// datos semilla que se insertan una vez en `schema.sql`.

export function linkWhatsapp(telefono) {
  const soloNumeros = (telefono || "").replace(/\D/g, "");
  return `https://wa.me/1${soloNumeros}`;
}
