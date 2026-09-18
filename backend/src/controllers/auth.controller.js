const config = require("../config");
const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const {
  validateRegisterPayload,
  validateLoginPayload,
  validateBootstrapPayload,
} = require("../validators/auth.validator");

function setAuthCookie(res, token) {
  res.cookie(config.authCookieName, token, config.cookieOptions);
}

const register = asyncHandler(async (req, res) => {
  const payload = validateRegisterPayload(req.body);
  const result = await authService.registerEmployee(payload);

  setAuthCookie(res, result.token);

  res.status(201).json({
    user: result.user,
    token: result.token,
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = validateLoginPayload(req.body);
  const result = await authService.login(payload);

  setAuthCookie(res, result.token);

  res.json({
    user: result.user,
    token: result.token,
  });
});

const getSetupStatus = asyncHandler(async (_req, res) => {
  const status = await authService.getSetupStatus();

  res.json(status);
});

const bootstrapAdmin = asyncHandler(async (req, res) => {
  const payload = validateBootstrapPayload(req.body);
  const result = await authService.bootstrapAdmin(payload, config.adminBootstrapKey);

  setAuthCookie(res, result.token);

  res.status(201).json({
    user: result.user,
    token: result.token,
  });
});

const registerAdmin = asyncHandler(async (req, res) => {
  const payload = validateBootstrapPayload(req.body);
  const result = await authService.registerAdmin(payload, config.adminBootstrapKey);

  setAuthCookie(res, result.token);

  res.status(201).json({
    user: result.user,
    token: result.token,
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(config.authCookieName, {
    ...config.cookieOptions,
    maxAge: undefined,
  });

  res.status(204).send();
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    user: req.user,
  });
});

module.exports = {
  register,
  login,
  getSetupStatus,
  registerAdmin,
  bootstrapAdmin,
  logout,
  getCurrentUser,
};
