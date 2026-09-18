const ApiError = require("../utils/ApiError");

function validateChatPayload(body) {
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";

  if (!question) {
    throw new ApiError(400, "A question is required");
  }

  if (question.length > 4000) {
    throw new ApiError(400, "Question is too long");
  }

  return {
    question,
    sessionId,
  };
}

module.exports = {
  validateChatPayload,
};

