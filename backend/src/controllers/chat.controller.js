const asyncHandler = require("../utils/asyncHandler");
const chatService = require("../services/chat.service");
const { validateChatPayload } = require("../validators/chat.validator");

const askQuestion = asyncHandler(async (req, res) => {
  const payload = validateChatPayload(req.body);
  const response = await chatService.askQuestion({
    user: req.user,
    sessionId: payload.sessionId,
    question: payload.question,
  });

  res.status(201).json(response);
});

const listSessions = asyncHandler(async (req, res) => {
  const sessions = await chatService.listSessions(req.user);

  res.json({
    sessions,
  });
});

const getSessionMessages = asyncHandler(async (req, res) => {
  const response = await chatService.listSessionMessages({
    sessionId: req.params.sessionId,
    user: req.user,
  });

  res.json(response);
});

module.exports = {
  askQuestion,
  listSessions,
  getSessionMessages,
};

