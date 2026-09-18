const User = require("../models/User");
const ROLES = require("../constants/roles");

function createUser(payload) {
  return User.create(payload);
}

function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}

function findByEmailWithPassword(email) {
  return User.findOne({ email: email.toLowerCase() }).select("+password");
}

function findById(id) {
  return User.findById(id).select("-password");
}

function countUsers() {
  return User.countDocuments();
}

function listRecentUsers(limit = 5) {
  return User.find().select("-password").sort({ createdAt: -1 }).limit(limit);
}

function countAdmins() {
  return User.countDocuments({ role: ROLES.ADMIN });
}

function listAllUsers() {
  return User.find().select("-password").sort({ createdAt: -1 });
}

function updateUser(id, updates) {
  return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select("-password");
}

function deleteUser(id) {
  return User.findByIdAndDelete(id);
}

module.exports = {
  createUser,
  findByEmail,
  findByEmailWithPassword,
  findById,
  countUsers,
  listRecentUsers,
  countAdmins,
  listAllUsers,
  updateUser,
  deleteUser,
};

