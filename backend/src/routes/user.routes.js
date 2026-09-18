const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authenticate);

// Self Profile routes (Admin & Employee)
router.get("/me", userController.getProfile);
router.put("/me", userController.updateProfile);
router.delete("/me", userController.deleteAccount);

// Admin-only User Management routes
router.get("/", authorize(ROLES.ADMIN), userController.listUsers);
router.post("/", authorize(ROLES.ADMIN), userController.createUser);
router.delete("/:id", authorize(ROLES.ADMIN), userController.deleteUser);

module.exports = router;
