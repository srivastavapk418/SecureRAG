const express = require("express");

const documentController = require("../controllers/document.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authenticate);
router.get("/:documentId/download", documentController.downloadDocument);
router.get("/:documentId/view", documentController.viewDocument);
router.get("/", authorize(ROLES.ADMIN), documentController.listDocuments);
router.post(
  "/:documentId/reindex",
  authorize(ROLES.ADMIN),
  documentController.reindexDocument
);
router.delete(
  "/:documentId",
  authorize(ROLES.ADMIN),
  documentController.deleteDocument
);
router.post(
  "/",
  authorize(ROLES.ADMIN),
  upload.single("document"),
  documentController.uploadDocument
);

module.exports = router;
