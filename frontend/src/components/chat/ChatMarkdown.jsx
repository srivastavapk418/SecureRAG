import { useState } from "react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      className="code-copy-btn"
      onClick={handleCopy}
      title="Copy code to clipboard"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

// Simple inline markdown formatting (bold, italic, inline code)
function renderInlineText(text) {
  if (!text) return "";

  // Split by inline code `...`
  const codeParts = text.split(/(`[^`]+`)/g);
  return codeParts.map((codeChunk, cIdx) => {
    if (codeChunk.startsWith("`") && codeChunk.endsWith("`")) {
      return (
        <code key={cIdx} className="inline-code">
          {codeChunk.slice(1, -1)}
        </code>
      );
    }

    // Handle **bold** inside text
    const boldParts = codeChunk.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((boldChunk, bIdx) => {
      if (boldChunk.startsWith("**") && boldChunk.endsWith("**")) {
        return <strong key={`${cIdx}-${bIdx}`}>{boldChunk.slice(2, -2)}</strong>;
      }

      // Handle *italic* inside text
      const italicParts = boldChunk.split(/(\*[^*]+\*)/g);
      return italicParts.map((itChunk, iIdx) => {
        if (itChunk.startsWith("*") && itChunk.endsWith("*")) {
          return <em key={`${cIdx}-${bIdx}-${iIdx}`}>{itChunk.slice(1, -1)}</em>;
        }
        return itChunk;
      });
    });
  });
}

export default function ChatMarkdown({ content }) {
  if (!content) return null;

  // Split into code blocks and normal text blocks
  // Regex matches ```[language]?\n[\s\S]*?```
  const blocks = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }
    blocks.push({
      type: "code",
      language: match[1] || "text",
      code: match[2].trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return (
    <div className="chat-markdown">
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return (
            <div key={idx} className="code-block-container">
              <div className="code-block-header">
                <span className="code-block-lang">{block.language || "code"}</span>
                <CopyButton text={block.code} />
              </div>
              <pre className="code-block-pre">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        // Render text block: split into paragraphs and lines
        const lines = block.content.split("\n");
        const renderedElements = [];
        let listBuffer = [];
        let listType = null; // 'ul' or 'ol'

        const flushList = () => {
          if (listBuffer.length > 0) {
            const items = listBuffer.map((item, lIdx) => (
              <li key={lIdx}>{renderInlineText(item)}</li>
            ));
            if (listType === "ol") {
              renderedElements.push(<ol key={`ol-${renderedElements.length}`}>{items}</ol>);
            } else {
              renderedElements.push(<ul key={`ul-${renderedElements.length}`}>{items}</ul>);
            }
            listBuffer = [];
            listType = null;
          }
        };

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();

          // Bullet list item
          const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
          if (bulletMatch) {
            if (listType === "ol") flushList();
            listType = "ul";
            listBuffer.push(bulletMatch[1]);
            return;
          }

          // Numbered list item
          const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
          if (numMatch) {
            if (listType === "ul") flushList();
            listType = "ol";
            listBuffer.push(numMatch[1]);
            return;
          }

          // If line is not a list item, flush any existing list
          flushList();

          if (!trimmed) {
            renderedElements.push(<div key={`space-${lIdx}`} className="paragraph-gap" />);
            return;
          }

          // Headings
          if (trimmed.startsWith("### ")) {
            renderedElements.push(<h4 key={`h4-${lIdx}`}>{renderInlineText(trimmed.slice(4))}</h4>);
            return;
          }
          if (trimmed.startsWith("## ")) {
            renderedElements.push(<h3 key={`h3-${lIdx}`}>{renderInlineText(trimmed.slice(3))}</h3>);
            return;
          }
          if (trimmed.startsWith("# ")) {
            renderedElements.push(<h2 key={`h2-${lIdx}`}>{renderInlineText(trimmed.slice(2))}</h2>);
            return;
          }

          // Normal paragraph line
          renderedElements.push(
            <p key={`p-${lIdx}`} className="chat-paragraph">
              {renderInlineText(trimmed)}
            </p>
          );
        });

        flushList();

        return <div key={idx}>{renderedElements}</div>;
      })}
    </div>
  );
}
