const Document = require("../models/Document");

function createDocument(payload) {
  return Document.create(payload);
}

function updateDocumentById(documentId, payload) {
  return Document.findByIdAndUpdate(documentId, payload, {
    new: true,
    runValidators: true,
  }).populate("uploadedBy", "name email role");
}

function findDocumentById(documentId) {
  return Document.findById(documentId).populate("uploadedBy", "name email role");
}

function listDocuments() {
  return Document.find().populate("uploadedBy", "name email role").sort({ createdAt: -1 });
}

function listRecentDocuments(limit = 5) {
  return Document.find().populate("uploadedBy", "name email role").sort({ createdAt: -1 }).limit(limit);
}

function countDocuments() {
  return Document.countDocuments();
}

function countIndexedDocuments() {
  return Document.countDocuments({ ingestStatus: "indexed" });
}

function deleteDocumentById(documentId) {
  return Document.findByIdAndDelete(documentId);
}

function getDepartmentRegexList(department) {
  const raw = (department || "General").trim();
  const parts = raw
    .split(/[&,/]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const allDepts = Array.from(new Set([raw, ...parts]));
  return allDepts.map(
    (d) => new RegExp(`^${d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
  );
}

async function findAccessibleDocumentIds(department) {
  const deptRegexes = getDepartmentRegexList(department);
  const filter = {
    $or: [
      { accessLevel: "public" },
      { accessLevel: { $exists: false } },
      { accessLevel: "department", allowedDepartments: { $in: deptRegexes } },
    ],
  };
  const docs = await Document.find(filter).select("_id");
  return docs.map((doc) => doc._id.toString());
}

async function findAccessibleDocuments(department) {
  const deptRegexes = getDepartmentRegexList(department);
  const filter = {
    $or: [
      { accessLevel: "public" },
      { accessLevel: { $exists: false } },
      { accessLevel: "department", allowedDepartments: { $in: deptRegexes } },
    ],
  };
  return Document.find(filter)
    .select("_id title originalName accessLevel allowedDepartments ingestStatus chunkCount chunks")
    .sort({ createdAt: -1 });
}

async function getAccessPolicyDistribution() {
  return Document.aggregate([
    {
      $group: {
        _id: { $ifNull: ["$accessLevel", "public"] },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
}

async function getKnowledgeBaseStats() {
  const result = await Document.aggregate([
    {
      $group: {
        _id: null,
        totalBytes: { $sum: "$size" },
        totalChunks: { $sum: "$chunkCount" },
      },
    },
  ]);
  return result[0] || { totalBytes: 0, totalChunks: 0 };
}

module.exports = {
  createDocument,
  updateDocumentById,
  findDocumentById,
  listDocuments,
  listRecentDocuments,
  countDocuments,
  countIndexedDocuments,
  deleteDocumentById,
  findAccessibleDocumentIds,
  findAccessibleDocuments,
  getAccessPolicyDistribution,
  getKnowledgeBaseStats,
};
