"use client";

import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  History,
  LogOut,
  Plus,
  Save,
  Settings,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptyMessage = "";

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(emptyMessage);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(emptyMessage);

    try {
      const data = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onAuth(data.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Electrical Proposal Builder</p>
          <h1>Quote-ready documents from a trade-specific questionnaire.</h1>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>

          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>

          {message ? <p className="form-error">{message}</p> : null}

          <button className="primary-button" disabled={busy} type="submit">
            <FileText size={18} />
            {busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button className="text-button" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Create a new account" : "Use an existing account"}
        </button>
      </section>
    </main>
  );
}

function Field({ field, value, onChange }) {
  if (field.type === "textarea") {
    return (
      <label className="field field-wide">
        {field.label}
        <textarea value={value || ""} required={field.required} onChange={(event) => onChange(field.id, event.target.value)} />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="field">
        {field.label}
        <select value={value || ""} required={field.required} onChange={(event) => onChange(field.id, event.target.value)}>
          <option value="">Select</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className="field field-wide option-grid">
        <legend>{field.label}</legend>
        {(field.options || []).map((option) => (
          <label key={option} className="check-row">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) => {
                const next = event.target.checked ? [...selected, option] : selected.filter((item) => item !== option);
                onChange(field.id, next);
              }}
            />
            {option}
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <label className="field">
      {field.label}
      <input
        value={value || ""}
        required={field.required}
        type={field.type || "text"}
        onChange={(event) => onChange(field.id, event.target.value)}
      />
    </label>
  );
}

function ProposalHistory({ proposals, activeId, onOpen, onNew }) {
  return (
    <aside className="sidebar">
      <button className="new-button" type="button" onClick={onNew}>
        <Plus size={18} />
        New proposal
      </button>

      <div className="sidebar-heading">
        <History size={16} />
        Past proposals
      </div>

      <div className="history-list">
        {proposals.length ? (
          proposals.map((proposal) => (
            <button
              className={classNames("history-item", activeId === proposal.id && "history-item-active")}
              key={proposal.id}
              onClick={() => onOpen(proposal)}
              type="button"
            >
              <strong>{proposal.projectName || proposal.title}</strong>
              <span>{proposal.clientName}</span>
              <time>{new Date(proposal.updatedAt).toLocaleDateString()}</time>
            </button>
          ))
        ) : (
          <p className="muted-copy">No saved proposals yet.</p>
        )}
      </div>
    </aside>
  );
}

function Questionnaire({ config, answers, setAnswers, stepIndex, setStepIndex, onGenerate, busy, message }) {
  const step = config.steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / config.steps.length) * 100);

  function updateAnswer(fieldId, value) {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  }

  return (
    <section className="workspace-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{config.companyName}</p>
          <h2>{step.title}</h2>
        </div>
        <span className="step-pill">
          {stepIndex + 1} / {config.steps.length}
        </span>
      </div>

      <div className="progress-track">
        <div style={{ width: `${progress}%` }} />
      </div>

      <div className="form-grid">
        {step.fields.map((field) => (
          <Field key={field.id} field={field} value={answers[field.id]} onChange={updateAnswer} />
        ))}
      </div>

      {message ? <p className="form-error">{message}</p> : null}

      <div className="form-actions">
        <button className="secondary-button" type="button" disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)}>
          <ArrowLeft size={18} />
          Back
        </button>

        {stepIndex < config.steps.length - 1 ? (
          <button className="primary-button" type="button" onClick={() => setStepIndex(stepIndex + 1)}>
            Next
            <ArrowRight size={18} />
          </button>
        ) : (
          <button className="primary-button" type="button" disabled={busy} onClick={onGenerate}>
            <WandSparkles size={18} />
            {busy ? "Generating..." : "Generate proposal"}
          </button>
        )}
      </div>
    </section>
  );
}

function ProposalEditor({ proposal, markdown, setMarkdown, onSave, onExport, saving }) {
  if (!proposal) {
    return (
      <section className="workspace-panel empty-panel">
        <FileText size={24} />
        <h2>Draft will appear here</h2>
      </section>
    );
  }

  return (
    <section className="workspace-panel editor-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{proposal.generatedBy === "openai" ? proposal.model || "OpenAI" : "Local demo draft"}</p>
          <h2>{proposal.title}</h2>
        </div>
        <div className="button-row">
          <button className="secondary-button icon-button" type="button" onClick={onSave} title="Save edits">
            <Save size={18} />
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="secondary-button icon-button" type="button" onClick={() => onExport("docx")}>
            <Download size={18} />
            Word
          </button>
          <button className="secondary-button icon-button" type="button" onClick={() => onExport("pdf")}>
            <Download size={18} />
            PDF
          </button>
        </div>
      </div>

      <textarea className="proposal-editor" value={markdown} onChange={(event) => setMarkdown(event.target.value)} />
    </section>
  );
}

