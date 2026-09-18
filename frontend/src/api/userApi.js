import http from "./http";

export function getProfile() {
  return http.get("/users/me").then((response) => response.data);
}

export function updateProfile(payload) {
  return http.put("/users/me", payload).then((response) => response.data);
}

export function deleteAccount() {
  return http.delete("/users/me").then((response) => response.data);
}

export function listUsers() {
  return http.get("/users").then((response) => response.data);
}

export function createUser(payload) {
  return http.post("/users", payload).then((response) => response.data);
}

export function deleteUser(id) {
  return http.delete(`/users/${id}`).then((response) => response.data);
}
