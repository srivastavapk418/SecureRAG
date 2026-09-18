const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    originalName: {
      type: String,
      required: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accessLevel: {
      type: String,
      enum: ["public", "department", "admin_only"],
      default: "public",
    },
    allowedDepartments: {
      type: [String],
      default: [],
    },
    allowedRoles: {
      type: [String],
      default: ["admin", "employee"],
    },
    ingestStatus: {
      type: String,
      enum: ["processing", "indexed", "failed"],
      default: "processing",
    },
    ingestError: {
      type: String,
      default: "",
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    aiDocumentId: {
      type: String,
      default: "",
    },
    lastIndexedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);

