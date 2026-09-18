import CitationCard from "./CitationCard";

function formatTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function ChatMessageList({ messages = [] }) {
  if (!messages.length) {
    return (
      <div className="empty-state large">
        Start a conversation to retrieve answers grounded in your internal documents.
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <article
          key={message._id}
          className={`message-card ${message.role === "assistant" ? "assistant" : "user"}`}
        >
          <div className="message-meta">
            <strong>{message.role === "assistant" ? "AI Assistant" : "You"}</strong>
            <span>{formatTime(message.createdAt || Date.now())}</span>
          </div>
          <p className="message-content">{message.content}</p>
          {message.role === "assistant" && message.citations?.length ? (
            <div className="citation-grid">
              {message.citations.slice(0, 1).map((citation) => (
                <CitationCard
                  key={`${message._id}-${citation.documentId}-${citation.chunkIndex || "source"}`}
                  citation={citation}
                />
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default ChatMessageList;
