import { createContext, useContext, useState, useCallback } from "react";
import { setToken, clearToken, login as loginRequest } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (email, password) => {
    const { data } = await loginRequest(email, password);
    setToken(data.access_token);
    setUser(data.user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
