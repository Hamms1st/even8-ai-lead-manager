"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type Lead = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  event: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  name: "",
  company: "",
  email: "",
  event: "",
  notes: "",
  status: "new",
};

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadLeads() {
    try {
      setError("");

      const response = await fetch("/api/leads", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load leads");
      }

      setLeads(data.leads ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim(),
          event: form.event.trim(),
          notes: form.notes.trim(),
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create lead");
      }

      setForm(emptyForm);
      setShowForm(false);

      await loadLeads();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(lead: Lead) {
    setEditingId(lead.id);

    setEditForm({
      name: lead.name,
      company: lead.company ?? "",
      email: lead.email ?? "",
      event: lead.event ?? "",
      notes: lead.notes ?? "",
      status: lead.status,
    });

    setShowForm(false);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(emptyForm);
    setError("");
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    if (!editForm.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!editForm.email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          name: editForm.name.trim(),
          company: editForm.company.trim(),
          email: editForm.email.trim(),
          event: editForm.event.trim(),
          notes: editForm.notes.trim(),
          status: editForm.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lead");
      }

      setEditingId(null);
      setEditForm(emptyForm);

      await loadLeads();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lead: Lead) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${lead.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(lead.id);
      setError("");

      const response = await fetch("/api/leads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: lead.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete lead");
      }

      if (editingId === lead.id) {
        setEditingId(null);
        setEditForm(emptyForm);
      }

      if (selectedLead?.id === lead.id) {
        setSelectedLead(null);
        setAiResult("");
        setAiTitle("");
      }

      await loadLeads();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function copyAIResult() {
    if (!aiResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(aiResult);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Could not copy AI response.");
    }
  }

  async function askAI(title: string, prompt: string) {
    try {
      setAiLoading(true);
      setAiResult("");
      setAiTitle(title);
      setCopied(false);
      setError("");

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI request failed");
      }

      setAiResult(data.result || "No response generated.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong with AI"
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function generateLeadSummary() {
    if (leads.length === 0) {
      setError("Add some leads before generating an AI summary.");
      return;
    }

    const leadData = leads.map((lead) => ({
      name: lead.name,
      company: lead.company,
      event: lead.event,
      status: lead.status,
      notes: lead.notes,
    }));

    const prompt = `
You are an AI assistant inside an event lead management application called Even8.

Analyze the following leads:

${JSON.stringify(leadData, null, 2)}

Give a concise business summary containing:

1. Overall lead situation
2. Important observations
3. Leads that may require attention
4. Recommended next steps

Do not invent information that is not present in the lead data.
`;

    await askAI("AI Lead Summary", prompt);
  }

  async function generateNextActions() {
    if (leads.length === 0) {
      setError("Add some leads before generating next actions.");
      return;
    }

    const leadData = leads.map((lead) => ({
      name: lead.name,
      company: lead.company,
      event: lead.event,
      status: lead.status,
      notes: lead.notes,
    }));

    const prompt = `
You are an AI sales assistant inside Even8, an event lead management application.

Review these leads:

${JSON.stringify(leadData, null, 2)}

Recommend practical next actions.

Prioritize leads that still have the status "new".

For each important lead, provide:
- Lead name
- Recommended action
- Short reason

Keep the response concise and actionable.
Do not invent facts that are not present in the data.
`;

    await askAI("Recommended Next Actions", prompt);
  }

  async function analyzeSelectedLead() {
    if (!selectedLead) {
      return;
    }

    const leadData = {
      name: selectedLead.name,
      company: selectedLead.company,
      event: selectedLead.event,
      status: selectedLead.status,
      notes: selectedLead.notes,
    };

    const prompt = `
You are an AI sales assistant inside Even8, an event lead management application.

Analyze this individual lead:

${JSON.stringify(leadData, null, 2)}

Provide a concise analysis containing:

1. Lead Assessment
2. Important Context
3. Recommended Next Action
4. Suggested Approach

Base your analysis only on the information provided.
Do not invent facts, previous conversations, company information, deadlines, or customer intentions that are not present in the lead data.

If information is missing, state that it is unknown rather than assuming it.
`;

    await askAI(
      `AI Analysis — ${selectedLead.name}`,
      prompt
    );
  }

  async function generateFollowUp() {
    if (!selectedLead) {
      return;
    }

    const leadData = {
      name: selectedLead.name,
      company: selectedLead.company,
      event: selectedLead.event,
      status: selectedLead.status,
      notes: selectedLead.notes,
    };

    const prompt = `
You are an AI sales assistant inside Even8, an event lead management application.

Using the following lead information:

${JSON.stringify(leadData, null, 2)}

Write a professional and concise follow-up email for this lead.

Requirements:
- Address the lead by first name.
- Use the company, event, status and notes only when relevant.
- Keep the email natural and professional.
- Do not invent previous conversations, commitments, pricing, dates or facts.
- If the notes mention a specific interest or request, use it naturally.
- Keep the email reasonably short.
- Include a clear next step or call to action.
- Provide a suitable subject line.
- End with "[Your Name]" as the sender.

Return only:

## Subject
subject here

## Email
email here
`;

    await askAI(
      `Follow-up Draft — ${selectedLead.name}`,
      prompt
    );
  }

  async function generateLeadStrategy() {
    if (!selectedLead) {
      return;
    }

    const leadData = {
      name: selectedLead.name,
      company: selectedLead.company,
      event: selectedLead.event,
      status: selectedLead.status,
      notes: selectedLead.notes,
    };

    const prompt = `
You are an AI sales assistant inside Even8, an event lead management application.

Review this lead:

${JSON.stringify(leadData, null, 2)}

Recommend a practical engagement strategy for this lead.

Provide:

1. Priority Level — High, Medium, or Low
2. Recommended Approach
3. Key Talking Points
4. Information We Should Obtain
5. Best Next Step

Use only the information provided.

Do not invent company details, previous conversations, budgets,
deadlines, purchase intentions, or other facts.

If there is not enough information to determine something,
clearly state that more information is needed.

Keep the strategy concise and actionable.
`;

    await askAI(
      `AI Strategy — ${selectedLead.name}`,
      prompt
    );
  }

  const totalLeads = leads.length;

const newLeads = leads.filter(
  (lead) => lead.status === "new"
).length;

const activeLeads = leads.filter(
  (lead) =>
    lead.status === "contacted" ||
    lead.status === "qualified" ||
    lead.status === "follow-up"
).length;

const convertedLeads = leads.filter(
  (lead) => lead.status === "converted"
).length;

const lostLeads = leads.filter(
  (lead) => lead.status === "lost"
).length;

const conversionRate =
  totalLeads === 0
    ? 0
    : Math.round((convertedLeads / totalLeads) * 100);

  const filteredLeads = leads
    .filter((lead) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        lead.name.toLowerCase().includes(searchText) ||
        (lead.company ?? "").toLowerCase().includes(searchText) ||
        (lead.email ?? "").toLowerCase().includes(searchText) ||
        (lead.event ?? "").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      if (sortBy === "company-asc") {
        return (a.company ?? "").localeCompare(
          b.company ?? ""
        );
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });

    function getStatusBadge(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-500/10 text-blue-400";

    case "contacted":
      return "bg-cyan-500/10 text-cyan-400";

    case "qualified":
      return "bg-violet-500/10 text-violet-400";

case "follow-up":

  return "bg-amber-500/10 text-amber-400";

    case "converted":
      return "bg-emerald-500/10 text-emerald-400";

    case "lost":
      return "bg-red-500/10 text-red-400";

    default:
      return "bg-zinc-500/10 text-zinc-400";
  }
}
  const markdownComponents = {
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="mb-3 mt-6 text-xl font-bold text-white">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="mb-3 mt-6 text-lg font-semibold text-white">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="mb-2 mt-5 text-base font-semibold text-white">
        {children}
      </h3>
    ),
    p: ({ children }: { children?: ReactNode }) => (
      <p className="mb-3">{children}</p>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="mb-4 ml-5 list-disc space-y-2">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="mb-4 ml-5 list-decimal space-y-2">
        {children}
      </ol>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong className="font-semibold text-white">
        {children}
      </strong>
    ),
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-sm font-medium text-emerald-400">
              Even8
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              Lead Manager
            </h1>

            <p className="mt-3 text-zinc-400">
              Manage and track your event leads in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setEditForm(emptyForm);
              setError("");
            }}
            className="rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-black transition hover:bg-emerald-400"
          >
            {showForm ? "Cancel" : "+ Add Lead"}
          </button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {/* Total Leads */}
  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
    <p className="text-sm text-zinc-400">
      Total Leads
    </p>

    <p className="mt-2 text-3xl font-bold">
      {totalLeads}
    </p>

    <p className="mt-2 text-xs text-zinc-500">
      All leads in your database
    </p>
  </div>

  {/* New Leads */}
  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
    <p className="text-sm text-zinc-400">
      New Leads
    </p>

    <p className="mt-2 text-3xl font-bold text-emerald-400">
      {newLeads}
    </p>

    <p className="mt-2 text-xs text-zinc-500">
      Waiting for first contact
    </p>
  </div>

  {/* Active Pipeline */}
  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
    <p className="text-sm text-zinc-400">
      Active Pipeline
    </p>

    <p className="mt-2 text-3xl font-bold text-emerald-400">
      {activeLeads}
    </p>

    <p className="mt-2 text-xs text-zinc-500">
      Contacted, qualified or follow-up
    </p>
  </div>

  {/* Converted */}
  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
    <p className="text-sm text-zinc-400">
      Converted
    </p>

    <div className="mt-2 flex items-end gap-2">
      <p className="text-3xl font-bold text-emerald-400">
        {convertedLeads}
      </p>

      <span className="mb-1 text-sm text-zinc-500">
        {conversionRate}%
      </span>
    </div>

    <p className="mt-2 text-xs text-zinc-500">
      {lostLeads} lost lead{lostLeads === 1 ? "" : "s"}
    </p>
  </div>
</div>
        {/* Main Even8 AI */}
        <div className="mb-8 rounded-xl border border-emerald-900/50 bg-zinc-900 p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Even8 AI
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                AI Lead Assistant
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                Analyze your leads and generate recommended actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateLeadSummary}
                disabled={aiLoading || leads.length === 0}
                className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate Lead Summary
              </button>

              <button
                type="button"
                onClick={generateNextActions}
                disabled={aiLoading || leads.length === 0}
                className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-500 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Find Next Actions
              </button>
            </div>
          </div>

          {aiLoading && !selectedLead && (
            <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-emerald-400">
                Even8 AI is analyzing your leads...
              </p>
            </div>
          )}

          {!selectedLead && !aiLoading && aiResult && (
            <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="font-medium text-white">
                  {aiTitle}
                </h3>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={copyAIResult}
                    className="text-sm text-emerald-400 transition hover:text-emerald-300"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiResult("");
                      setAiTitle("");
                      setCopied(false);
                    }}
                    className="text-sm text-zinc-500 transition hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="text-sm leading-7 text-zinc-300">
                <ReactMarkdown components={markdownComponents}>
                  {aiResult}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Add Lead Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <h2 className="mb-6 text-xl font-semibold">
              Add New Lead
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Name *
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                  placeholder="Lead name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Company
                </label>

                <input
                  type="text"
                  value={form.company}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      company: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Email *
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Event
                </label>

                <input
                  type="text"
                  value={form.event}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      event: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                  placeholder="Event name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                >
                  <option value="new">New</option>
