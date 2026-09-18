const express = require("express");

const chatController = require("../controllers/chat.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);
router.get("/sessions", chatController.listSessions);
router.get("/sessions/:sessionId/messages", chatController.getSessionMessages);
router.post("/query", chatController.askQuestion);

module.exports = router;

