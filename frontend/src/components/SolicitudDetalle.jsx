import { NOMBRE_SERVICIO, linkWhatsapp } from "../servicios.js";

export default function SolicitudDetalle({ solicitud, onCerrar, onCambiarEstado, onEliminar, actualizando }) {
  if (!solicitud) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Solicitud #{solicitud.id}</h2>
          <button className="cerrar" onClick={onCerrar}>×</button>
        </div>

        <div className="modal-body">
          <div className="detalle-grid">
            <div className="detalle-row"><span>Fecha:</span><strong>{new Date(solicitud.created_at).toLocaleString("es-DO")}</strong></div>
            <div className="detalle-row"><span>Estado:</span><span className={`badge badge-${solicitud.estado}`}>{solicitud.estado}</span></div>
            <div className="detalle-row"><span>Nombre:</span><strong>{solicitud.nombre}</strong></div>
            <div className="detalle-row">
              <span>Teléfono:</span>
              <a href={linkWhatsapp(solicitud.telefono)} target="_blank" rel="noreferrer">📱 {solicitud.telefono}</a>
            </div>
            <div className="detalle-row"><span>Correo:</span>{solicitud.correo || "—"}</div>
            <div className="detalle-row"><span>Dirección:</span>{solicitud.direccion}</div>
            <div className="detalle-row"><span>Servicio:</span>{NOMBRE_SERVICIO[solicitud.servicio] || solicitud.servicio}</div>
            <div className="detalle-row"><span>Área:</span>{solicitud.metros} m² {solicitud.pisos > 1 ? `× ${solicitud.pisos} pisos` : ""}</div>
            <div className="detalle-row">
              <span>Precio:</span>
              <strong>
                {solicitud.estimacion != null ? `RD$ ${solicitud.estimacion}` : "Pendiente de inspección"}
              </strong>
            </div>
          </div>
          <div className="descripcion-block">
            <span>Descripción</span>
            <p>{solicitud.descripcion || "No especificada."}</p>
          </div>
        </div>

        <div className="modal-footer">
          <div className="acciones">
            <button
              className="btn-atender"
              disabled={actualizando || solicitud.estado === "atendida"}
              onClick={() => onCambiarEstado(solicitud.id, "atendida")}
            >
              ✔ Marcar atendida
            </button>
            <button
              className="btn-rechazar"
              disabled={actualizando || solicitud.estado === "rechazada"}
              onClick={() => onCambiarEstado(solicitud.id, "rechazada")}
            >
              ✗ Rechazar
            </button>
            {onEliminar && (
              <button
                className="btn-rechazar"
                disabled={actualizando || solicitud.estado === "pendiente"}
                title={solicitud.estado === "pendiente" ? "Resuelve la solicitud antes de eliminarla" : "Eliminar definitivamente"}
                onClick={() => onEliminar(solicitud)}
              >
                🗑 Eliminar
              </button>
            )}
            <button className="btn-secondary small" onClick={onCerrar}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
