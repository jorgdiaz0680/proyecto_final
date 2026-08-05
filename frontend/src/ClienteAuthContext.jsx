import { createContext, useContext, useState, useCallback } from "react";
import { setClienteToken, clearClienteToken, loginCliente } from "./api";

const ClienteAuthContext = createContext(null);

export function ClienteAuthProvider({ children }) {
  const [cliente, setCliente] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (email, password) => {
    const { data } = await loginCliente(email, password);
    setClienteToken(data.access_token);
    setCliente(data.user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearClienteToken();
    setCliente(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <ClienteAuthContext.Provider value={{ cliente, isAuthenticated, login, logout }}>
      {children}
    </ClienteAuthContext.Provider>
  );
}

export function useClienteAuth() {
  const ctx = useContext(ClienteAuthContext);
  if (!ctx) throw new Error("useClienteAuth debe usarse dentro de <ClienteAuthProvider>");
  return ctx;
}
