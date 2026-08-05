/**
 * CONFIGURACIÓN DE PRECIOS — TekCoat Construct
 * -----------------------------------------------
 * Este archivo puede ser editado por el administrador
 * para actualizar los rangos de precios por servicio.
 * Precios en pesos dominicanos (RD$) por metro cuadrado (m²).
 */

const PRECIOS = {
  pintura_interior: {
    nombre: "Pintura Interior",
    min_por_m2: 180,   // RD$ mínimo por m²
    max_por_m2: 320,   // RD$ máximo por m²
    minimo_trabajo: 5000, // Mínimo cobrable por trabajo
    descripcion: "Incluye preparación de superficie, sellador y dos manos de pintura."
  },
  pintura_exterior: {
    nombre: "Pintura Exterior",
    min_por_m2: 220,
    max_por_m2: 400,
    minimo_trabajo: 7000,
    descripcion: "Incluye limpieza, preparación, sellador exterior y dos manos de pintura resistente."
  },
  impermeabilizacion: {
    nombre: "Impermeabilización",
    min_por_m2: 350,
    max_por_m2: 600,
    minimo_trabajo: 8000,
    descripcion: "Incluye limpieza, aplicación de impermeabilizante en dos capas y membrana de refuerzo si aplica."
  },
  remodelacion: {
    nombre: "Remodelación",
    min_por_m2: 500,
    max_por_m2: 1200,
    minimo_trabajo: 15000,
    descripcion: "El precio varía según el tipo de trabajo. Esta estimación es referencial; se requiere visita técnica para confirmación."
  }
};
