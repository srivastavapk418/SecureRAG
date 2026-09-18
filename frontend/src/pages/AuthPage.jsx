import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getSetupStatus } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

function AuthPage() {
  const { user, login, register, registerAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "Engineering",
    bootstrapKey: "",
  });
  const [setupStatus, setSetupStatus] = useState({
    adminExists: false,
    bootstrapAvailable: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/employee", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    let ignore = false;

    getSetupStatus()
      .then((response) => {
        if (!ignore) {
          setSetupStatus(response);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSetupStatus({
            adminExists: false,
            bootstrapAvailable: false,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const modeConfig = useMemo(
    () => ({
      login: {
        title: "Welcome back",
        description: "Use your existing workspace credentials to access the employee or admin dashboard.",
        buttonLabel: "Enter workspace",
      },
      employee: {
        title: "Register user account",
        description: "Create a standard employee account for asking questions against the indexed company knowledge base.",
        buttonLabel: "Create user account",
      },
      admin: {
        title: setupStatus.bootstrapAvailable ? "Create first admin" : "Register admin account",
        description: setupStatus.bootstrapAvailable
          ? "No admin exists yet. Use the bootstrap key to initialize the workspace administrator."
          : "Create an admin account with the workspace bootstrap key from backend/.env.",
        buttonLabel: setupStatus.bootstrapAvailable ? "Create first admin" : "Create admin account",
      },
    }),
    [setupStatus.bootstrapAvailable]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const authenticatedUser =
        mode === "login"
          ? await login(form)
          : mode === "employee"
            ? await register(form)
            : await registerAdmin(form);

      const fallbackPath = authenticatedUser.role === "admin" ? "/admin" : "/employee";
      const nextPath = location.state?.from?.pathname || fallbackPath;
      navigate(nextPath, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to complete authentication.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <p className="eyebrow">Private RAG platform</p>
        <h1>Enterprise answers grounded in your own policies and documents.</h1>
        <p>
          Upload secure PDFs and DOCX files, index them into a private vector
          database, and let employees ask questions with cited answers.
        </p>
        <div className="hero-points">
          <div>
            <strong>Admin controls</strong>
            <span>Manage uploads, indexing status, and workspace activity.</span>
          </div>
          <div>
            <strong>Employee self-service</strong>
            <span>Get policy answers instantly with source links for verification.</span>
          </div>
          <div>
            <strong>Local AI pipeline</strong>
            <span>Use Ollama and Chroma to keep enterprise knowledge private.</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-panel-copy">
            <p className="eyebrow">Workspace access</p>
            <h2>Choose how you want to enter the platform</h2>
            <p>
              Admin accounts require the bootstrap key. Employee accounts are standard user
              registrations for document-grounded Q&amp;A.
            </p>
          </div>

          <div className="auth-mode-grid">
            <button
              type="button"
              className={`auth-mode-card ${mode === "login" ? "active" : ""}`}
              onClick={() => selectMode("login")}
            >
              <span className="auth-mode-card-title">Login</span>
              <small>Use an existing employee or admin account.</small>
            </button>
            <button
              type="button"
              className={`auth-mode-card ${mode === "employee" ? "active" : ""}`}
              onClick={() => selectMode("employee")}
            >
              <span className="auth-mode-card-title">Register User</span>
              <small>Create an employee account for everyday use.</small>
            </button>
            <button
              type="button"
              className={`auth-mode-card ${mode === "admin" ? "active" : ""}`}
              onClick={() => selectMode("admin")}
            >
              <span className="auth-mode-card-title">Register Admin</span>
              <small>Use the bootstrap key to create an admin account.</small>
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-header">
              <h3>{modeConfig[mode].title}</h3>
              <p>{modeConfig[mode].description}</p>
            </div>

            {mode === "admin" ? (
              <div className="auth-hint">
                {setupStatus.bootstrapAvailable
                  ? "This workspace has not been initialized with an admin yet."
                  : "An admin already exists, so this will create an additional admin account."}
              </div>
            ) : null}

            <div className="auth-field-grid">
              {mode !== "login" ? (
                <>
                  <label>
                    Full name
                    <input
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder={mode === "admin" ? "Platform Administrator" : "Aarav Sharma"}
                    />
                  </label>

                  <label>
                    Department
                    <select
                      value={form.department}
                      onChange={(event) => updateField("department", event.target.value)}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="HR">Human Resources (HR)</option>
                      <option value="Finance">Finance & Accounting</option>
                      <option value="Legal">Legal & Compliance</option>
                      <option value="Operations">Operations</option>
                      <option value="General">General</option>
                    </select>
                  </label>
                </>
              ) : null}

              <label>
                Work email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="employee@company.com"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </label>

              {mode === "admin" ? (
                <label>
                  Bootstrap key
                  <input
                    value={form.bootstrapKey}
                    onChange={(event) => updateField("bootstrapKey", event.target.value)}
                    placeholder="bootstrap-local-admin"
                  />
                </label>
              ) : null}
            </div>

            {error ? <div className="inline-error">{error}</div> : null}

            <button className="primary-button full-width" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : modeConfig[mode].buttonLabel}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default AuthPage;
