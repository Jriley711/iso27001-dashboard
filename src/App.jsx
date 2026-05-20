import React, { useEffect, useMemo, useState } from "react";
import { buildAnnexAControls } from "./iso27001AnnexA2022";
import { buildISMSRequirements } from "./iso27001Clauses4to10";

/**
 * Full ISMS Tracker:
 * - ISO 27001 Clauses 4–10 (requirements) + Annex A (93 controls). [1](https://bastion.tech/learn/iso27001/iso-27001-requirements)[2](https://www.glocertinternational.com/resources/articles/iso-27001-requirements-overview/)[3](https://bastion.tech/learn/iso27001/annex-a-controls)[4](https://seccomply.net/resources/blog/iso-27001-annex-a-controls)
 * - Edit test procedures and evidence requests in-app
 * - Local persistence + JSON import/export
 */

const DOMAIN_META = {
  "Organisational Controls": { color: "#6366f1" },
  "People Controls": { color: "#0891b2" },
  "Physical Controls": { color: "#d97706" },
  "Technological Controls": { color: "#16a34a" },
};

const STATUS_META = {
  Passed: { color: "#22c55e", bg: "#052e1a", border: "#14532d", icon: "✓" },
  "In Progress": { color: "#f59e0b", bg: "#2a1d06", border: "#7c5c12", icon: "◑" },
  "Not Started": { color: "#94a3b8", bg: "#0b1220", border: "#1e293b", icon: "○" },
  Failed: { color: "#ef4444", bg: "#2a0b0b", border: "#7f1d1d", icon: "✗" },
  "Ready for Review": { color: "#38bdf8", bg: "#062033", border: "#0ea5e9", icon: "🛈" },
};

const PRIORITY_META = {
  Critical: { color: "#ef4444", bg: "#2a0b0b", border: "#7f1d1d" },
  High: { color: "#f59e0b", bg: "#2a1d06", border: "#7c5c12" },
  Medium: { color: "#22c55e", bg: "#052e1a", border: "#14532d" },
  Low: { color: "#94a3b8", bg: "#0b1220", border: "#1e293b" },
};

const LS_KEY = "gt_iso27001_full_isms_tracker_v2";

const safeArray = (x) => (Array.isArray(x) ? x : []);

function Chip({ label, color = "#e2e8f0", bg = "#0b1220", border = "#1e293b" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: bg,
        border: `1px solid ${border}`,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function Progress({ value, total, color = "#22c55e" }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 999,
          background: "#0b1220",
          border: "1px solid #1e293b",
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
      <span
        style={{
          width: 42,
          textAlign: "right",
          color: "#94a3b8",
          fontFamily: "ui-monospace",
          fontSize: 12,
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function IconButton({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        border: "1px solid #1e293b",
        background: "#0b1220",
        color: "#e2e8f0",
        borderRadius: 10,
        padding: "6px 10px",
        fontWeight: 900,
      }}
    >
      {children}
    </button>
  );
}

function TextInput({ value, onChange, placeholder, style }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 10px",
        borderRadius: 10,
        background: "#0b1220",
        border: "1px solid #1e293b",
        color: "#e2e8f0",
        ...style,
      }}
    />
  );
}

function TextArea({ value, onChange, placeholder, style }) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        minHeight: 90,
        padding: "10px 10px",
        borderRadius: 10,
        background: "#0b1220",
        border: "1px solid #1e293b",
        color: "#e2e8f0",
        resize: "vertical",
        ...style,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
