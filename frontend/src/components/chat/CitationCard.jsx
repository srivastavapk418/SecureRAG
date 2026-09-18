function CitationCard({ citation }) {
  const locator =
    citation.locator ||
    (citation.pageNumber ? `Page ${citation.pageNumber}` : "") ||
    (citation.chunkIndex ? `Chunk ${citation.chunkIndex}` : "Source reference");

  return (
    <a
      className="citation-card"
      href={citation.referenceUrl}
      target="_blank"
      rel="noreferrer"
    >
      <div className="citation-card-main">
        <div>
          <p className="citation-title">{citation.documentTitle}</p>
          <span>{citation.sourceName}</span>
        </div>
        <strong className="citation-locator">{locator}</strong>
      </div>
      {citation.snippet ? <p className="citation-snippet">{citation.snippet}</p> : null}
    </a>
  );
}

export default CitationCard;
