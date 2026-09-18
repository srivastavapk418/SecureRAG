import { useState } from "react";

function ChatComposer({ onSubmit, isSubmitting }) {
  const [question, setQuestion] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const nextQuestion = question.trim();

    if (!nextQuestion || isSubmitting) {
      return;
    }

    setQuestion("");
    await onSubmit(nextQuestion);
  }

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={3}
        placeholder="Ask a question about leave policy, onboarding, benefits, compliance, or any indexed internal document..."
      />
      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Thinking..." : "Ask Assistant"}
      </button>
    </form>
  );
}

export default ChatComposer;

