const userRepository = require("../repositories/user.repository");
const documentRepository = require("../repositories/document.repository");
const chatRepository = require("../repositories/chat.repository");

async function getAdminOverview() {
  const [
    totalUsers,
    totalDocuments,
    indexedDocuments,
    totalSessions,
    totalQueries,
    kbStats,
    policyDistribution,
    topCitedDocuments,
    departmentBreakdown,
    recentDocuments,
    recentUsers,
    recentQueries,
  ] = await Promise.all([
    userRepository.countUsers(),
    documentRepository.countDocuments(),
    documentRepository.countIndexedDocuments(),
    chatRepository.countSessions(),
    chatRepository.countTotalQueries(),
    documentRepository.getKnowledgeBaseStats(),
    documentRepository.getAccessPolicyDistribution(),
    chatRepository.getTopCitedDocuments(5),
    chatRepository.getDepartmentQueryVolume(),
    documentRepository.listRecentDocuments(6),
    userRepository.listRecentUsers(6),
    chatRepository.findRecentQuestions(10),
  ]);

  return {
    stats: {
      totalUsers,
      totalDocuments,
      indexedDocuments,
      pendingDocuments: totalDocuments - indexedDocuments,
      totalSessions,
      totalQueries,
      totalBytes: kbStats?.totalBytes || 0,
      totalChunks: kbStats?.totalChunks || 0,
    },
    policyDistribution,
    topCitedDocuments,
    departmentBreakdown,
    recentDocuments,
    recentUsers,
    recentQueries,
  };
}

async function getEmployeeOverview(userId) {
  const [sessionCount, questionCount, indexedDocuments] = await Promise.all([
    chatRepository.countSessionsForUser(userId),
    chatRepository.countMessagesByUser(userId, "user"),
    documentRepository.countIndexedDocuments(),
  ]);

  return {
    stats: {
      sessionCount,
      questionCount,
      indexedDocuments,
    },
    suggestions: [
      "What is our monthly leave policy?",
      "Summarize the onboarding checklist for new employees.",
      "Which policy explains reimbursement limits?",
      "What are the work-from-home eligibility rules?",
    ],
  };
}

module.exports = {
  getAdminOverview,
  getEmployeeOverview,
};

