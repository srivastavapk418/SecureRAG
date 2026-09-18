const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const config = require("../config");
const { verifyToken } = require("../utils/jwt");

async function authenticate(req, _res, next) {
  const cookieToken = req.cookies?.[config.authCookieName];
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).select("-password");

    if (!user) {
      return next(new ApiError(401, "Session is no longer valid"));
    }

    req.user = user;
    return next();
  } catch (_error) {
    return next(new ApiError(401, "Invalid or expired session"));
  }
}

module.exports = {
  authenticate,
};

