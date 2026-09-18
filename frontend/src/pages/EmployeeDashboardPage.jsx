import { useEffect, useState } from "react";

import { askQuestion, getSessionMessages, listSessions } from "../api/chatApi";
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
      tagline="Grounded answers for employees"
      footer={<p>Answers include one focused source reference so you can verify the answer quickly.</p>}
    >
      <div className="sidebar-group">
        <button
          type="button"
          className="primary-button sidebar-primary-button"
          onClick={startNewChat}
          disabled={isSubmitting}
        >
          Start new chat
        </button>
      </div>

      <div className="sidebar-group">
        <p className="sidebar-label">Recent chats</p>
        <div className="sidebar-stack">
          {sessions.length ? (
            sessions.map((session) => (
              <button
                key={session._id}
                type="button"
                className={`sidebar-card ${
                  currentSession?._id === session._id ? "active" : ""
                }`}
                onClick={() => handleSelectSession(session)}
              >
                <strong>{session.title}</strong>
                <span>Updated {new Date(session.lastActivityAt).toLocaleString()}</span>
              </button>
            ))
          ) : (
            <div className="sidebar-card muted">
              No chats yet. Start a conversation and your latest one will appear here.
            </div>
          )}
        </div>
      </div>

      {overview?.suggestions?.length ? (
        <div className="sidebar-group">
          <p className="sidebar-label">Try asking</p>
          <div className="sidebar-stack">
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
    return <div className="screen-center">Loading employee workspace...</div>;
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
          New chat
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
          label="Your chat sessions"
          value={overview?.stats?.sessionCount || 0}
          helper="Saved and sorted by latest activity"
        />
        <StatCard
          label="Questions asked"
          value={overview?.stats?.questionCount || 0}
          helper="Usage across your personal workspace"
        />
      </section>

      <section className="chat-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Chat</p>
            <h2>{currentSession?.title || "New conversation"}</h2>
          </div>
        </div>
        <ChatMessageList messages={messages} />
        <ChatComposer onSubmit={handleAsk} isSubmitting={isSubmitting} />
      </section>
    </AppShell>
  );
}

export default EmployeeDashboardPage;
