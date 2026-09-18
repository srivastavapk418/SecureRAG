const express = require("express");

const dashboardController = require("../controllers/dashboard.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authenticate);
router.get("/employee/overview", dashboardController.getEmployeeOverview);
router.get(
  "/admin/overview",
  authorize(ROLES.ADMIN),
  dashboardController.getAdminOverview
);

module.exports = router;

