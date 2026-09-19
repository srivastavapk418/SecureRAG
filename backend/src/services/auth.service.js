const ROLES = require("../constants/roles");
const ApiError = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");
const userRepository = require("../repositories/user.repository");

function buildPublicUser(user) {
  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
}

async function registerEmployee(payload) {
  const existingUser = await userRepository.findByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await userRepository.createUser({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: payload.password,
    role: ROLES.EMPLOYEE,
    department: payload.department || "General",
  });

  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    department: user.department || "General",
  });

  return {
    token,
    user: buildPublicUser(user),
  };
}

async function login(payload) {
  const user = await userRepository.findByEmailWithPassword(payload.email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.comparePassword(payload.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  user.lastLoginAt = new Date();
  await userRepository.updateUser(user.id, { lastLoginAt: user.lastLoginAt });

  const safeUser = user.toObject();
  delete safeUser.password;

  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    department: user.department || "General",
  });

  return {
    token,
    user: safeUser,
  };
}

async function getSetupStatus() {
  const adminCount = await userRepository.countAdmins();

  return {
    adminExists: adminCount > 0,
    bootstrapAvailable: adminCount === 0,
  };
}

async function registerAdmin(payload, bootstrapKey) {
  if (payload.bootstrapKey !== bootstrapKey) {
    throw new ApiError(403, "Admin bootstrap key is invalid");
  }

  const existingUser = await userRepository.findByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await userRepository.createUser({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: payload.password,
    role: ROLES.ADMIN,
    department: payload.department || "Executive",
  });

  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    department: user.department || "Executive",
  });

  return {
    token,
    user: buildPublicUser(user),
  };
}

async function bootstrapAdmin(payload, bootstrapKey) {
  return registerAdmin(payload, bootstrapKey);
}

module.exports = {
  registerEmployee,
  login,
  getSetupStatus,
  registerAdmin,
  bootstrapAdmin,
};
