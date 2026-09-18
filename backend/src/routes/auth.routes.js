const express = require("express");

const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/register-admin", authController.registerAdmin);
router.post("/login", authController.login);
router.get("/setup-status", authController.getSetupStatus);
router.post("/bootstrap-admin", authController.bootstrapAdmin);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;
