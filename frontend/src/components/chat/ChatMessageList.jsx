import ChatMarkdown from "./ChatMarkdown";
import CitationCard from "./CitationCard";

function formatTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (_e) {
    return "";
  }
}

function UserAvatar() {
  return (
    <div className="chat-avatar user-avatar" title="You">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="chat-avatar assistant-avatar" title="SecureRAG AI">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
      </svg>
    </div>
  );
}

function ChatMessageList({ messages = [], isSubmitting = false, onSelectPrompt }) {
  if (!messages.length && !isSubmitting) {
    return (
      <div className="chat-empty-container">
        <div className="chat-empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h3>Secure Enterprise Knowledge Desk</h3>
        <p>Ask questions grounded directly in your company&apos;s indexed documents, with verified citations.</p>
        
        {onSelectPrompt && (
          <div className="chat-starter-prompts">
            <button
              type="button"
              className="starter-prompt-card"
              onClick={() => onSelectPrompt("What documents and policies are currently indexed in the system?")}
            >
              <span>📁</span>
              <strong>Indexed Documents</strong>
              <small>Explore indexed collections & access policies</small>
            </button>
            <button
              type="button"
              className="starter-prompt-card"
              onClick={() => onSelectPrompt("What are the departmental access rules for company documents?")}
            >
              <span>🔒</span>
              <strong>Security Policies</strong>
              <small>Review document-level access permissions</small>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="chat-thread">
      {messages.map((message) => {
        const isUser = message.role === "user";

        return (
          <div
            key={message._id}
            className={`chat-row ${isUser ? "chat-row-user" : "chat-row-assistant"}`}
          >
            <div className="chat-row-header">
              {isUser ? <UserAvatar /> : <AssistantAvatar />}
              <span className="chat-sender-name">
                {isUser ? "You" : "SecureRAG Assistant"}
              </span>
              <span className="chat-time-tag">
                {formatTime(message.createdAt || Date.now())}
              </span>
            </div>

            <div className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-assistant"}`}>
              {isUser ? (
                <p className="user-message-text">{message.content}</p>
              ) : (
                <>
                  <ChatMarkdown content={message.content} />
                  {message.citations?.length ? (
                    <div className="citations-container">
                      <div className="citations-header-label">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Verified Citations ({message.citations.length})</span>
                      </div>
                      <div className="citations-list">
                        {message.citations.map((citation, cIdx) => (
                          <CitationCard
                            key={`${message._id}-${citation.documentId || cIdx}-${citation.chunkIndex || cIdx}`}
                            citation={citation}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        );
      })}

      {isSubmitting && (
        <div className="chat-row chat-row-assistant">
          <div className="chat-row-header">
            <AssistantAvatar />
            <span className="chat-sender-name">SecureRAG Assistant</span>
            <span className="chat-status-pulse">Searching vectors & reasoning...</span>
          </div>
          <div className="chat-bubble chat-bubble-assistant typing-bubble">
            <div className="typing-dots">
              <span className="dot dot-1"></span>
              <span className="dot dot-2"></span>
              <span className="dot dot-3"></span>
            </div>
            <span className="typing-label">Analyzing grounded documents...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatMessageList;
