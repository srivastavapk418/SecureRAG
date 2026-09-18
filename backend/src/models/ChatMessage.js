const mongoose = require("mongoose");

const citationSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
    },
    documentTitle: {
      type: String,
      required: true,
    },
    sourceName: {
      type: String,
      required: true,
    },
    locator: {
      type: String,
      default: "",
    },
    snippet: {
      type: String,
      default: "",
    },
    chunkIndex: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    referenceUrl: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    citations: {
      type: [citationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
