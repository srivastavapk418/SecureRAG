import http from "./http";

export function listDocuments() {
  return http.get("/documents").then((response) => response.data);
}

export function uploadDocument(formData) {
  return http
    .post("/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => response.data);
}

export function reindexDocument(documentId) {
  return http.post(`/documents/${documentId}/reindex`).then((response) => response.data);
}

export function deleteDocument(documentId) {
  return http.delete(`/documents/${documentId}`).then((response) => response.data);
}
