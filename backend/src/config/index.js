const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

function normalizeServiceUrl(value, fallback, envName) {
  const rawValue = typeof value === "string" ? value.trim() : "";

  if (!rawValue) {
    return fallback;
  }

  const withProtocol = rawValue.startsWith("http://") || rawValue.startsWith("https://")
    ? rawValue
    : `http://${rawValue}`;

  try {
    return new URL(withProtocol).toString().replace(/\/$/, "");
  } catch (_error) {
    console.warn(
      `[config] Invalid ${envName} value "${rawValue}". Falling back to ${fallback}.`
    );
    return fallback;
  }
}

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri:
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/enterprise_knowledge_assistant",
  clientUrl: allowedOrigins[0] || "http://localhost:5173",
  allowedOrigins,
  appUrl: normalizeServiceUrl(
    process.env.APP_URL,
    "http://localhost:5000",
    "APP_URL"
  ),
  aiServiceUrl: normalizeServiceUrl(
    process.env.AI_SERVICE_URL,
    "http://localhost:8000",
    "AI_SERVICE_URL"
  ),
  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
    : path.resolve(__dirname, "../../storage/documents"),
  jwtSecret: process.env.JWT_SECRET || "please-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  authCookieName: process.env.AUTH_COOKIE_NAME || "eka_token",
  authCookieMaxAgeMs: Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 604800000),
  adminBootstrapKey: process.env.ADMIN_BOOTSTRAP_KEY || "bootstrap-local-admin",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),
};

config.isProduction = config.nodeEnv === "production";
config.cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.isProduction,
  maxAge: config.authCookieMaxAgeMs,
};

module.exports = config;
