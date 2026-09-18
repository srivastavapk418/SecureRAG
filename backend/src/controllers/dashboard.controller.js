const asyncHandler = require("../utils/asyncHandler");
const dashboardService = require("../services/dashboard.service");

const getAdminOverview = asyncHandler(async (_req, res) => {
  const overview = await dashboardService.getAdminOverview();

  res.json(overview);
});

const getEmployeeOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getEmployeeOverview(req.user.id);

  res.json(overview);
});

module.exports = {
  getAdminOverview,
  getEmployeeOverview,
};

