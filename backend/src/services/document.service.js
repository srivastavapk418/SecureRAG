const path = require("path");
const fs = require("fs");

const ApiError = require("../utils/ApiError");
const ROLES = require("../constants/roles");
const documentRepository = require("../repositories/document.repository");
const aiService = require("./ai.service");

function deriveTitle(fileName) {
  return path.basename(fileName, path.extname(fileName));
}

function checkDocumentAccess(document, user) {
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }

  // Admins have universal document clearance
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  // Admin-only documents are strictly barred from employee access
  if (document.accessLevel === "admin_only") {
    throw new ApiError(403, "This document is restricted to administrators only");
  }

  // Department-restricted documents require matching department
  if (document.accessLevel === "department") {
    const userDept = (user.department || "General").trim().toLowerCase();
    const allowed = (document.allowedDepartments || []).map((d) => d.trim().toLowerCase());
    if (!allowed.includes(userDept)) {
      throw new ApiError(
        403,
        `Access restricted: your department (${user.department || "General"}) does not have clearance for this document.`
      );
    }
  }

  return true;
}

async function indexStoredDocument(document) {
  try {
    const ingestResult = await aiService.ingestDocument({
      document_id: document.id,
      title: document.title,
      source_name: document.originalName,
      file_path: document.storagePath,
      mime_type: document.mimeType,
    });

    return await documentRepository.updateDocumentById(document.id, {
      ingestStatus: "indexed",
      ingestError: "",
      chunkCount: ingestResult.chunk_count || 0,
      aiDocumentId: ingestResult.document_id || document.id,
      lastIndexedAt: new Date(),
    });
  } catch (error) {
    await documentRepository.updateDocumentById(document.id, {
      ingestStatus: "failed",
      ingestError: error.message,
    });

    throw error;
  }
}

async function uploadDocument({
  file,
  title,
  description,
  uploadedBy,
  accessLevel = "public",
  allowedDepartments = [],
}) {
  if (!file) {
    throw new ApiError(400, "A document file is required");
  }

  const document = await documentRepository.createDocument({
    title: title || deriveTitle(file.originalname),
    description: description || "",
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    storagePath: file.path,
    uploadedBy,
    accessLevel,
    allowedDepartments,
    ingestStatus: "processing",
  });

  return indexStoredDocument(document);
}

async function listDocuments() {
  return documentRepository.listDocuments();
}

async function getDocumentById(documentId) {
  const document = await documentRepository.findDocumentById(documentId);

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  return document;
}

async function verifyDocumentDownload(documentId, user = null) {
  const document = await getDocumentById(documentId);

  if (user) {
    checkDocumentAccess(document, user);
  }

  if (!fs.existsSync(document.storagePath)) {
    throw new ApiError(404, "Stored document file was not found");
  }

  return document;
}

async function getAccessibleDocumentIds(user) {
  if (!user || user.role === ROLES.ADMIN) {
    return null; // Admin has global access
  }

  return documentRepository.findAccessibleDocumentIds(user.department || "General");
}

async function reindexDocument(documentId) {
  const document = await verifyDocumentDownload(documentId);

  await documentRepository.updateDocumentById(document.id, {
    ingestStatus: "processing",
    ingestError: "",
  });

  return indexStoredDocument(document);
}

async function deleteDocument(documentId) {
  const document = await getDocumentById(documentId);

  if ((document.ingestStatus === "indexed" || document.aiDocumentId) && document.id) {
    await aiService.deleteDocument(document.aiDocumentId || document.id);
  }

  if (document.storagePath && fs.existsSync(document.storagePath)) {
    await fs.promises.unlink(document.storagePath);
  }

  await documentRepository.deleteDocumentById(document.id);

  return {
    documentId: document.id,
    deleted: true,
  };
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentById,
  verifyDocumentDownload,
  checkDocumentAccess,
  getAccessibleDocumentIds,
  reindexDocument,
  deleteDocument,
};