EDITABLE LISTS
───────────────────────────────────────────── */
function EditableTestSteps({ steps, onUpdate }) {
  const list = safeArray(steps);

  function updateStep(idx, text) {
    const next = list.slice();
    next[idx] = text;
    onUpdate(next);
  }

  function addStep() {
    onUpdate([...list, ""]);
  }

  function removeStep(idx) {
    const next = list.slice();
    next.splice(idx, 1);
    onUpdate(next);
  }

  function move(idx, dir) {
    const next = list.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    onUpdate(next);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {list.map((s, idx) => (
        <div
          key={idx}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            alignItems: "start",
            padding: 10,
            borderRadius: 12,
            border: "1px solid #1e293b",
            background: "#0b1220",
          }}
        >
          <TextArea
            value={s}
            onChange={(v) => updateStep(idx, v)}
            placeholder={`Step ${idx + 1}…`}
            style={{ minHeight: 70 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <IconButton title="Move up" onClick={() => move(idx, -1)}>↑</IconButton>
            <IconButton title="Move down" onClick={() => move(idx, 1)}>↓</IconButton>
            <IconButton title="Remove" onClick={() => removeStep(idx)}>✕</IconButton>
          </div>
        </div>
      ))}

      <div>
        <IconButton title="Add test step" onClick={addStep}>+ Add Step</IconButton>
      </div>
    </div>
  );
}

