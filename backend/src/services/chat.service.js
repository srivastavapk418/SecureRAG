const ROLES = require("../constants/roles");
const ApiError = require("../utils/ApiError");
const config = require("../config");
const aiService = require("./ai.service");
const documentService = require("./document.service");
const chatRepository = require("../repositories/chat.repository");

function buildSessionTitle(question) {
  return question.length > 60 ? `${question.slice(0, 57)}...` : question;
}

async function resolveSession({ sessionId, userId, role, question }) {
  if (!sessionId) {
    return chatRepository.createSession({
      user: userId,
      title: buildSessionTitle(question),
    });
  }

  const session = await chatRepository.findSessionById(sessionId);

  if (!session) {
    throw new ApiError(404, "Chat session not found");
  }

  if (role !== ROLES.ADMIN && session.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You do not have access to this chat session");
  }

  return session;
}

function mapCitations(citations = []) {
  return citations.map((citation) => {
    const pageAnchor = citation.page_number ? `#page=${citation.page_number}` : "";

    return {
      documentId: citation.document_id,
      documentTitle: citation.document_title,
      sourceName: citation.source_name,
      locator: citation.locator || "",
      snippet: citation.snippet || "",
      chunkIndex: citation.chunk_index || 0,
      score: citation.score || 0,
      pageNumber: citation.page_number || null,
      referenceUrl: `${config.appUrl}/api/v1/documents/${citation.document_id}/view${pageAnchor}`,
    };
  });
}

async function askQuestion({ user, sessionId, question }) {
  const session = await resolveSession({
    sessionId,
    userId: user.id,
    role: user.role,
    question,
  });

  await chatRepository.createMessage({
    session: session.id,
    user: user.id,
    role: "user",
    content: question,
  });

  const accessibleDocuments = await documentService.getAccessibleDocuments(user);
  const allowedDocumentIds =
    user.role === ROLES.ADMIN
      ? null
      : accessibleDocuments.map((doc) => doc.id || doc._id.toString());

  const accessibleCatalog = (accessibleDocuments || [])
    .filter((doc) => doc.ingestStatus === "indexed")
    .map((doc) => ({
      id: (doc.id || doc._id).toString(),
      title: doc.title,
      originalName: doc.originalName,
      accessLevel: doc.accessLevel || "public",
    }));

  // Extract keywords from user question with domain term weighting
  const standardStopWords = new Set([
    "what", "when", "where", "which", "with", "from", "that", "this", "have", "does",
    "about", "some", "the", "and", "for", "our", "are", "can", "you", "tell", "how",
    "who", "why", "was", "were", "will", "would", "should", "could", "all", "any",
  ]);

  const domainStopWords = new Set([
    "company", "policy", "policies", "rule", "rules", "guideline", "guidelines",
    "document", "documents", "procedure", "procedures", "system", "systems", "general",
  ]);

  const allWords = (question.toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter(
    (w) => !standardStopWords.has(w)
  );
  const primaryKeywords = allWords.filter((w) => !domainStopWords.has(w));
  const secondaryKeywords = allWords.filter((w) => domainStopWords.has(w));

  const candidateChunks = [];
  for (const doc of accessibleDocuments || []) {
    if (doc.ingestStatus === "indexed" && Array.isArray(doc.chunks) && doc.chunks.length > 0) {
      for (const chunk of doc.chunks) {
        const textLower = (chunk.text || "").toLowerCase();
        const sectionLower = (chunk.section || "").toLowerCase();
        let matchScore = 0;

        for (const kw of primaryKeywords) {
          const count = textLower.split(kw).length - 1;
          matchScore += count * 15;
          if (sectionLower.includes(kw)) matchScore += 20;
        }

        for (const kw of secondaryKeywords) {
          if (textLower.includes(kw)) matchScore += 1;
        }

        if (matchScore > 0 || (primaryKeywords.length === 0 && doc.chunks.length <= 2)) {
          candidateChunks.push({
            document_id: (doc.id || doc._id).toString(),
            document_title: doc.title,
            source_name: doc.originalName || doc.title,
            section: chunk.section || "",
            locator: chunk.locator || chunk.section || "",
            page_number: chunk.pageNumber || null,
            text: chunk.text,
            snippet: chunk.snippet || chunk.text.slice(0, 240),
            chunk_index: chunk.chunkIndex,
            matchScore,
          });
        }
      }
    }
  }

  candidateChunks.sort((a, b) => b.matchScore - a.matchScore);
  const selectedContextChunks = candidateChunks.slice(0, 8).map(({ matchScore, ...rest }) => rest);

  let aiResponse;
  try {
    aiResponse = await aiService.queryAssistant({
      question,
      session_id: session.id,
      user_id: user.id,
      top_k: 5,
      allowed_document_ids: allowedDocumentIds,
      accessible_documents: accessibleCatalog,
      context_chunks: selectedContextChunks,
    });
  } catch (error) {
    console.error("aiService.queryAssistant failed:", error?.message || error);
    const catalogCount = accessibleCatalog.length;
    const docNames = accessibleCatalog.map((d) => `• ${d.title}`).join("\n");
    aiResponse = {
      answer:
        `**Enterprise Notice: The AI service is currently warming up or unavailable.**\n\n` +
        `You have access to ${catalogCount} indexed knowledge document(s):\n${docNames || "• None"}\n\n` +
        `Please allow 20–30 seconds for the backend instance to spin up, then submit your query again.`,
      citations: [],
    };
  }

  const citations = mapCitations(aiResponse.citations);

  const assistantMessage = await chatRepository.createMessage({
    session: session.id,
    user: user.id,
    role: "assistant",
    content: aiResponse.answer,
    citations,
  });

  const updatedSession = await chatRepository.touchSession(session.id, {
    title: buildSessionTitle(question),
  });

  return {
    session: updatedSession,
    message: assistantMessage,
    citations,
  };
}

async function listSessions(user) {
  return chatRepository.listSessionsForUser(user.id);
}

async function listSessionMessages({ sessionId, user }) {
  const session = await chatRepository.findSessionById(sessionId);

  if (!session) {
    throw new ApiError(404, "Chat session not found");
  }

  if (user.role !== ROLES.ADMIN && session.user.toString() !== user.id.toString()) {
    throw new ApiError(403, "You do not have access to this chat session");
  }

  const messages = await chatRepository.listMessagesBySession(sessionId);

  return {
    session,
    messages,
  };
}

async function deleteSession({ sessionId, user }) {
  const session = await chatRepository.findSessionById(sessionId);

  if (!session) {
    throw new ApiError(404, "Chat session not found");
  }

  if (user.role !== ROLES.ADMIN && session.user.toString() !== user.id.toString()) {
    throw new ApiError(403, "You do not have permission to delete this chat session");
  }

  await chatRepository.deleteMessagesBySession(sessionId);
  await chatRepository.deleteSessionById(sessionId);

  return {
    success: true,
    message: "Chat session deleted successfully",
    sessionId,
  };
}

module.exports = {
  askQuestion,
  listSessions,
  listSessionMessages,
  deleteSession,
};
