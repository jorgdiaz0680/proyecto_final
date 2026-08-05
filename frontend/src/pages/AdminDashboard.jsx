import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { listarSolicitudes, actualizarEstado, eliminarSolicitud } from "../api";
import SolicitudDetalle from "../components/SolicitudDetalle.jsx";
import { NOMBRE_SERVICIO, linkWhatsapp } from "../servicios.js";

function exportarCSV(solicitudes) {
  if (solicitudes.length === 0) return;
  const headers = ["ID", "Fecha", "Nombre", "Teléfono", "Correo", "Dirección", "Servicio", "m²", "Precio", "Descripción", "Estado"];
  const rows = solicitudes.map((s) => [
    s.id,
    new Date(s.created_at).toLocaleString("es-DO"),
    s.nombre,
    s.telefono,
    s.correo,
    s.direccion,
    NOMBRE_SERVICIO[s.servicio] || s.servicio,
    s.metros,
    s.estimacion != null ? s.estimacion : "Pendiente de inspección",
    s.descripcion,
    s.estado,
  ].map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`));

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tekcoat_solicitudes.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [buscar, setBuscar] = useState("");
  const [seleccionada, setSeleccionada] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await listarSolicitudes(filtroEstado || undefined);
      setSolicitudes(data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/admin/login");
        return;
      }
      setError("No se pudieron cargar las solicitudes.");
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, logout, navigate]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtradas = useMemo(() => {
    const q = buscar.toLowerCase();
    if (!q) return solicitudes;
    return solicitudes.filter((s) =>
      s.nombre?.toLowerCase().includes(q) ||
      s.telefono?.toLowerCase().includes(q) ||
      (NOMBRE_SERVICIO[s.servicio] || s.servicio || "").toLowerCase().includes(q)
    );
  }, [solicitudes, buscar]);

  const stats = useMemo(() => {
    const total = solicitudes.length;
    const pendientes = solicitudes.filter((s) => s.estado === "pendiente").length;
    const atendidas = solicitudes.filter((s) => s.estado === "atendida").length;
    const rechazadas = solicitudes.filter((s) => s.estado === "rechazada").length;
    const canceladas = solicitudes.filter((s) => s.estado === "cancelada").length;
    return { total, pendientes, atendidas, rechazadas, canceladas };
  }, [solicitudes]);

  const handleCambiarEstado = async (id, nuevoEstado) => {
    setActualizando(true);
    try {
      const { data } = await actualizarEstado(id, nuevoEstado);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? data : s)));
      setSeleccionada(data);
    } catch {
      setError("No se pudo actualizar el estado.");
    } finally {
      setActualizando(false);
    }
  };

  const handleEliminar = async (solicitud) => {
    if (!window.confirm(`¿Eliminar definitivamente la solicitud #${solicitud.id} de ${solicitud.nombre}?`)) return;
    setError(null);
    try {
      await eliminarSolicitud(solicitud.id);
      setSolicitudes((prev) => prev.filter((s) => s.id !== solicitud.id));
      if (seleccionada?.id === solicitud.id) setSeleccionada(null);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo eliminar la solicitud.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-body">
      <header className="admin-header">
        <div className="header-inner">
          <span className="logo-text">TekCoat<span>Admin</span></span>
          <div className="admin-nav">
            <span>{new Date().toLocaleDateString("es-DO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            <Link to="/admin/servicios" className="btn-secondary small on-navy">Servicios</Link>
            <button className="btn-secondary small on-navy" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="stats-grid">
          <div className="stat-card"><span className="stat-num">{stats.total}</span><span className="stat-label">Total solicitudes</span></div>
          <div className="stat-card pendiente"><span className="stat-num">{stats.pendientes}</span><span className="stat-label">Pendientes</span></div>
          <div className="stat-card atendida"><span className="stat-num">{stats.atendidas}</span><span className="stat-label">Atendidas</span></div>
          <div className="stat-card rechazada"><span className="stat-num">{stats.rechazadas}</span><span className="stat-label">Rechazadas</span></div>
          <div className="stat-card cancelada"><span className="stat-num">{stats.canceladas}</span><span className="stat-label">Canceladas</span></div>
        </div>

        <div className="filtros-bar">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, teléfono o servicio..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="atendida">Atendidas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
          <button className="btn-secondary small" onClick={() => exportarCSV(filtradas)}>⬇ Exportar CSV</button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="table-wrapper">
          {cargando ? (
            <p style={{ textAlign: "center", padding: 40, color: "#888" }}>Cargando...</p>
          ) : filtradas.length === 0 ? (
            <p style={{ textAlign: "center", padding: 40, color: "#888" }}>No hay solicitudes aún.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Servicio</th>
                  <th>m²</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((s) => (
                  <tr key={s.id} className="fila-clickeable" onClick={() => setSeleccionada(s)}>
                    <td>{s.id}</td>
                    <td>{new Date(s.created_at).toLocaleDateString("es-DO")}</td>
                    <td><strong>{s.nombre}</strong><br /><small>{s.direccion}</small></td>
                    <td>
                      <a href={linkWhatsapp(s.telefono)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        📱 {s.telefono}
                      </a>
                    </td>
                    <td>{NOMBRE_SERVICIO[s.servicio] || s.servicio}</td>
                    <td>{s.metros} m²</td>
                    <td>{s.estimacion != null ? `RD$ ${s.estimacion}` : "Pendiente de inspección"}</td>
                    <td><span className={`badge badge-${s.estado}`}>{s.estado}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn-sm" onClick={() => setSeleccionada(s)}>Ver</button>{" "}
                      <button
                        className="btn-sm btn-sm-green"
                        disabled={s.estado === "atendida"}
                        onClick={() => handleCambiarEstado(s.id, "atendida")}
                      >✔</button>{" "}
                      <button
                        className="btn-sm btn-sm-red"
                        disabled={s.estado === "rechazada"}
                        onClick={() => handleCambiarEstado(s.id, "rechazada")}
                      >✗</button>{" "}
                      <button
                        className="btn-sm btn-sm-red"
                        disabled={s.estado === "pendiente"}
                        title={s.estado === "pendiente" ? "Resuelve la solicitud antes de eliminarla" : "Eliminar definitivamente"}
                        onClick={() => handleEliminar(s)}
                      >🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <SolicitudDetalle
        solicitud={seleccionada}
        onCerrar={() => setSeleccionada(null)}
        onCambiarEstado={handleCambiarEstado}
        onEliminar={handleEliminar}
        actualizando={actualizando}
      />
    </div>
  );
}
