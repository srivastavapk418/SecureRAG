const axios = require("axios");

const config = require("../config");
const ApiError = require("../utils/ApiError");

const aiClient = axios.create({
  baseURL: config.aiServiceUrl,
  timeout: 120000,
});

function extractAiServiceMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || String(item)).join(", ");
  }

  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }

  if (typeof error.response?.data?.message === "string" && error.response.data.message.trim()) {
    return error.response.data.message.trim();
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
}

async function ingestDocument(payload) {
  try {
    const response = await aiClient.post("/api/v1/ingestion/documents", payload);
    return response.data;
  } catch (error) {
    throw new ApiError(
      error.response?.status || 502,
      extractAiServiceMessage(error, "Failed to ingest document with AI service")
    );
  }
}

async function queryAssistant(payload) {
  try {
    const response = await aiClient.post("/api/v1/query", payload);
    return response.data;
  } catch (error) {
    throw new ApiError(
      error.response?.status || 502,
      extractAiServiceMessage(error, "Failed to fetch AI response")
    );
  }
}

async function deleteDocument(documentId) {
  try {
    const response = await aiClient.delete(`/api/v1/ingestion/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw new ApiError(
      error.response?.status || 502,
      extractAiServiceMessage(error, "Failed to delete document from AI service")
    );
  }
}

module.exports = {
  ingestDocument,
  queryAssistant,
  deleteDocument,
};