function SettingsPanel({ config, prompt, setPrompt, questionnaireText, setQuestionnaireText, onSave, message, saving }) {
  return (
    <section className="workspace-panel settings-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Prompt & questions</p>
          <h2>Builder settings</h2>
        </div>
        <button className="primary-button" type="button" onClick={onSave} disabled={saving}>
          <Save size={18} />
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>

      {message ? <p className={message.startsWith("Saved") ? "form-success" : "form-error"}>{message}</p> : null}

      <label className="field field-wide">
        System prompt
        <textarea className="settings-textarea" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      </label>

      <label className="field field-wide">
        Questionnaire JSON
        <textarea className="settings-textarea code-textarea" value={questionnaireText} onChange={(event) => setQuestionnaireText(event.target.value)} />
      </label>
    </section>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("builder");
  const [config, setConfig] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [questionnaireText, setQuestionnaireText] = useState("");
  const [proposals, setProposals] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  const [markdown, setMarkdown] = useState("");
  const [answers, setAnswers] = useState({ proposalDate: today() });
  const [stepIndex, setStepIndex] = useState(0);
  const [message, setMessage] = useState(emptyMessage);
  const [settingsMessage, setSettingsMessage] = useState(emptyMessage);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const requiredFields = useMemo(() => {
    if (!config) return [];
    return config.steps.flatMap((step) => step.fields.filter((field) => field.required));
  }, [config]);

  async function loadApp() {
    const me = await api("/api/me");
    setUser(me.user);
    if (!me.user) {
      setLoading(false);
      return;
    }

    const [configData, proposalData] = await Promise.all([api("/api/config"), api("/api/proposals")]);
    setConfig(configData.questionnaire);
    setPrompt(configData.prompt);
    setQuestionnaireText(JSON.stringify(configData.questionnaire, null, 2));
    setProposals(proposalData.proposals);
    setLoading(false);
  }

  useEffect(() => {
    loadApp().catch(() => setLoading(false));
  }, []);

  async function afterAuth(nextUser) {
    setUser(nextUser);
    setLoading(true);
    const [configData, proposalData] = await Promise.all([api("/api/config"), api("/api/proposals")]);
    setConfig(configData.questionnaire);
    setPrompt(configData.prompt);
    setQuestionnaireText(JSON.stringify(configData.questionnaire, null, 2));
    setProposals(proposalData.proposals);
    setLoading(false);
  }

  function resetDraft() {
    setActiveProposal(null);
    setMarkdown("");
    setAnswers({ proposalDate: today() });
    setStepIndex(0);
    setMessage(emptyMessage);
    setView("builder");
  }

  async function refreshProposals() {
    const data = await api("/api/proposals");
    setProposals(data.proposals);
  }

  async function generate() {
    const missing = requiredFields.filter((field) => {
      const value = answers[field.id];
      return Array.isArray(value) ? !value.length : !value;
    });

    if (missing.length) {
      setMessage(`Missing required fields: ${missing.map((field) => field.label).join(", ")}`);
      return;
    }

    setBusy(true);
    setMessage(emptyMessage);

    try {
      const data = await api("/api/proposals", {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      setActiveProposal(data.proposal);
      setMarkdown(data.proposal.markdown);
      await refreshProposals();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveProposal() {
    if (!activeProposal) return;
    setSaving(true);

    try {
      const data = await api(`/api/proposals/${activeProposal.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: activeProposal.title, markdown, status: "draft" }),
      });
      setActiveProposal(data.proposal);
      await refreshProposals();
      return data.proposal;
    } finally {
      setSaving(false);
    }
  }

  async function exportProposal(format) {
    if (!activeProposal) return;
    const saved = await saveProposal();
    window.location.href = `/api/proposals/${saved?.id || activeProposal.id}/export/${format}`;
  }

  async function saveSettings() {
    setSaving(true);
    setSettingsMessage(emptyMessage);

    try {
      const questionnaire = JSON.parse(questionnaireText);
      await api("/api/config", {
        method: "PUT",
        body: JSON.stringify({ questionnaire, prompt }),
      });
      setConfig(questionnaire);
      setSettingsMessage("Saved settings.");
    } catch (error) {
      setSettingsMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    resetDraft();
  }

  if (loading) {
    return <main className="loading-shell">Loading...</main>;
  }

  if (!user) {
    return <AuthScreen onAuth={afterAuth} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Electrical Proposal Builder</p>
          <h1>Proposal workspace</h1>
        </div>
        <div className="topbar-actions">
          <button className={classNames("nav-button", view === "builder" && "nav-button-active")} type="button" onClick={() => setView("builder")}>
            <FileText size={18} />
            Builder
          </button>
          <button className={classNames("nav-button", view === "settings" && "nav-button-active")} type="button" onClick={() => setView("settings")}>
            <Settings size={18} />
            Settings
          </button>
          <button className="nav-button" type="button" onClick={logout}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </header>

      <div className="workbench">
        <ProposalHistory
          proposals={proposals}
          activeId={activeProposal?.id}
          onNew={resetDraft}
          onOpen={(proposal) => {
            setActiveProposal(proposal);
            setMarkdown(proposal.markdown || "");
            setAnswers(proposal.answers || { proposalDate: today() });
            setView("builder");
          }}
        />

        {view === "settings" ? (
          <SettingsPanel
            config={config}
            prompt={prompt}
            setPrompt={setPrompt}
            questionnaireText={questionnaireText}
            setQuestionnaireText={setQuestionnaireText}
            onSave={saveSettings}
            message={settingsMessage}
            saving={saving}
          />
        ) : (
          <div className="builder-grid">
            {config ? (
              <Questionnaire
                config={config}
                answers={answers}
                setAnswers={setAnswers}
                stepIndex={stepIndex}
                setStepIndex={setStepIndex}
                onGenerate={generate}
                busy={busy}
                message={message}
              />
            ) : null}
            <ProposalEditor
              proposal={activeProposal}
              markdown={markdown}
              setMarkdown={setMarkdown}
              onSave={saveProposal}
              onExport={exportProposal}
              saving={saving}
            />
          </div>
        )}
      </div>
    </main>
  );
}
