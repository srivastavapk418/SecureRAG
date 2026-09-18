const ApiError = require("../utils/ApiError");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateRegisterPayload(body) {
  const name = normalizeString(body.name);
  const email = normalizeString(body.email).toLowerCase();
  const password = normalizeString(body.password);

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  if (!emailPattern.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const department = normalizeString(body.department) || "General";

  return { name, email, password, department };
}

function validateLoginPayload(body) {
  const email = normalizeString(body.email).toLowerCase();
  const password = normalizeString(body.password);

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  return { email, password };
}

function validateBootstrapPayload(body) {
  const payload = validateRegisterPayload(body);
  const bootstrapKey = normalizeString(body.bootstrapKey);

  if (!bootstrapKey) {
    throw new ApiError(400, "Bootstrap key is required");
  }

  return {
    ...payload,
    bootstrapKey,
  };
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
  validateBootstrapPayload,
};

