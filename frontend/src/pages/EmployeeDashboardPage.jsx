import { useEffect, useState } from "react";

import { askQuestion, deleteSession, getSessionMessages, listSessions } from "../api/chatApi";
import { getEmployeeOverview } from "../api/dashboardApi";
import ChatComposer from "../components/chat/ChatComposer";
import ChatMessageList from "../components/chat/ChatMessageList";
import StatCard from "../components/dashboard/StatCard";
import AppShell from "../components/layout/AppShell";
import Sidebar from "../components/layout/Sidebar";

function EmployeeDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setIsLoading(true);
    setError("");

    try {
      const [overviewResponse, sessionsResponse] = await Promise.all([
        getEmployeeOverview(),
        listSessions(),
      ]);

      setOverview(overviewResponse);
      setSessions(sessionsResponse.sessions);

      if (sessionsResponse.sessions.length) {
        await handleSelectSession(sessionsResponse.sessions[0]);
      } else {
        startNewChat();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load your workspace.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectSession(session) {
    if (!session) return;
    setCurrentSession(session);

    try {
      const response = await getSessionMessages(session._id);
      setMessages(response.messages);
    } catch (_error) {
      setMessages([]);
    }
  }

  function startNewChat() {
    setCurrentSession(null);
    setMessages([]);
    setError("");
  }

  async function handleDeleteSession(sessionId, event) {
    if (event) {
      event.stopPropagation();
    }

    if (!sessionId || deletingSessionId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this chat session? All messages and citations in it will be permanently removed."
    );
    if (!confirmed) return;

    setDeletingSessionId(sessionId);
    setError("");

    try {
      await deleteSession(sessionId);

      const nextSessions = sessions.filter((s) => s._id !== sessionId);
      setSessions(nextSessions);

      setOverview((current) => {
        if (!current?.stats) return current;
        return {
          ...current,
          stats: {
            ...current.stats,
            sessionCount: Math.max(0, (current.stats.sessionCount || 1) - 1),
          },
        };
      });

      // If the currently active session was deleted, switch to the first remaining or a fresh new chat
      if (currentSession?._id === sessionId) {
        if (nextSessions.length > 0) {
          await handleSelectSession(nextSessions[0]);
        } else {
          startNewChat();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete chat session.");
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function handleAsk(question) {
    const nextQuestion = typeof question === "string" ? question.trim() : "";

    if (!nextQuestion || isSubmitting) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const pendingMessage = {
      _id: tempId,
      role: "user",
      content: nextQuestion,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, pendingMessage]);
    setIsSubmitting(true);
    setError("");

    try {
      const response = await askQuestion({
        question: nextQuestion,
        sessionId: currentSession?._id,
      });

      setSessions((current) => {
        const next = current.filter((session) => session._id !== response.session._id);
        return [response.session, ...next];
      });
      setCurrentSession(response.session);
      setOverview((current) => {
        if (!current?.stats) {
          return current;
        }

        return {
          ...current,
          stats: {
            ...current.stats,
            questionCount: (current.stats.questionCount || 0) + 1,
            sessionCount: currentSession?._id
              ? current.stats.sessionCount || 0
              : (current.stats.sessionCount || 0) + 1,
          },
        };
      });
      setMessages((current) => {
        const withoutPending = current.filter((message) => message._id !== tempId);
        return [...withoutPending, pendingMessage, response.message];
      });
    } catch (requestError) {
      setMessages((current) => current.filter((message) => message._id !== tempId));
      setError(requestError.response?.data?.message || "Unable to fetch an answer right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const sidebar = (
    <Sidebar
      brand="Knowledge Desk"
      tagline="Grounded answers for enterprise"
      footer={<p>Enterprise Zero-Data-Retention inference with cryptographically verified sources.</p>}
    >
      <div className="sidebar-group">
        <button
          type="button"
          className="primary-button sidebar-primary-button"
          onClick={startNewChat}
          disabled={isSubmitting}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New conversation
        </button>
      </div>

      <div className="sidebar-group">
        <div className="sidebar-header-row">
          <p className="sidebar-label">Recent conversations</p>
          <span className="sidebar-count-badge">{sessions.length}</span>
        </div>
        <div className="sidebar-stack scrollable-stack">
          {sessions.length ? (
            sessions.map((session) => {
              const isActive = currentSession?._id === session._id;
              const isDeleting = deletingSessionId === session._id;

              return (
                <div
                  key={session._id}
                  className={`sidebar-session-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectSession(session)}
                >
                  <div className="sidebar-session-info">
                    <strong>{session.title}</strong>
                    <span>{new Date(session.lastActivityAt || session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>

                  <button
                    type="button"
                    className="sidebar-trash-btn"
                    onClick={(e) => handleDeleteSession(session._id, e)}
                    disabled={isDeleting}
                    title="Delete chat session"
                    aria-label={`Delete ${session.title}`}
                  >
                    {isDeleting ? (
                      <span className="spinner-icon-sm" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="sidebar-card muted">
              No conversations yet. Start a new chat to ground answers in company documents.
            </div>
          )}
        </div>
      </div>

      {overview?.suggestions?.length ? (
        <div className="sidebar-group">
          <p className="sidebar-label">Quick prompts</p>
          <div className="sidebar-stack suggestions-stack scrollable-stack">
            {overview.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="sidebar-card suggestion"
                disabled={isSubmitting}
                onClick={() => handleAsk(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </Sidebar>
  );

  if (isLoading) {
    return <div className="screen-center">Loading enterprise workspace...</div>;
  }

  return (
    <AppShell
      sidebar={sidebar}
      title="Employee Assistant"
      subtitle="Ask policy and process questions across your indexed enterprise documents."
      actions={
        <button
          type="button"
          className="ghost-button"
          onClick={startNewChat}
          disabled={isSubmitting}
        >
          + New chat
        </button>
      }
    >
      {error ? <div className="inline-error">{error}</div> : null}

      <section className="stats-grid">
        <StatCard
          label="Indexed documents"
          value={overview?.stats?.indexedDocuments || 0}
          helper="Available for grounded answers"
        />
        <StatCard
          label="Saved chat sessions"
          value={overview?.stats?.sessionCount || 0}
          helper="Active sessions in your workspace"
        />
        <StatCard
          label="Questions asked"
          value={overview?.stats?.questionCount || 0}
          helper="Total queries executed"
        />
      </section>

      <section className="chat-panel modern-chat-panel">
        <div className="panel-header chat-panel-header">
          <div>
            <p className="eyebrow">Active Workspace Thread</p>
            <h2>{currentSession?.title || "New conversation"}</h2>
          </div>
          {currentSession?._id && (
            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-delete-btn"
                onClick={(e) => handleDeleteSession(currentSession._id, e)}
                disabled={deletingSessionId === currentSession._id}
                title="Delete this conversation"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Delete chat</span>
              </button>
            </div>
          )}
        </div>

        <ChatMessageList
          messages={messages}
          isSubmitting={isSubmitting}
          onSelectPrompt={handleAsk}
        />

        <ChatComposer onSubmit={handleAsk} isSubmitting={isSubmitting} />
      </section>
    </AppShell>
  );
}

export default EmployeeDashboardPage;
