import http from "./http";

export function login(payload) {
  return http.post("/auth/login", payload).then((response) => response.data);
}

export function register(payload) {
  return http.post("/auth/register", payload).then((response) => response.data);
}

export function registerAdmin(payload) {
  return http.post("/auth/register-admin", payload).then((response) => response.data);
}

export function getSetupStatus() {
  return http.get("/auth/setup-status").then((response) => response.data);
}

export function bootstrapAdmin(payload) {
  return http.post("/auth/bootstrap-admin", payload).then((response) => response.data);
}

export function logout() {
  return http.post("/auth/logout").then((response) => response.data);
}

export function getCurrentUser() {
  return http.get("/auth/me").then((response) => response.data);
}
