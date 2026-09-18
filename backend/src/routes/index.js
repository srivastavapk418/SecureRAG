const express = require("express");

const authRoutes = require("./auth.routes");
const documentRoutes = require("./document.routes");
const dashboardRoutes = require("./dashboard.routes");
const chatRoutes = require("./chat.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/chat", chatRoutes);
router.use("/users", userRoutes);

module.exports = router;

