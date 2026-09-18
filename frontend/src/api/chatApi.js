import http from "./http";

export function listSessions() {
  return http.get("/chat/sessions").then((response) => response.data);
}

export function getSessionMessages(sessionId) {
  return http.get(`/chat/sessions/${sessionId}/messages`).then((response) => response.data);
}

export function askQuestion(payload) {
  return http.post("/chat/query", payload).then((response) => response.data);
}

export function deleteSession(sessionId) {
  return http.delete(`/chat/sessions/${sessionId}`).then((response) => response.data);
}

