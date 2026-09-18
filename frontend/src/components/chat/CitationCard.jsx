function CitationCard({ citation }) {
  const locator =
    citation.locator ||
    (citation.pageNumber ? `Page ${citation.pageNumber}` : "") ||
    (citation.chunkIndex ? `Chunk ${citation.chunkIndex}` : "Grounded Source");

  const scorePercent = citation.score ? Math.round(citation.score * 100) : null;

  return (
    <a
      className="citation-card"
      href={citation.referenceUrl}
      target="_blank"
      rel="noreferrer"
      title={`Open source: ${citation.documentTitle}`}
    >
      <div className="citation-header">
        <div className="citation-icon-title">
          <span className="citation-doc-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </span>
          <div className="citation-titles">
            <strong className="citation-title">{citation.documentTitle || "Internal Document"}</strong>
            <span className="citation-source-sub">{citation.sourceName}</span>
          </div>
        </div>

        <div className="citation-badges">
          {scorePercent ? (
            <span className="citation-score-badge" title="Relevance match">
              {scorePercent}% match
            </span>
          ) : null}
          <span className="citation-locator-badge">{locator}</span>
        </div>
      </div>

      {citation.snippet ? (
        <p className="citation-snippet">&ldquo;{citation.snippet}&rdquo;</p>
      ) : null}
    </a>
  );
}

export default CitationCard;
