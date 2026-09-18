import axios from "axios";

const LOCAL_FALLBACK = "http://localhost:5000/api/v1";
const STORAGE_KEY = "securerag_active_api_endpoint";

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
      // If no /api/v1 suffix provided, append /api/v1
      return `${parsedUrl.origin}${cleanPath ? cleanPath : ""}/api/v1`.replace(/\/+api\/v1/, "/api/v1");
    }

    return `${parsedUrl.origin}${cleanPath}`;
  } catch (_error) {
    return "";
  }
}

// 1. Resolve Primary (Azure) and Fallback (Render) Endpoints
const PRIMARY_URL =
  normalizeApiBaseUrl(import.meta.env.VITE_AZURE_API_URL) ||
  normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
  LOCAL_FALLBACK;

const FALLBACK_URL =
  normalizeApiBaseUrl(import.meta.env.VITE_RENDER_API_URL) ||
  normalizeApiBaseUrl(import.meta.env.VITE_API_FALLBACK_URL) ||
  "";

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

// 3. Create Axios Instance
const http = axios.create({
  baseURL: getActiveBaseUrl(),
  withCredentials: true,
  timeout: 30000,
});

// Update baseURL on each request in case of runtime failover
http.interceptors.request.use((config) => {
  config.baseURL = getActiveBaseUrl();
  return config;
});

// 4. Automated Multi-Cloud Failover Interceptor
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error represents cluster downtime (Network error, DNS error, timeout, or 502/503/504)
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
        `[Multi-Cloud Failover] Primary cluster (${getActiveBaseUrl()}) is unreachable or down. ` +
        `Automatically switching traffic to secondary cluster (${FALLBACK_URL}).`
      );

      // Permanently switch active endpoint for this session
      setActiveBaseUrl(FALLBACK_URL);

      // Mark request to prevent infinite retry loops
      originalRequest._failoverAttempted = true;
      originalRequest.baseURL = FALLBACK_URL;

      // Re-dispatch request immediately to fallback cluster
      return axios.request(originalRequest);
    }

    return Promise.reject(error);
  }
);

// 5. Background Health Check & Pre-emptive Failover
if (typeof window !== "undefined" && FALLBACK_URL && PRIMARY_URL !== FALLBACK_URL) {
  // Only probe if we haven't already failed over in this session
  if (getActiveBaseUrl() === PRIMARY_URL) {
    fetch(`${PRIMARY_URL}/health`, { method: "GET", signal: AbortSignal.timeout(4000) })
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

export { PRIMARY_URL, FALLBACK_URL, getActiveBaseUrl };
export default http;
