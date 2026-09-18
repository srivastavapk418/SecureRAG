const path = require("path");

const asyncHandler = require("../utils/asyncHandler");
const documentService = require("../services/document.service");
const { validateDocumentMetadata } = require("../validators/document.validator");

const uploadDocument = asyncHandler(async (req, res) => {
  const metadata = validateDocumentMetadata(req.body);

  const document = await documentService.uploadDocument({
    file: req.file,
    title: metadata.title,
    description: metadata.description,
    uploadedBy: req.user.id,
    accessLevel: metadata.accessLevel,
    allowedDepartments: metadata.allowedDepartments,
  });

  res.status(201).json({
    document,
  });
});

const listDocuments = asyncHandler(async (_req, res) => {
  const documents = await documentService.listDocuments();

  res.json({
    documents,
  });
});

const downloadDocument = asyncHandler(async (req, res) => {
  const document = await documentService.verifyDocumentDownload(req.params.documentId, req.user);

  res.download(path.resolve(document.storagePath), document.originalName);
});

const viewDocument = asyncHandler(async (req, res) => {
  const document = await documentService.verifyDocumentDownload(req.params.documentId, req.user);
  const resolvedPath = path.resolve(document.storagePath);

  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(document.originalName)}"`
  );

  if (document.mimeType) {
    res.type(document.mimeType);
  }

  res.sendFile(resolvedPath);
});

const reindexDocument = asyncHandler(async (req, res) => {
  const document = await documentService.reindexDocument(req.params.documentId);

  res.json({
    document,
  });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const result = await documentService.deleteDocument(req.params.documentId);

  res.json(result);
});

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
  viewDocument,
  reindexDocument,
  deleteDocument,
};
