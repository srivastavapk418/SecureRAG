function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DocumentTable({
  documents = [],
  onReindex,
  onDeleteRequest,
  reindexingDocumentId = "",
  deletingDocumentId = "",
}) {
  if (!documents.length) {
    return <div className="empty-state">No documents have been uploaded yet.</div>;
  }

  return (
    <div className="table-wrap scrollable-table">
      <table className="data-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Access Policy</th>
            <th>Status</th>
            <th>Chunks</th>
            <th>Uploaded By</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document._id}>
              <td>
                <strong>{document.title}</strong>
                <p>{document.originalName}</p>
                {document.ingestStatus === "failed" && document.ingestError ? (
                  <p className="table-inline-error">{document.ingestError}</p>
                ) : null}
              </td>
              <td>
                {document.accessLevel === "admin_only" ? (
                  <span className="status-pill status-failed" title="Restricted to Admins">
                    🔒 Admin Only
                  </span>
                ) : document.accessLevel === "department" ? (
                  <span className="status-pill" title={document.allowedDepartments?.join(", ")}>
                    🏢 {document.allowedDepartments?.length ? document.allowedDepartments.join(", ") : "Department"}
                  </span>
                ) : (
                  <span className="status-pill status-indexed" title="Accessible to all employees">
                    🌐 Public (All)
                  </span>
                )}
              </td>
              <td>
                <span className={`status-pill status-${document.ingestStatus}`}>
                  {document.ingestStatus}
                </span>
              </td>
              <td>{document.chunkCount || 0}</td>
              <td>{document.uploadedBy?.name || "Unknown"}</td>
              <td>{formatDate(document.updatedAt)}</td>
              <td className="table-actions">
                <div className="table-action-row">
                  {document.ingestStatus === "failed" ? (
                    <button
                      type="button"
                      className="ghost-button table-action"
                      onClick={() => onReindex?.(document._id)}
                      disabled={reindexingDocumentId === document._id || deletingDocumentId === document._id}
                    >
                      {reindexingDocumentId === document._id ? "Retrying..." : "Retry"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="ghost-button table-action danger"
                    onClick={() => onDeleteRequest?.(document)}
                    disabled={deletingDocumentId === document._id || reindexingDocumentId === document._id}
                  >
                    {deletingDocumentId === document._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DocumentTable;
