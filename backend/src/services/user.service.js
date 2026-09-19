const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/user.repository");
const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const ApiError = require("../utils/ApiError");
const ROLES = require("../constants/roles");

async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
}

async function updateProfile(userId, payload, requestingUser = null) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isAdmin = requestingUser && requestingUser.role === ROLES.ADMIN;

  const updates = {};
  if (payload.name && payload.name.trim()) {
    updates.name = payload.name.trim();
  }
  // Only admins can reassign a user's department.
  // Employees who submit a department value are silently ignored — the field
  // is disabled on the frontend, but we enforce this server-side too.
  if (isAdmin && payload.department && payload.department.trim()) {
    const VALID_DEPARTMENTS = ["Engineering", "HR", "Finance", "Legal", "Operations", "General"];
    const trimmed = payload.department.trim();
    if (!VALID_DEPARTMENTS.includes(trimmed)) {
      throw new ApiError(400, `Invalid department. Must be one of: ${VALID_DEPARTMENTS.join(", ")}`);
    }
    updates.department = trimmed;
  }
  if (payload.password) {
    if (payload.password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }
    updates.password = await bcrypt.hash(payload.password, 10);
  }

  const updatedUser = await userRepository.updateUser(userId, updates);
  return updatedUser;
}

async function deleteAccount(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === ROLES.ADMIN) {
    const adminCount = await userRepository.countAdmins();
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot delete the last remaining administrator account");
    }
  }

  await Promise.all([
    ChatSession.deleteMany({ user: userId }),
    ChatMessage.deleteMany({ user: userId }),
    userRepository.deleteUser(userId),
  ]);

  return { message: "Account successfully deleted" };
}

async function listAllUsers() {
  return userRepository.listAllUsers();
}

async function createUserByAdmin(payload) {
  const existingUser = await userRepository.findByEmail(payload.email);
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  if (!payload.password || payload.password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const user = await userRepository.createUser({
    name: payload.name.trim(),
    email: payload.email.toLowerCase().trim(),
    password: payload.password,
    role: String(payload.role || "").toLowerCase() === ROLES.ADMIN ? ROLES.ADMIN : ROLES.EMPLOYEE,
    department: payload.department ? payload.department.trim() : "General",
  });

  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
}

async function deleteUserByAdmin(targetUserId, requesterId) {
  const targetUser = await userRepository.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  if (targetUser.role === ROLES.ADMIN) {
    const adminCount = await userRepository.countAdmins();
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot delete the last remaining administrator account");
    }
  }

  await Promise.all([
    ChatSession.deleteMany({ user: targetUserId }),
    ChatMessage.deleteMany({ user: targetUserId }),
    userRepository.deleteUser(targetUserId),
  ]);

  return { message: "User deleted successfully" };
}

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  listAllUsers,
  createUserByAdmin,
  deleteUserByAdmin,
};
