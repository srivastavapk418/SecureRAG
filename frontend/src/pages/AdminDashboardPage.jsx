import { useEffect, useState } from "react";

import { getAdminOverview } from "../api/dashboardApi";
import { deleteDocument, listDocuments, reindexDocument, uploadDocument } from "../api/documentApi";
import DocumentTable from "../components/dashboard/DocumentTable";
import StatCard from "../components/dashboard/StatCard";
import AppShell from "../components/layout/AppShell";
import Sidebar from "../components/layout/Sidebar";

function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    accessLevel: "public",
    allowedDepartments: [],
    document: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [reindexingDocumentId, setReindexingDocumentId] = useState("");
  const [deletingDocumentId, setDeletingDocumentId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAdminWorkspace();
  }, []);

  async function loadAdminWorkspace(options = {}) {
    const { background = false, preserveError = false } = options;

    if (!background) {
      setIsLoading(true);
    }

    if (!preserveError) {
      setError("");
    }

    try {
      const [overviewResponse, documentResponse] = await Promise.all([
        getAdminOverview(),
        listDocuments(),
      ]);

      setOverview(overviewResponse);
      setDocuments(documentResponse.documents);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load admin dashboard.");
    } finally {
      if (!background) {
        setIsLoading(false);
      }
    }
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!form.document) {
      setError("Please choose a PDF, DOCX, or TXT file to upload.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("description", form.description);
      payload.append("accessLevel", form.accessLevel);
      payload.append("allowedDepartments", form.allowedDepartments.join(","));
      payload.append("document", form.document);

      await uploadDocument(payload);
      setForm({ title: "", description: "", accessLevel: "public", allowedDepartments: [], document: null });
      await loadAdminWorkspace({ background: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Document upload failed.");
      await loadAdminWorkspace({ background: true, preserveError: true });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleReindex(documentId) {
    setReindexingDocumentId(documentId);
    setError("");

    try {
      await reindexDocument(documentId);
      await loadAdminWorkspace({ background: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to reindex this document.");
      await loadAdminWorkspace({ background: true, preserveError: true });
    } finally {
      setReindexingDocumentId("");
    }
  }

  function handleDeleteRequest(document) {
    setDeleteTarget(document);
  }

  function closeDeleteDialog() {
    if (deletingDocumentId) {
      return;
    }

    setDeleteTarget(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget?._id) {
      return;
    }

    setDeletingDocumentId(deleteTarget._id);
    setError("");

    try {
      await deleteDocument(deleteTarget._id);
      setDeleteTarget(null);
      await loadAdminWorkspace({ background: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete this document.");
      await loadAdminWorkspace({ background: true, preserveError: true });
    } finally {
      setDeletingDocumentId("");
    }
  }

  const sidebar = (
    <Sidebar
      brand="Admin Control"
      tagline="Govern uploads and visibility"
      footer={<p>Upload docs once. Employees chat against indexed enterprise knowledge.</p>}
    >
      <div className="sidebar-group">
        <p className="sidebar-label">Control points</p>
        <div className="sidebar-stack">
          <div className="sidebar-card muted">
            <strong>Document intake</strong>
            <span>PDF, DOCX, and TXT are parsed and embedded automatically.</span>
          </div>
          <div className="sidebar-card muted">
            <strong>RBAC secured</strong>
            <span>JWT cookies keep employee and admin access separated.</span>
          </div>
          <div className="sidebar-card muted">
            <strong>Grounded responses</strong>
            <span>Every answer ships with source links back to the original document.</span>
          </div>
        </div>
      </div>
    </Sidebar>
  );

  if (isLoading) {
    return <div className="screen-center">Loading admin workspace...</div>;
  }

  return (
    <AppShell
      sidebar={sidebar}
      title="Admin Dashboard"
      subtitle="Monitor usage, index company documents, and keep the knowledge base fresh."
    >
      {error ? <div className="inline-error">{error}</div> : null}

      <section className="stats-grid">
        <StatCard
          label="Total users"
          value={overview?.stats?.totalUsers || 0}
          helper="Registered employee & admin accounts"
        />
        <StatCard
          label="Indexed documents"
          value={overview?.stats?.indexedDocuments || 0}
          helper={`Out of ${overview?.stats?.totalDocuments || 0} total uploaded assets`}
        />
        <StatCard
          label="Knowledge chunks"
          value={overview?.stats?.totalChunks || 0}
          helper="Embedded vectors in ChromaDB"
        />
        <StatCard
          label="Total queries"
          value={overview?.stats?.totalQueries || 0}
          helper={`Across ${overview?.stats?.totalSessions || 0} chat sessions`}
        />
      </section>

      <section className="admin-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Upload company documents</p>
              <h2>Ingest new knowledge</h2>
            </div>
          </div>
          <form className="upload-form" onSubmit={handleUpload}>
            <label>
              Title
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Employee Leave Policy"
              />
            </label>
            <label>
              Description
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Optional context to help admins understand this file."
              />
            </label>
            <label>
              Access Policy
              <select
                value={form.accessLevel}
                onChange={(event) =>
                  setForm((current) => ({ ...current, accessLevel: event.target.value }))
                }
              >
                <option value="public">🌐 Public (All Employees)</option>
                <option value="department">🏢 Department Restricted</option>
                <option value="admin_only">🔒 Admin Only (Confidential)</option>
              </select>
            </label>
            {form.accessLevel === "department" ? (
              <div className="form-group dept-checkbox-group">
                <label style={{ marginBottom: "0.5rem", display: "block" }}>
                  Allowed Departments
                </label>
                <div className="dept-checkbox-list">
                  {[
                    { value: "Engineering", label: "Engineering" },
                    { value: "HR", label: "Human Resources (HR)" },
                    { value: "Finance", label: "Finance & Accounting" },
                    { value: "Legal", label: "Legal & Compliance" },
                    { value: "Operations", label: "Operations" },
                    { value: "General", label: "General" },
                  ].map(({ value, label }) => (
                    <label key={value} className="dept-checkbox-item">
                      <input
                        type="checkbox"
                        checked={form.allowedDepartments.includes(value)}
                        onChange={(e) => {
                          setForm((current) => ({
                            ...current,
                            allowedDepartments: e.target.checked
                              ? [...current.allowedDepartments, value]
                              : current.allowedDepartments.filter((d) => d !== value),
                          }));
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                {form.allowedDepartments.length === 0 && (
                  <p style={{ fontSize: "0.78rem", color: "var(--warning, #f59e0b)", marginTop: "0.4rem" }}>
                    ⚠ Select at least one department.
                  </p>
                )}
              </div>
            ) : null}
            <label>
              Document file
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) =>
                  setForm((current) => ({ ...current, document: event.target.files?.[0] || null }))
                }
              />
            </label>
            <button className="primary-button" type="submit" disabled={isUploading}>
              {isUploading ? "Uploading and indexing..." : "Upload document"}
            </button>
          </form>
        </article>

        <article className="panel leaderboard-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Document Intelligence Leaderboard</p>
              <h2>Top Cited Knowledge Assets</h2>
            </div>
          </div>
          <div className="list-stack scrollable-stack leaderboard-stack">
            {overview?.topCitedDocuments?.length ? (
              overview.topCitedDocuments.map((asset, idx) => (
                <div className="list-row" key={asset._id || idx}>
                  <div>
                    <strong>#{idx + 1} {asset.documentTitle}</strong>
                    <p className="muted" style={{ fontSize: "0.85rem", marginTop: "2px" }}>
                      Source: {asset.sourceName}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="status-pill status-indexed" style={{ display: "inline-block" }}>
                      {asset.citationCount} {asset.citationCount === 1 ? "Citation" : "Citations"}
                    </span>
                    {asset.avgScore ? (
                      <p className="muted" style={{ fontSize: "0.8rem", marginTop: "2px" }}>
                        Confidence: {(asset.avgScore * 100).toFixed(1)}%
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No document citations recorded yet. Answers in employee chats will populate this leaderboard.</div>
            )}
          </div>
        </article>
      </section>

      <section className="admin-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Governance & Security</p>
              <h2>Access Policy Breakdown</h2>
            </div>
          </div>
          <div className="list-stack scrollable-stack policy-stack">
            {overview?.policyDistribution?.length ? (
              overview.policyDistribution.map((item) => (
                <div className="list-row" key={item._id}>
                  <strong>
                    {item._id === "admin_only"
                      ? "🔒 Admin Only (Confidential)"
                      : item._id === "department"
                      ? "🏢 Department Restricted"
                      : "🌐 Public (All Employees)"}
                  </strong>
                  <span className="status-pill">{item.count} {item.count === 1 ? "Document" : "Documents"}</span>
                </div>
              ))
            ) : (
              <div className="empty-state">No policy distribution data available.</div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Query Audit Trail</p>
              <h2>Recent Employee Inquiries</h2>
            </div>
          </div>
          <div className="list-stack scrollable-stack audit-stack">
            {overview?.recentQueries?.length ? (
              overview.recentQueries.map((query) => (
                <div className="list-row" key={query._id}>
                  <div>
                    <strong>{query.content}</strong>
                    <p className="muted" style={{ fontSize: "0.85rem", marginTop: "2px" }}>
                      {query.user?.name || "Employee"} {query.user?.department ? `(${query.user.department})` : ""} | {query.session?.title || "Conversation"}
                    </p>
                  </div>
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    {new Date(query.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">No employee questions recorded yet.</div>
            )}
          </div>
        </article>
      </section>

      <section className="admin-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Indexed documents</p>
              <h2>Knowledge base</h2>
            </div>
          </div>
          <DocumentTable
            documents={documents}
            onReindex={handleReindex}
            onDeleteRequest={handleDeleteRequest}
            reindexingDocumentId={reindexingDocumentId}
            deletingDocumentId={deletingDocumentId}
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Users</p>
              <h2>Recently active accounts</h2>
            </div>
          </div>
          <div className="list-stack scrollable-stack users-stack">
            {overview?.recentUsers?.length ? (
              overview.recentUsers.map((workspaceUser) => (
                <div className="list-row user-row-compact" key={workspaceUser._id}>
                  <div className="user-info-col">
                    <div className="user-avatar-initial" style={{ width: 32, height: 32, fontSize: "0.85rem" }}>
                      {workspaceUser.name ? workspaceUser.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <strong>{workspaceUser.name}</strong>
                      <p className="muted" style={{ fontSize: "0.8rem", margin: "2px 0 0" }}>
                        {workspaceUser.email} • {workspaceUser.department || "General"}
                      </p>
                    </div>
                  </div>
                  <span className={`status-pill ${workspaceUser.role === "admin" ? "status-failed" : "status-indexed"}`}>
                    {workspaceUser.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">No users available yet.</div>
            )}
          </div>
        </article>
      </section>

      {deleteTarget ? (
        <div className="modal-overlay" role="presentation" onClick={closeDeleteDialog}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Delete document</p>
            <h2>Remove {deleteTarget.title}?</h2>
            <p>
              This will delete the uploaded file, remove its indexed vectors, and hide it from the
              admin and employee experience.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={closeDeleteDialog}
                disabled={Boolean(deletingDocumentId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={handleDeleteConfirm}
                disabled={Boolean(deletingDocumentId)}
              >
                {deletingDocumentId ? "Deleting..." : "Delete document"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

export default AdminDashboardPage;
