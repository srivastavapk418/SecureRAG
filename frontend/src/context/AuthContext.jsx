import { createContext, useEffect, useState } from "react";

import * as authApi from "../api/authApi";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, []);

  async function refreshSession() {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.user);
      return response.user;
    } catch (_error) {
      setUser(null);
      return null;
    }
  }

  async function login(payload) {
    const response = await authApi.login(payload);
    setUser(response.user);
    return response.user;
  }

  async function register(payload) {
    const response = await authApi.register(payload);
    setUser(response.user);
    return response.user;
  }

  async function registerAdmin(payload) {
    const response = await authApi.registerAdmin(payload);
    setUser(response.user);
    return response.user;
  }

  async function bootstrapAdmin(payload) {
    const response = await authApi.bootstrapAdmin(payload);
    setUser(response.user);
    return response.user;
  }

  async function logout() {
    await authApi.logout();
    setUser(null);
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    registerAdmin,
    bootstrapAdmin,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
