import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  getProfile,
  updateProfile,
  deleteAccount,
  listUsers,
  createUser,
  deleteUser,
} from "../../api/userApi";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUser, logout } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState({
    name: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Admin user management state
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "General",
    role: "employee",
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      setProfileForm({
        name: user.name || "",
        department: user.department || "",
        password: "",
        confirmPassword: "",
      });
      setStatusMessage(null);
      setShowDeleteConfirm(false);
      setUserToDelete(null);

      if (isAdmin) {
        fetchUsers();
      }
    }
  }, [isOpen, user, isAdmin]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await listUsers();
      setUsersList(data.users || []);
    } catch (err) {
      console.error("Failed to load users list:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (profileForm.password) {
      if (profileForm.password.length < 8) {
        setStatusMessage({
          type: "error",
          text: "Password must be at least 8 characters long.",
        });
        return;
      }
      if (profileForm.password !== profileForm.confirmPassword) {
        setStatusMessage({
          type: "error",
          text: "Passwords do not match.",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        name: profileForm.name,
        department: profileForm.department,
      };
      if (profileForm.password) {
        payload.password = profileForm.password;
      }

      const res = await updateProfile(payload);
      if (res.user) {
        updateUser(res.user);
      }
      setStatusMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
      setProfileForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSelf = async () => {
    setIsDeleting(true);
    setStatusMessage(null);
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete account.",
      });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newUserForm.password.length < 8) {
      setStatusMessage({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }

    setIsCreatingUser(true);
    try {
      await createUser(newUserForm);
      setStatusMessage({
        type: "success",
        text: "User created successfully!",
      });
      setNewUserForm({
        name: "",
        email: "",
        password: "",
        department: "General",
        role: "EMPLOYEE",
      });
      setShowAddUserForm(false);
      await fetchUsers();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create user.",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (targetId) => {
    setStatusMessage(null);
    try {
      await deleteUser(targetId);
      setStatusMessage({
        type: "success",
        text: "User deleted successfully.",
      });
      setUserToDelete(null);
      await fetchUsers();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete user.",
      });
    }
  };

  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card profile-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="profile-modal-header">
          <div className="profile-user-summary">
            <div className="profile-avatar-large">{initials}</div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                {user.name}
              </h3>
              <div className="profile-tags-row">
                <span className="badge badge-role">{user.role}</span>
                <span className="badge badge-dept">
                  {user.department || "General"}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="profile-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs-nav">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            My Profile
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === "manageUsers" ? "active" : ""}`}
              onClick={() => setActiveTab("manageUsers")}
            >
              Manage Users ({usersList.length})
            </button>
          )}
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div className={`profile-status-banner ${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}

        {/* Modal Body */}
        <div className="profile-modal-body custom-scrollbar">
          {activeTab === "profile" && (
            <div>
              <form onSubmit={handleSaveProfile}>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="input-disabled"
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <select
                      name="department"
                      value={profileForm.department}
                      onChange={handleProfileChange}
                      disabled={!isAdmin}
                      className={!isAdmin ? "input-disabled" : ""}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Legal">Legal</option>
                      <option value="Operations">Operations</option>
                      <option value="General">General</option>
                    </select>
                    {!isAdmin && (
                      <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                        🔒 Contact your administrator to request a department change.
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label>System Role</label>
                    <input
                      type="text"
                      value={user.role}
                      disabled
                      className="input-disabled"
                    />
                  </div>
                </div>

                <div className="profile-divider" />

                <h4 className="profile-section-title">
                  🔒 Change Password (Optional)
                </h4>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      name="password"
                      value={profileForm.password}
                      onChange={handleProfileChange}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={profileForm.confirmPassword}
                      onChange={handleProfileChange}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="profile-metadata-card">
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Member since: </span>
                    <strong>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Account ID: </span>
                    <code>{user.id || user._id}</code>
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>

              {/* Danger Zone: Self Account Deletion */}
              <div className="profile-danger-zone">
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#ef4444", fontSize: "0.95rem" }}>
                  Danger Zone
                </h4>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ borderColor: "rgba(239,68,68,0.4)", color: "#ef4444" }}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="delete-confirm-box">
                    <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.88rem", color: "#ef4444" }}>
                      Are you sure you want to delete your account? This action is irreversible and will purge all your chat sessions.
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: "#ef4444", borderColor: "#ef4444" }}
                        onClick={handleDeleteSelf}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Confirm Delete"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Tab: Manage Users */}
          {activeTab === "manageUsers" && isAdmin && (
            <div>
              <div className="manage-users-header">
                <div>
                  <h4 style={{ margin: 0 }}>Provisioned Accounts</h4>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Total registered users: {usersList.length}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddUserForm(!showAddUserForm)}
                >
                  {showAddUserForm ? "Close Form" : "+ Add User"}
                </button>
              </div>

              {/* Add New User Accordion */}
              {showAddUserForm && (
                <div className="add-user-card">
                  <h4 style={{ margin: "0 0 0.85rem 0", fontSize: "0.95rem" }}>
                    Add New User Account
                  </h4>
                  <form onSubmit={handleCreateUser}>
                    <div className="profile-form-grid">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          required
                          value={newUserForm.name}
                          onChange={(e) =>
                            setNewUserForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="Employee Name"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          required
                          value={newUserForm.email}
                          onChange={(e) =>
                            setNewUserForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="employee@company.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>Initial Password</label>
                        <input
                          type="password"
                          required
                          value={newUserForm.password}
                          onChange={(e) =>
                            setNewUserForm((prev) => ({ ...prev, password: e.target.value }))
                          }
                          placeholder="Min. 8 characters"
                        />
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <select
                          value={newUserForm.department}
                          onChange={(e) =>
                            setNewUserForm((prev) => ({ ...prev, department: e.target.value }))
                          }
                        >
                          <option value="Engineering">Engineering</option>
                          <option value="HR">HR</option>
                          <option value="Finance">Finance</option>
                          <option value="Legal">Legal</option>
                          <option value="Operations">Operations</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Role</label>
                        <select
                          value={newUserForm.role}
                          onChange={(e) =>
                            setNewUserForm((prev) => ({ ...prev, role: e.target.value }))
                          }
                        >
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="profile-form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isCreatingUser}
                      >
                        {isCreatingUser ? "Creating..." : "Create User"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Users List with Scrollable Stack */}
              {isLoadingUsers ? (
                <p style={{ color: "var(--text-muted)" }}>Loading users...</p>
              ) : (
                <div className="users-stack scrollable-stack" style={{ maxHeight: "360px" }}>
                  {usersList.map((u) => {
                    const isSelf = (u.id || u._id) === (user.id || user._id);
                    const isUserAdmin = u.role?.toLowerCase() === "admin";
                    return (
                      <div
                        key={u.id || u._id}
                        className="list-item-card user-row-compact"
                        style={{ marginBottom: "0.5rem", padding: "0.75rem 1rem" }}
                      >
                        <div className="user-info-col">
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: isUserAdmin ? "rgba(99, 102, 241, 0.2)" : "rgba(59, 130, 246, 0.15)",
                              color: isUserAdmin ? "#818cf8" : "#60a5fa",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                            }}
                          >
                            {(u.name || u.email || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                              {u.name} {isSelf && <span style={{ color: "var(--accent)" }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {u.email} • {u.department || "General"}
                            </div>
                          </div>
                        </div>

                        <div className="user-actions-col">
                          <span
                            className="badge"
                            style={{
                              background: isUserAdmin ? "rgba(99, 102, 241, 0.15)" : "rgba(148, 163, 184, 0.15)",
                              color: isUserAdmin ? "#a5b4fc" : "var(--text-muted)",
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                            }}
                          >
                            {u.role}
                          </span>

                          {!isSelf && (
                            <>
                              {userToDelete === (u.id || u._id) ? (
                                <div style={{ display: "flex", gap: "0.35rem" }}>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{
                                      padding: "0.3rem 0.6rem",
                                      fontSize: "0.75rem",
                                      background: "#ef4444",
                                      borderColor: "#ef4444",
                                    }}
                                    onClick={() => handleDeleteUser(u.id || u._id)}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                                    onClick={() => setUserToDelete(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{
                                    padding: "0.3rem 0.6rem",
                                    fontSize: "0.75rem",
                                    color: "#ef4444",
                                    borderColor: "rgba(239, 68, 68, 0.3)",
                                  }}
                                  onClick={() => setUserToDelete(u.id || u._id)}
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