<option value="contacted">Contacted</option>
<option value="qualified">Qualified</option>
<option value="follow-up">Follow-up</option>
<option value="converted">Converted</option>
<option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Notes
                </label>

                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-5 py-2.5 font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Lead"}
              </button>
            </div>
          </form>
        )}

        {/* Edit Lead Form */}
        {editingId && (
          <form
            onSubmit={handleUpdate}
            className="mb-8 rounded-xl border border-emerald-900/60 bg-zinc-900 p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Edit Lead
              </h2>

              <button
                type="button"
                onClick={cancelEditing}
                className="text-sm text-zinc-400 transition hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Name *
                </label>

                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Company
                </label>

                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      company: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Email *
                </label>

                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Event
                </label>

                <input
                  type="text"
                  value={editForm.event}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      event: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Status
                </label>

                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                >
                  <option value="new">New</option>
<option value="contacted">Contacted</option>
<option value="qualified">Qualified</option>
<option value="follow-up">Follow-up</option>
<option value="converted">Converted</option>
<option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Notes
                </label>

                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-emerald-500"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="rounded-lg border border-zinc-700 px-5 py-2.5 font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-5 py-2.5 font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update Lead"}
              </button>
            </div>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Individual Lead AI Assistant */}
        {selectedLead && (
          <div className="mb-8 rounded-xl border border-emerald-900/50 bg-zinc-900 p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Even8 AI
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  AI Assist — {selectedLead.name}
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  {selectedLead.company || "No company"}
                  {selectedLead.event
                    ? ` • ${selectedLead.event}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedLead(null);
                  setAiResult("");
                  setAiTitle("");
                  setCopied(false);
                }}
                className="text-sm text-zinc-500 transition hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Lead Context */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">
                  Company
                </p>
                <p className="mt-1 text-sm text-zinc-200">
                  {selectedLead.company || "—"}
                </p>
              </div>

              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">
                  Event
                </p>
                <p className="mt-1 text-sm text-zinc-200">
                  {selectedLead.event || "—"}
                </p>
              </div>

              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">
                  Status
                </p>
                <p className="mt-1 text-sm capitalize text-emerald-400">
                  {selectedLead.status}
                </p>
              </div>

              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">
                  Notes
                </p>
                <p className="mt-1 text-sm text-zinc-200">
                  {selectedLead.notes || "—"}
                </p>
              </div>
            </div>

            {/* Individual AI Actions */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={analyzeSelectedLead}
                disabled={aiLoading}
                className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiLoading ? "Analyzing..." : "Analyze Lead"}
              </button>

              <button
                type="button"
                onClick={generateFollowUp}
                disabled={aiLoading}
                className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-500 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiLoading ? "Generating..." : "Draft Follow-up"}
              </button>

              <button
                type="button"
                onClick={generateLeadStrategy}
                disabled={aiLoading}
                className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-500 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiLoading ? "Generating..." : "Suggest Strategy"}
              </button>
            </div>

            {aiLoading && (
              <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-sm text-emerald-400">
                  Even8 AI is analyzing this lead...
                </p>
              </div>
            )}

            {!aiLoading && aiResult && (
              <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="font-medium text-white">
                    {aiTitle}
                  </h3>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={copyAIResult}
                      className="text-sm text-emerald-400 transition hover:text-emerald-300"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAiResult("");
                        setAiTitle("");
                        setCopied(false);
                      }}
                      className="text-sm text-zinc-500 transition hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="text-sm leading-7 text-zinc-300">
                  <ReactMarkdown components={markdownComponents}>
                    {aiResult}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leads */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Leads
            </h2>

            <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
              {filteredLeads.length} of {leads.length} total
            </span>
          </div>

          {/* Search / Filter / Sort */}
          <div className="mb-6 flex flex-col gap-3 lg:flex-row">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, email or event..."
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white outline-none placeholder:text-zinc-500 focus:border-emerald-500"
            />

            <select
  value={statusFilter}
  onChange={(e) =>
    setStatusFilter(e.target.value)
  }
  className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-emerald-500"
>
  <option value="all">All Statuses</option>
  <option value="new">New</option>
  <option value="contacted">Contacted</option>
  <option value="qualified">Qualified</option>
  <option value="follow-up">Follow-up</option>
  <option value="converted">Converted</option>
  <option value="lost">Lost</option>
</select>


            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-white outline-none focus:border-emerald-500"
            >
              <option value="newest">
                Newest First
              </option>
              <option value="oldest">
                Oldest First
              </option>
              <option value="name-asc">
                Name A–Z
              </option>
              <option value="name-desc">
                Name Z–A
              </option>
              <option value="company-asc">
                Company A–Z
              </option>
            </select>
          </div>

          {loading && (
            <p className="text-zinc-400">
              Loading leads...
            </p>
          )}

          {!loading && leads.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-zinc-400">
                No leads yet.
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Add your first lead to get started.
              </p>
            </div>
          )}

          {!loading &&
            leads.length > 0 &&
            filteredLeads.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-zinc-300">
                  No leads match your search or filter.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-3 text-sm text-emerald-400 transition hover:text-emerald-300"
                >
                  Clear search and filters
                </button>
              </div>
            )}

          {!loading && filteredLeads.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800 text-sm text-zinc-400">
                    <th className="pb-3 pr-6 font-medium">
                      Name
                    </th>
                    <th className="pb-3 pr-6 font-medium">
                      Company
                    </th>
                    <th className="pb-3 pr-6 font-medium">
                      Email
                    </th>
                    <th className="pb-3 pr-6 font-medium">
                      Event
                    </th>
                    <th className="pb-3 pr-6 font-medium">
                      Status
                    </th>
                    <th className="pb-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-zinc-800/70"
                    >
                      <td className="py-4 pr-6 font-medium">
                        {lead.name}
                      </td>

                      <td className="py-4 pr-6 text-zinc-300">
                        {lead.company || "—"}
                      </td>

                      <td className="py-4 pr-6 text-zinc-300">
                        {lead.email || "—"}
                      </td>

                      <td className="py-4 pr-6 text-zinc-300">
                        {lead.event || "—"}
                      </td>

                      <td className="py-4 pr-6">
                        <span
  className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBadge(
    lead.status
  )}`}
>
  {lead.status
    .replace("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())}
</span>
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {/* AI Star Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLead(lead);
                              setAiResult("");
                              setAiTitle("");
                              setCopied(false);
                              setError("");
                            }}
                            disabled={deletingId === lead.id}
                            title="AI Assist"
                            aria-label={`AI Assist for ${lead.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-900/70 text-emerald-400 transition hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              aria-hidden="true"
                            >
                              <path
                                d="M12 3L13.4 7.1C13.8 8.3 14.7 9.2 15.9 9.6L20 11L15.9 12.4C14.7 12.8 13.8 13.7 13.4 14.9L12 19L10.6 14.9C10.2 13.7 9.3 12.8 8.1 12.4L4 11L8.1 9.6C9.3 9.2 10.2 8.3 10.6 7.1L12 3Z"
                                fill="currentColor"
                              />
                              <path
                                d="M19 3L19.5 4.5L21 5L19.5 5.5L19 7L18.5 5.5L17 5L18.5 4.5L19 3Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              startEditing(lead)
                            }
                            disabled={
                              deletingId === lead.id
                            }
                            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(lead)
                            }
                            disabled={
                              deletingId === lead.id
                            }
                            className="rounded-md border border-red-900/70 px-3 py-1.5 text-sm text-red-400 transition hover:border-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === lead.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}