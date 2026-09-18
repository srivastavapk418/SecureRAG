import axios from "axios";

const LOCAL_FALLBACK = "http://localhost:5000/api/v1";
const STORAGE_KEY = "securerag_active_api_endpoint";
const TOKEN_KEY = "securerag_token";

function normalizeApiBaseUrl(value) {
  const rawValue = typeof value === "string" ? value.trim() : "";
  if (!rawValue) return "";

  const withoutTrailingSlash = rawValue.replace(/\/+$/, "");
  const correctedValue = withoutTrailingSlash.replace(/\/api\/v(\d+)a$/, "/api/v$1");

  try {
    const parsedUrl = correctedValue.startsWith("http://") || correctedValue.startsWith("https://")
      ? new URL(correctedValue)
      : new URL(correctedValue, window.location.origin);

    const cleanPath = parsedUrl.pathname.replace(/\/+$/, "");
    if (!/\/api\/v\d+$/.test(cleanPath)) {
      return `${parsedUrl.origin}${cleanPath ? cleanPath : ""}/api/v1`.replace(/\/+api\/v1/, "/api/v1");
    }

    return `${parsedUrl.origin}${cleanPath}`;
  } catch (_error) {
    return "";
  }
}

// 1. Resolve Primary and Fallback Endpoints intelligently
// If Azure is configured, Azure is primary.
// If only Render is configured, Render is primary!
// If local/custom, use API_BASE_URL or fallback to localhost.
const PRIMARY_URL =
  normalizeApiBaseUrl(import.meta.env.VITE_AZURE_API_URL) ||
  normalizeApiBaseUrl(import.meta.env.VITE_RENDER_API_URL) ||
  normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
  LOCAL_FALLBACK;

const FALLBACK_URL =
  import.meta.env.VITE_AZURE_API_URL && import.meta.env.VITE_RENDER_API_URL
    ? normalizeApiBaseUrl(import.meta.env.VITE_RENDER_API_URL)
    : normalizeApiBaseUrl(import.meta.env.VITE_API_FALLBACK_URL) || "";

// 2. Active Endpoint Manager
function getActiveBaseUrl() {
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) return cached;
  }
  return PRIMARY_URL;
}

function setActiveBaseUrl(url) {
  if (typeof window !== "undefined" && url) {
    sessionStorage.setItem(STORAGE_KEY, url);
  }
}

// 3. Create Axios Instance with Bearer Token & Cold-Start Timeout
const http = axios.create({
  baseURL: getActiveBaseUrl(),
  withCredentials: true,
  timeout: 75000, // 75s to comfortably absorb free tier cold starts
});

// Attach Bearer token and active baseUrl on each request
http.interceptors.request.use((config) => {
  config.baseURL = getActiveBaseUrl();
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 4. Automated Multi-Cloud Failover Interceptor
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isNetworkError = !error.response;
    const isServerDown = [502, 503, 504].includes(error.response?.status);
    const isTimeout = error.code === "ECONNABORTED";

    const isEligibleForFailover =
      (isNetworkError || isServerDown || isTimeout) &&
      !originalRequest?._failoverAttempted &&
      FALLBACK_URL &&
      FALLBACK_URL !== getActiveBaseUrl();

    if (isEligibleForFailover) {
      console.warn(
        `[Multi-Cloud Failover] Primary cluster (${getActiveBaseUrl()}) failed. ` +
        `Automatically switching to secondary cluster (${FALLBACK_URL}).`
      );

      setActiveBaseUrl(FALLBACK_URL);
      originalRequest._failoverAttempted = true;
      originalRequest.baseURL = FALLBACK_URL;

      return axios.request(originalRequest);
    }

    return Promise.reject(error);
  }
);

// 5. Background Health Check & Pre-emptive Failover
if (typeof window !== "undefined" && FALLBACK_URL && PRIMARY_URL !== FALLBACK_URL) {
  if (getActiveBaseUrl() === PRIMARY_URL) {
    fetch(`${PRIMARY_URL}/health`, { method: "GET", signal: AbortSignal.timeout(5000) })
      .then((res) => {
        if (!res.ok && res.status >= 500) {
          throw new Error("Primary cluster unhealthy");
        }
      })
      .catch((_err) => {
        console.warn(
          `[Multi-Cloud Health Probe] Primary cluster failed health check. Pre-emptively switching to secondary cluster: ${FALLBACK_URL}`
        );
        setActiveBaseUrl(FALLBACK_URL);
      });
  }
}

export { PRIMARY_URL, FALLBACK_URL, getActiveBaseUrl, TOKEN_KEY };
export default http;
