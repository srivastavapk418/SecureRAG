const userService = require("../services/user.service");
const asyncHandler = require("../utils/asyncHandler");
const config = require("../config");

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.json({ user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body, req.user);
  res.json({ user });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteAccount(req.user.id);
  res.clearCookie(config.authCookieName, {
    ...config.cookieOptions,
    maxAge: undefined,
  });
  res.json(result);
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await userService.listAllUsers();
  res.json({ users });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUserByAdmin(req.body);
  res.status(201).json({ user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUserByAdmin(req.params.id, req.user.id);
  res.json(result);
});

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  listUsers,
  createUser,
  deleteUser,
};