function EditableEvidenceRequests({ evidence, onUpdate, idPrefix }) {
  const list = safeArray(evidence);

  function patchItem(idx, patch) {
    const next = list.slice();
    next[idx] = { ...next[idx], ...patch };
    onUpdate(next);
  }

  function addEvidence() {
    const newId = `${idPrefix}-${Date.now().toString(36)}`;
    onUpdate([
      ...list,
      { id: newId, description: "", exampleFileName: "", format: "", collected: false },
    ]);
  }

  function removeEvidence(idx) {
    const next = list.slice();
    next.splice(idx, 1);
    onUpdate(next);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {list.map((e, idx) => (
        <div
          key={e.id || idx}
          style={{
            border: "1px solid #1e293b",
            background: "#0b1220",
            borderRadius: 12,
            padding: 12,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <Chip label={e.id || "ER-NEW"} color="#94a3b8" bg="#0f172a" border="#1e293b" />
            <div style={{ display: "flex", gap: 8 }}>
              <IconButton title="Remove request" onClick={() => removeEvidence(idx)}>✕</IconButton>
            </div>
          </div>

          <TextInput
            value={e.description || ""}
            onChange={(v) => patchItem(idx, { description: v })}
            placeholder="Evidence request description…"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 140px", gap: 10 }}>
            <TextInput
              value={e.exampleFileName || ""}
              onChange={(v) => patchItem(idx, { exampleFileName: v })}
              placeholder="Example file name"
            />
            <TextInput
              value={e.format || ""}
              onChange={(v) => patchItem(idx, { format: v })}
              placeholder="Format (PDF/CSV…)"
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #1e293b",
                background: e.collected ? "#052e1a" : "#0b1220",
                color: "#e2e8f0",
                fontWeight: 800,
                cursor: "pointer",
              }}
              title="Mark collected"
            >
              <input
                type="checkbox"
                checked={!!e.collected}
                onChange={(ev) => patchItem(idx, { collected: ev.target.checked })}
              />
              Collected
            </label>
          </div>

          <TextArea
            value={e.internalNotes || ""}
            onChange={(v) => patchItem(idx, { internalNotes: v })}
            placeholder="Internal notes for this evidence request (optional)…"
            style={{ minHeight: 70 }}
          />
        </div>
      ))}

      <div>
        <IconButton title="Add evidence request" onClick={addEvidence}>+ Add Evidence Request</IconButton>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
CARD (applies to both Controls and Requirements)
───────────────────────────────────────────── */
function ItemCard({ item, onPatch }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("overview"); // overview | test | evidence

  const sm = STATUS_META[item.status] || STATUS_META["Not Started"];
  const pm = PRIORITY_META[item.priority] || PRIORITY_META.Medium;

  const evidence = safeArray(item.evidenceRequests);
  const totalEv = evidence.length;
  const doneEv = evidence.filter((x) => !!x.collected).length;

  return (
    <div
      style={{
        background: "#0b1220",
        border: "1px solid #1e293b",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: open ? "0 12px 40px rgba(0,0,0,0.35)" : "0 3px 12px rgba(0,0,0,0.20)",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 14px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Chip
          label={item.id}
          color={(DOMAIN_META[item.domain]?.color) || "#94a3b8"}
          bg="#0f172a"
          border="#1e293b"
        />

        <div style={{ flex: 1 }}>
          <div style={{ color: "#e2e8f0", fontWeight: 900, fontSize: 14 }}>
            {item.title}
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip label={item.domain} color="#94a3b8" bg="#0f172a" border="#1e293b" />
            <Chip label={`Owner: ${item.owner || "—"}`} color="#94a3b8" bg="#0f172a" border="#1e293b" />
            <Chip label={`Freq: ${item.frequency || "—"}`} color="#94a3b8" bg="#0f172a" border="#1e293b" />
            <Chip label={`${doneEv}/${totalEv} evidence`} color={doneEv === totalEv && totalEv > 0 ? "#22c55e" : "#94a3b8"} bg="#0f172a" border="#1e293b" />
            <Chip label={`${item.priority || "Medium"} priority`} color={pm.color} bg={pm.bg} border={pm.border} />
          </div>
        </div>

        <Chip label={`${sm.icon} ${item.status}`} color={sm.color} bg={sm.bg} border={sm.border} />
        <div style={{ color: "#94a3b8", fontSize: 16 }}>{open ? "▾" : "▸"}</div>
      </div>

      {!open && doneEv > 0 && (
        <div style={{ padding: "0 14px 14px" }}>
          <Progress value={doneEv} total={totalEv} color="#22c55e" />
        </div>
      )}

      {open && (
        <div style={{ borderTop: "1px solid #111827", padding: 14, display: "grid", gap: 14 }}>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              ["overview", "Overview"],
              ["test", "Test Procedure"],
              ["evidence", "Evidence Requests"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={(e) => { e.stopPropagation(); setTab(k); }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: "1px solid #1e293b",
                  background: tab === k ? "#0f172a" : "#0b1220",
                  color: tab === k ? "#e2e8f0" : "#94a3b8",
                  fontWeight: 900,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
              <div style={{ border: "1px solid #1e293b", background: "#0f172a", borderRadius: 12, padding: 12 }}>
                <div style={sectionLabel()}>Objective</div>
                <TextArea
                  value={item.objective || ""}
                  onChange={(v) => onPatch({ objective: v })}
                  placeholder="Objective / intent…"
                  style={{ minHeight: 90 }}
                />
              </div>

              <div style={{ border: "1px solid #1e293b", background: "#0f172a", borderRadius: 12, padding: 12 }}>
                <div style={sectionLabel()}>Status</div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.keys(STATUS_META).map((s) => {
                    const meta = STATUS_META[s];
                    const active = item.status === s;
                    return (
                      <button
                        key={s}
                        onClick={(e) => { e.stopPropagation(); onPatch({ status: s }); }}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 999,
                          border: `1px solid ${active ? meta.border : "#1e293b"}`,
                          background: active ? meta.bg : "#0b1220",
                          color: active ? meta.color : "#94a3b8",
                          fontWeight: 900,
                          fontSize: 12,
                        }}
                      >
                        {meta.icon} {s}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 14, ...sectionLabel() }}>Internal Notes</div>
                <TextArea
                  value={item.notes || ""}
                  onChange={(v) => onPatch({ notes: v })}
                  placeholder="Internal notes, gaps, remediation plan…"
                  style={{ minHeight: 110 }}
                />
              </div>
            </div>
          )}

          {/* Test Procedure tab (EDITABLE) */}
          {tab === "test" && (
            <div style={{ border: "1px solid #1e293b", background: "#0f172a", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={sectionLabel()}>Test Procedure (editable)</div>
                <Chip
                  label={`${safeArray(item.testSteps).length} step(s)`}
                  color="#94a3b8"
                  bg="#0b1220"
                  border="#1e293b"
                />
              </div>
              <EditableTestSteps
                steps={item.testSteps}
                onUpdate={(next) => onPatch({ testSteps: next })}
              />
            </div>
          )}

          {/* Evidence tab (EDITABLE) */}
          {tab === "evidence" && (
            <div style={{ border: "1px solid #1e293b", background: "#0f172a", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={sectionLabel()}>Evidence Requests (editable)</div>
                <div style={{ width: 260 }}>
                  <Progress value={doneEv} total={totalEv} color="#22c55e" />
                </div>
              </div>
              <EditableEvidenceRequests
                evidence={item.evidenceRequests}
                idPrefix={`ER-${item.id.replaceAll(".", "")}`}
                onUpdate={(next) => onPatch({ evidenceRequests: next })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function sectionLabel() {
  return {
    color: "#94a3b8",
    fontWeight: 900,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  };
}

/* ─────────────────────────────────────────────
MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [activeView, setActiveView] = useState("annexA"); // annexA | isms | overview
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [annexA, setAnnexA] = useState(buildAnnexAControls());
  const [ismsReqs, setIsmsReqs] = useState(buildISMSRequirements());

  // Load saved state
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.annexA) setAnnexA(parsed.annexA);
      if (parsed?.ismsReqs) setIsmsReqs(parsed.ismsReqs);
    } catch {
      // ignore
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ annexA, ismsReqs }));
  }, [annexA, ismsReqs]);

  // helpers
  function patchAnnexA(id, patch) {
    setAnnexA((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function patchISMS(id, patch) {
    setIsmsReqs((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ annexA, ismsReqs }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "iso27001-full-isms-tracker-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJSON(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed?.annexA || !parsed?.ismsReqs) {
      throw new Error("Invalid file: expected { annexA, ismsReqs }");
    }
    setAnnexA(parsed.annexA);
    setIsmsReqs(parsed.ismsReqs);
  }

  const activeItems = activeView === "isms" ? ismsReqs : annexA;

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeItems.filter((c) => {
      if (domainFilter !== "ALL" && c.domain !== domainFilter) return false;
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && c.priority !== priorityFilter) return false;

      if (!q) return true;
      return (
        (c.id || "").toLowerCase().includes(q) ||
        (c.title || "").toLowerCase().includes(q) ||
        (c.domain || "").toLowerCase().includes(q) ||
        (c.owner || "").toLowerCase().includes(q)
      );
    });
  }, [activeItems, search, domainFilter, statusFilter, priorityFilter]);

  const overviewStats = useMemo(() => {
    const all = [...annexA, ...ismsReqs];
    const total = all.length;
    const passed = all.filter((x) => x.status === "Passed").length;
    const inProgress = all.filter((x) => x.status === "In Progress").length;
    const notStarted = all.filter((x) => x.status === "Not Started").length;
    const failed = all.filter((x) => x.status === "Failed").length;

    const totalEvidence = all.reduce((s, x) => s + safeArray(x.evidenceRequests).length, 0);
    const collectedEvidence = all.reduce(
      (s, x) => s + safeArray(x.evidenceRequests).filter((e) => !!e.collected).length,
      0
    );

    return { total, passed, inProgress, notStarted, failed, totalEvidence, collectedEvidence };
  }, [annexA, ismsReqs]);

  const domainOptions = useMemo(() => {
    const domains = [...new Set(activeItems.map((x) => x.domain))].sort();
    return ["ALL", ...domains];
  }, [activeItems]);

  const statusOptions = ["ALL", ...Object.keys(STATUS_META)];
  const priorityOptions = ["ALL", ...Object.keys(PRIORITY_META)];

  return (
    <div style={{ minHeight: "100vh", background: "#0c111d", color: "#e2e8f0" }}>
      <style>{`
        * { box-sizing: border-box; }
        button { cursor: pointer; }
        input::placeholder, textarea::placeholder { color: #64748b; }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 18px" }}>
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#0c111d",
            paddingBottom: 12,
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1 0%, #0891b2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
              }}
            >
              ISO
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>
                ISO 27001 — Full ISMS Tracker (Clauses 4–10 + Annex A)
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                Mock/illustrative. Keep data internal; use placeholders for demos.
              </div>
            </div>

            <button onClick={() => setActiveView("annexA")} style={navBtn(activeView === "annexA")}>
              Annex A Controls
            </button>
            <button onClick={() => setActiveView("isms")} style={navBtn(activeView === "isms")}>
              ISMS Requirements
            </button>
            <button onClick={() => setActiveView("overview")} style={navBtn(activeView === "overview")}>
              Overview
            </button>

            <button onClick={exportJSON} style={solidBtn()}>
              Export JSON
            </button>

            <label style={solidBtn(true)}>
              Import JSON
              <input
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  importJSON(f).catch((err) => alert(err.message));
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {/* Search + filters (not on overview) */}
          {activeView !== "overview" && (
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search (id, title, domain, owner)…"
                style={{
                  flex: "1 1 260px",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #1e293b",
                  background: "#0b1220",
                  color: "#e2e8f0",
                }}
              />

              <SelectFilter label="Domain" value={domainFilter} setValue={setDomainFilter} options={domainOptions} />
              <SelectFilter label="Status" value={statusFilter} setValue={setStatusFilter} options={statusOptions} />
              <SelectFilter label="Priority" value={priorityFilter} setValue={setPriorityFilter} options={priorityOptions} />
            </div>
          )}
        </div>

        {/* OVERVIEW */}
        {activeView === "overview" && (
          <div style={{ paddingTop: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
              <StatCard label="Total Items" value={overviewStats.total} />
              <StatCard label="Passed" value={overviewStats.passed} />
              <StatCard label="In Progress" value={overviewStats.inProgress} />
              <StatCard label="Not Started" value={overviewStats.notStarted} />
              <StatCard label="Failed" value={overviewStats.failed} />
              <StatCard
                label="Evidence Collected"
                value={`${overviewStats.collectedEvidence}/${overviewStats.totalEvidence}`}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                background: "#0b1220",
                border: "1px solid #1e293b",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 950, marginBottom: 10 }}>Summary</div>
              <div style={{ color: "#94a3b8", lineHeight: 1.6 }}>
                This tracker includes ISO 27001 Clauses 4–10 (mandatory ISMS requirements) and Annex A controls (93 controls across A.5–A.8). [1](https://bastion.tech/learn/iso27001/iso-27001-requirements)[2](https://www.glocertinternational.com/resources/articles/iso-27001-requirements-overview/)[3](https://bastion.tech/learn/iso27001/annex-a-controls)[4](https://seccomply.net/resources/blog/iso-27001-annex-a-controls)
                Use mock data for demos; keep engagement artifacts internal.
              </div>
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {activeView !== "overview" && (
          <div style={{ paddingTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ color: "#94a3b8", fontFamily: "ui-monospace" }}>
                Showing {filteredItems.length} of {activeItems.length}
              </div>
              <div style={{ color: "#94a3b8", fontFamily: "ui-monospace" }}>
                Tip: Use “Test Procedure” and “Evidence Requests” tabs to edit in-app.
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {filteredItems.map((item) => (
                <ItemCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onPatch={(patch) => {
                    if (activeView === "isms") patchISMS(item.id, patch);
                    else patchAnnexA(item.id, patch);
                  }}
                />
              ))}

              {filteredItems.length === 0 && (
                <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>
                  No items match your filters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 28,
            padding: 14,
            borderRadius: 14,
            border: "1px solid #1e293b",
            background: "#0b1220",
            color: "#94a3b8",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#cbd5e1" }}>Disclaimer:</strong> Mock/illustrative tracker. Do not input client confidential data
          into public deployments. Prefer internal storage/import-export workflows for demos.
        </div>
      </div>
    </div>
  );
}

function SelectFilter({ label, value, setValue, options }) {
  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #1e293b",
        background: "#0b1220",
        color: "#e2e8f0",
        fontWeight: 900,
      }}
      title={label}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {label}: {o}
        </option>
      ))}
    </select>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#0b1220",
        border: "1px solid #1e293b",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div style={{ fontFamily: "ui-monospace", fontWeight: 950, fontSize: 28 }}>{value}</div>
      <div
        style={{
          color: "#94a3b8",
          fontWeight: 900,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function navBtn(active) {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #1e293b",
    background: active ? "#0b1220" : "transparent",
    color: active ? "#e2e8f0" : "#94a3b8",
    fontWeight: 950,
  };
}

function solidBtn(isLabel = false) {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #1e293b",
    background: "#0b1220",
    color: "#e2e8f0",
    fontWeight: 950,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}
