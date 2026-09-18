const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");

function createSession(payload) {
  return ChatSession.create(payload);
}

function findSessionById(sessionId) {
  return ChatSession.findById(sessionId);
}

function listSessionsForUser(userId) {
  return ChatSession.find({ user: userId }).sort({ lastActivityAt: -1, updatedAt: -1 });
}

function touchSession(sessionId, payload = {}) {
  return ChatSession.findByIdAndUpdate(
    sessionId,
    { ...payload, lastActivityAt: new Date() },
    { new: true }
  );
}

function countSessions() {
  return ChatSession.countDocuments();
}

function countSessionsForUser(userId) {
  return ChatSession.countDocuments({ user: userId });
}

function createMessage(payload) {
  return ChatMessage.create(payload);
}

function listMessagesBySession(sessionId) {
  return ChatMessage.find({ session: sessionId }).sort({ createdAt: 1 });
}

function countMessagesByUser(userId, role = null) {
  const filter = { user: userId };

  if (role) {
    filter.role = role;
  }

  return ChatMessage.countDocuments(filter);
}

function countTotalQueries() {
  return ChatMessage.countDocuments({ role: "user" });
}

function findRecentQuestions(limit = 8) {
  return ChatMessage.find({ role: "user" })
    .populate("user", "name email role department")
    .populate("session", "title")
    .sort({ createdAt: -1 })
    .limit(limit);
}

async function getTopCitedDocuments(limit = 5) {
  return ChatMessage.aggregate([
    { $match: { role: "assistant", "citations.0": { $exists: true } } },
    { $unwind: "$citations" },
    {
      $group: {
        _id: "$citations.documentId",
        documentTitle: { $first: "$citations.documentTitle" },
        sourceName: { $first: "$citations.sourceName" },
        citationCount: { $sum: 1 },
        avgScore: { $avg: "$citations.score" },
      },
    },
    { $sort: { citationCount: -1 } },
    { $limit: limit },
  ]);
}

async function getDepartmentQueryVolume() {
  return ChatMessage.aggregate([
    { $match: { role: "user" } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: "$userDetails" },
    {
      $group: {
        _id: { $ifNull: ["$userDetails.department", "General"] },
        queryCount: { $sum: 1 },
      },
    },
    { $sort: { queryCount: -1 } },
  ]);
}

module.exports = {
  createSession,
  findSessionById,
  listSessionsForUser,
  touchSession,
  countSessions,
  countSessionsForUser,
  createMessage,
  listMessagesBySession,
  countMessagesByUser,
  countTotalQueries,
  findRecentQuestions,
  getTopCitedDocuments,
  getDepartmentQueryVolume,
};
