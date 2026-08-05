import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { ClienteAuthProvider, useClienteAuth } from "./ClienteAuthContext.jsx";
import PublicForm from "./pages/PublicForm.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminSignup from "./pages/AdminSignup.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminServicios from "./pages/AdminServicios.jsx";
import ClienteLogin from "./pages/ClienteLogin.jsx";
import ClienteSignup from "./pages/ClienteSignup.jsx";
import ClientePortal from "./pages/ClientePortal.jsx";

function RutaProtegida({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

function RutaProtegidaCliente({ children }) {
  const { isAuthenticated } = useClienteAuth();
  if (!isAuthenticated) return <Navigate to="/portal/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Página pública de cotización */}
      <Route path="/" element={<PublicForm />} />

      {/* Auth admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />

      {/* Panel admin — protegido */}
      <Route
        path="/admin"
        element={
          <RutaProtegida>
            <AdminDashboard />
          </RutaProtegida>
        }
      />

      {/* Catálogo de servicios — protegido, admin */}
      <Route
        path="/admin/servicios"
        element={
          <RutaProtegida>
            <AdminServicios />
          </RutaProtegida>
        }
      />

      {/* Auth cliente (portal) */}
      <Route path="/portal/login" element={<ClienteLogin />} />
      <Route path="/portal/signup" element={<ClienteSignup />} />

      {/* Portal de clientes — protegido */}
      <Route
        path="/portal"
        element={
          <RutaProtegidaCliente>
            <ClientePortal />
          </RutaProtegidaCliente>
        }
      />

      {/* Cualquier ruta desconocida → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClienteAuthProvider>
        <AppRoutes />
      </ClienteAuthProvider>
    </AuthProvider>
  );
}
