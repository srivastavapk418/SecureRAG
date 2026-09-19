import { useEffect, useRef, useState } from "react";

function ChatComposer({ onSubmit, isSubmitting }) {
  const [question, setQuestion] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [question]);

  async function handleSubmit(event) {
    if (event) event.preventDefault();

    const nextQuestion = question.trim();
    if (!nextQuestion || isSubmitting) {
      return;
    }

    setQuestion("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onSubmit(nextQuestion);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="chat-composer-wrapper">
      <form className="chat-composer-pill" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask a question or type to start a new conversation..."
          autoFocus
          disabled={isSubmitting}
        />

        <button
          className="chat-send-btn"
          type="submit"
          disabled={!question.trim() || isSubmitting}
          title={isSubmitting ? "Generating answer..." : "Send question (Enter)"}
        >
          {isSubmitting ? (
            <span className="spinner-icon" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
      <div className="composer-hints">
        <span>Grounded in enterprise vectors with Zero Data Retention</span>
        <span className="key-hint">Enter ↵ to send • Shift + Enter for new line</span>
      </div>
    </div>
  );
}

export default ChatComposer;
