import axios from "axios";

const DEFAULT_API_BASE_URL = "http://localhost:5000/api/v1";

function normalizeApiBaseUrl(value) {
  const rawValue = typeof value === "string" ? value.trim() : "";

  if (!rawValue) {
    return DEFAULT_API_BASE_URL;
  }

  const withoutTrailingSlash = rawValue.replace(/\/+$/, "");
  const correctedValue = withoutTrailingSlash.replace(/\/api\/v(\d+)a$/, "/api/v$1");

  if (correctedValue !== withoutTrailingSlash) {
    console.warn(
      `[http] Corrected VITE_API_BASE_URL from "${rawValue}" to "${correctedValue}".`
    );
  }

  try {
    const parsedUrl = correctedValue.startsWith("http://") || correctedValue.startsWith("https://")
      ? new URL(correctedValue)
      : new URL(correctedValue, window.location.origin);

    if (!/\/api\/v\d+$/.test(parsedUrl.pathname.replace(/\/+$/, ""))) {
      throw new Error("API base URL must end with /api/v<version>");
    }

    return `${parsedUrl.origin}${parsedUrl.pathname.replace(/\/+$/, "")}`;
  } catch (_error) {
    console.warn(
      `[http] Invalid VITE_API_BASE_URL "${rawValue}". Falling back to ${DEFAULT_API_BASE_URL}.`
    );
    return DEFAULT_API_BASE_URL;
  }
}

const http = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  withCredentials: true,
});

export default http;
