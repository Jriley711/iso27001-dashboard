import React, { useEffect, useMemo, useState } from "react";
import { buildAnnexAControls } from "./iso27001AnnexA2022";
import { buildISMSRequirements } from "./iso27001Clauses4to10";

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

// Per your request: High / Medium / Low only
const PRIORITY_META = {
  High: { color: "#f59e0b", bg: "#2a1d06", border: "#7c5c12" },
  Medium: { color: "#22c55e", bg: "#052e1a", border: "#14532d" },
  Low: { color: "#94a3b8", bg: "#0b1220", border: "#1e293b" },
};

const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

const LS_KEY = "gt_iso27001_full_isms_tracker_v3";

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
      <span style={{ width: 42, textAlign: "right", color: "#94a3b8", fontFamily: "ui-monospace", fontSize: 12 }}>
        {pct}%
      </span>
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

function IconButton({ children, onClick, title, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        border: "1px solid #1e293b",
        background: disabled ? "#0a0f1a" : "#0b1220",
        color: disabled ? "#475569" : "#e2e8f0",
        borderRadius: 10,
        padding: "6px 10px",
        fontWeight: 900,
        opacity: disabled ? 0.7 : 1,
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
SVG PIE CHART (no dependencies)
───────────────────────────────────────────── */
function PieChart({ title, data, size = 180 }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  const r = size / 2;
  const cx = r;
  const cy = r;

  let startAngle = -Math.PI / 2;

  function arcPath(start, end) {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  return (
    <div style={{ border: "1px solid #1e293b", background: "#0b1220", borderRadius: 16, padding: 14 }}>
      <div style={{ fontWeight: 950, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {data.map((d, i) => {
            const value = d.value || 0;
            const angle = (value / total) * Math.PI * 2;
            const endAngle = startAngle + angle;

            const path = arcPath(startAngle, endAngle);
            startAngle = endAngle;

            return <path key={i} d={path} fill={d.color} stroke="#0c111d" strokeWidth="2" />;
          })}
        </svg>

        <div style={{ display: "grid", gap: 8 }}>
          {data.map((d, i) => {
            const pct = Math.round(((d.value || 0) / total) * 100);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                  <div style={{ color: "#e2e8f0", fontWeight: 800 }}>{d.label}</div>
                </div>
                <div style={{ color: "#94a3b8", fontFamily: "ui-monospace" }}>
                  {d.value} ({pct}%)
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 6, color: "#64748b", fontFamily: "ui-monospace" }}>Total: {total}</div>
        </div>
      </div>
    </div>
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
          <TextArea value={s} onChange={(v) => updateStep(idx, v)} placeholder={`Step ${idx + 1}…`} style={{ minHeight: 70 }} />
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
    onUpdate([...list, { id: newId, description: "", exampleFileName: "", format: "", collected: false, internalNotes: "" }]);
  }

  function removeEvidence(idx) {
    const next = list.slice();
    next.splice(idx, 1);
    onUpdate(next);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {list.map((e, idx) => (
        <div key={e.id || idx} style={{ border: "1px solid #1e293b", background: "#0b1220", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <Chip label={e.id || "ER-NEW"} color="#94a3b8" bg="#0f172a" border="#1e293b" />
            <IconButton title="Remove request" onClick={() => removeEvidence(idx)}>✕</IconButton>
          </div>

          <TextInput value={e.description || ""} onChange={(v) => patchItem(idx, { description: v })} placeholder="Evidence request description…" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 140px", gap: 10 }}>
            <TextInput value={e.exampleFileName || ""} onChange={(v) => patchItem(idx, { exampleFileName: v })} placeholder="Example file name" />
            <TextInput value={e.format || ""} onChange={(v) => patchItem(idx, { format: v })} placeholder="Format (PDF/CSV…)" />
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
                fontWeight: 900,
                cursor: "pointer",
              }}
              title="Mark collected"
            >
              <input type="checkbox" checked={!!e.collected} onChange={(ev) => patchItem(idx, { collected: ev.target.checked })} />
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
SIGNOFFS (NEW)
───────────────────────────────────────────── */
function SignoffsEditor({ signoffs, onUpdate }) {
  const list = safeArray(signoffs);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Reviewer");

  function addSignoff() {
    const n = name.trim();
    if (!n) return alert("Enter reviewer name before signing off.");
    const entry = {
      id: `SO-${Date.now().toString(36)}`,
      name: n,
      role: role.trim() || "Reviewer",
      at: new Date().toISOString(),
    };
    onUpdate([...list, entry]);
    setName("");
    setRole("Reviewer");
  }

  function removeSignoff(id) {
    onUpdate(list.filter((s) => s.id !== id));
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px auto", gap: 10, alignItems: "center" }}>
        <TextInput value={name} onChange={setName} placeholder="Reviewer name (e.g., Kyle Harrison)" />
        <TextInput value={role} onChange={setRole} placeholder="Role (Reviewer/Lead/Partner)" />
        <IconButton title="Add sign-off" onClick={addSignoff}>+ Sign Off</IconButton>
      </div>

      <div style={{ border: "1px solid #1e293b", background: "#0b1220", borderRadius: 12, padding: 12 }}>
        <div style={{ ...sectionLabel(), marginBottom: 10 }}>Sign-offs</div>
        {list.length === 0 ? (
          <div style={{ color: "#94a3b8" }}>
            No sign-offs yet. At least one sign-off is required before setting status to <b>Passed</b>.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {list.map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", border: "1px solid #1e293b", background: "#0f172a", padding: 10, borderRadius: 12 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontWeight: 900, color: "#e2e8f0" }}>{s.name} <span style={{ color: "#94a3b8", fontWeight: 800 }}>— {s.role}</span></div>
                  <div style={{ color: "#94a3b8", fontFamily: "ui-monospace", fontSize: 12 }}>
                    {new Date(s.at).toLocaleString()}
                  </div>
                </div>
                <IconButton title="Remove sign-off" onClick={() => removeSignoff(s.id)}>✕</IconButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
CARD
───────────────────────────────────────────── */
function ItemCard({ item, onPatch }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("overview"); // overview | test | evidence | signoffs

  const signoffs = safeArray(item.signoffs);
  const hasSignoff = signoffs.length > 0;

  const sm = STATUS_META[item.status] || STATUS_META["Not Started"];
  const pm = PRIORITY_META[item.priority] || PRIORITY_META.Medium;

  const evidence = safeArray(item.evidenceRequests);
  const totalEv = evidence.length;
  const doneEv = evidence.filter((x) => !!x.collected).length;

  function setStatusWithRule(nextStatus) {
    if (nextStatus === "Passed" && !hasSignoff) {
      alert("Cannot set to Passed until at least one reviewer sign-off is recorded.");
      return;
    }
    onPatch({ status: nextStatus });
  }

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
      <div onClick={() => setOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", cursor: "pointer", userSelect: "none" }}>
        <Chip label={item.id} color={(DOMAIN_META[item.domain]?.color) || "#94a3b8"} bg="#0f172a" border="#1e293b" />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#e2e8f0", fontWeight: 950, fontSize: 14 }}>{item.title}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip label={item.domain} color="#94a3b8" bg="#0f172a" border="#1e293b" />
            <Chip label={`Owner: ${item.owner || "—"}`} color="#94a3b8" bg="#0f172a" border="#1e293b" />
            <Chip label={`Freq: ${item.frequency || "—"}`} color="#94a3b8" bg="#0f172a" border="#1e293b" />
            <Chip label={`${doneEv}/${totalEv} evidence`} color={doneEv === totalEv && totalEv > 0 ? "#22c55e" : "#94a3b8"} bg="#0f172a" border="#1e293b" />
            <Chip label={`${item.priority || "Medium"} priority`} color={pm.color} bg={pm.bg} border={pm.border} />
            <Chip label={hasSignoff ? "Sign-off: ✓" : "Sign-off required"} color={hasSignoff ? "#22c55e" : "#f59e0b"} bg="#0f172a" border="#1e293b" />
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
              ["signoffs", "Sign-offs"],
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
                  fontWeight: 950,
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
                <TextArea value={item.objective || ""} onChange={(v) => onPatch({ objective: v })} placeholder="Objective / intent…" style={{ minHeight: 90 }} />
              </div>

              <div style={{ border: "1px solid #1e293b", background: "#0f172a", borderRadius: 12, padding: 12 }}>
                <div style={sectionLabel()}>Meta</div>

                {/* ✅ Priority editable */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ ...sectionLabel(), fontSize: 10, marginBottom: 6 }}>Priority</div>
                  <select
                    value={PRIORITY_OPTIONS.includes(item.priority) ? item.priority : "Medium"}
                    onChange={(e) => onPatch({ priority: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #1e293b",
                      background: "#0b1220",
                      color: "#e2e8f0",
                      fontWeight: 900,
                    }}
                  >
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* ✅ Owner editable */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ ...sectionLabel(), fontSize: 10, marginBottom: 6 }}>Owner</div>
                  <TextInput value={item.owner || ""} onChange={(v) => onPatch({ owner: v })} placeholder="Owner (e.g., CISO / HR / IT Security)" />
                </div>

                {/* ✅ Frequency editable */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ ...sectionLabel(), fontSize: 10, marginBottom: 6 }}>Frequency</div>
                  <TextInput value={item.frequency || ""} onChange={(v) => onPatch({ frequency: v })} placeholder="Frequency (e.g., Annual / Quarterly / Ongoing)" />
                </div>

                {/* ✅ Status with sign-off rule */}
                <div style={{ marginTop: 14, ...sectionLabel() }}>Status</div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.keys(STATUS_META).map((s) => {
                    const meta = STATUS_META[s];
                    const active = item.status === s;
                    const blocked = s === "Passed" && !hasSignoff;
                    return (
                      <button
                        key={s}
                        onClick={(e) => { e.stopPropagation(); blocked ? alert("Add at least one sign-off to mark as Passed.") : setStatusWithRule(s); }}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 999,
                          border: `1px solid ${active ? meta.border : "#1e293b"}`,
                          background: active ? meta.bg : "#0b1220",
                          color: active ? meta.color : (blocked ? "#475569" : "#94a3b8"),
                          fontWeight: 950,
                          fontSize: 12,
                          opacity: blocked ? 0.7 : 1,
                        }}
                        title={blocked ? "Requires sign-off before passing" : ""}
                      >
                        {meta.icon} {s}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 14, ...sectionLabel() }}>Internal Notes</div>
                <TextArea value={item.notes || ""} onChange={(v) => onPatch({ notes: v })} placeholder="Internal notes, gaps, remediation plan…" style={{ minHeight: 110 }} />
              </div>
            </div>
          )}

          {/* Test Procedure tab */}
          {tab === "test" && (
            <div style={{ border: "1px solid #1e293b", background: "#0f172a", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={sectionLabel()}>Test Procedure (editable)</div>
                <Chip label={`${safeArray(item.testSteps).length} step(s)`} color="#94a3b8" bg="#0b1220" border="#1e293b" />
              </div>
              <EditableTestSteps steps={item.testSteps} onUpdate={(next) => onPatch({ testSteps: next })} />
            </div>
          )}

          {/* Evidence tab */}
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

          {/* ✅ Sign-offs tab */}
          {tab === "signoffs" && (
            <div style={{ border: "1px solid #1e293b", background: "#0f172a", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={sectionLabel()}>Reviewer Sign-offs</div>
                <Chip label={hasSignoff ? `${signoffs.length} recorded` : "Required for Passed"} color={hasSignoff ? "#22c55e" : "#f59e0b"} bg="#0b1220" border="#1e293b" />
              </div>
              <SignoffsEditor signoffs={item.signoffs} onUpdate={(next) => onPatch({ signoffs: next })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
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

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.annexA) setAnnexA(parsed.annexA);
      if (parsed?.ismsReqs) setIsmsReqs(parsed.ismsReqs);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ annexA, ismsReqs }));
  }, [annexA, ismsReqs]);

  function patchAnnexA(id, patch) {
    setAnnexA((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function patchISMS(id, patch) {
    setIsmsReqs((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ annexA, ismsReqs }, null, 2)], { type: "application/json" });
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
    if (!parsed?.annexA || !parsed?.ismsReqs) throw new Error("Invalid file: expected { annexA, ismsReqs }");
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
    const statusCounts = Object.keys(STATUS_META).reduce((acc, k) => ({ ...acc, [k]: 0 }), {});
    all.forEach((x) => { statusCounts[x.status] = (statusCounts[x.status] || 0) + 1; });

    const totalEvidence = all.reduce((s, x) => s + safeArray(x.evidenceRequests).length, 0);
    const collectedEvidence = all.reduce((s, x) => s + safeArray(x.evidenceRequests).filter((e) => !!e.collected).length, 0);
    const remainingEvidence = Math.max(0, totalEvidence - collectedEvidence);

    return { totalItems: all.length, statusCounts, totalEvidence, collectedEvidence, remainingEvidence };
  }, [annexA, ismsReqs]);

  const domainOptions = useMemo(() => {
    const domains = [...new Set(activeItems.map((x) => x.domain))].sort();
    return ["ALL", ...domains];
  }, [activeItems]);

  const statusOptions = ["ALL", ...Object.keys(STATUS_META)];
  const priorityOptions = ["ALL", ...PRIORITY_OPTIONS];

  // Pie data (status)
  const statusPie = useMemo(() => {
    const colors = {
      "Passed": "#22c55e",
      "In Progress": "#f59e0b",
      "Not Started": "#94a3b8",
      "Ready for Review": "#38bdf8",
      "Failed": "#ef4444",
    };
    return Object.keys(STATUS_META).map((k) => ({
      label: k,
      value: overviewStats.statusCounts[k] || 0,
      color: colors[k] || "#64748b",
    })).filter(d => d.value > 0);
  }, [overviewStats]);

  // Pie data (evidence collected vs remaining)
  const evidencePie = useMemo(() => ([
    { label: "Collected", value: overviewStats.collectedEvidence, color: "#22c55e" },
    { label: "Remaining", value: overviewStats.remainingEvidence, color: "#94a3b8" },
  ]), [overviewStats]);

  return (
    <div style={{ minHeight: "100vh", background: "#0c111d", color: "#e2e8f0" }}>
      <style>{`
        * { box-sizing: border-box; }
        button { cursor: pointer; }
        input::placeholder, textarea::placeholder { color: #64748b; }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 18px" }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#0c111d", paddingBottom: 12, borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, #6366f1 0%, #0891b2 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 950 }}>
              ISO
            </div>

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 950, fontSize: 16 }}>ISO 27001 — Full ISMS Tracker</div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>Clauses 4–10 + Annex A; editable procedures, evidence, and sign-offs.</div>
            </div>

            <button onClick={() => setActiveView("annexA")} style={navBtn(activeView === "annexA")}>Annex A Controls</button>
            <button onClick={() => setActiveView("isms")} style={navBtn(activeView === "isms")}>ISMS Requirements</button>
            <button onClick={() => setActiveView("overview")} style={navBtn(activeView === "overview")}>Overview</button>

            <button onClick={exportJSON} style={solidBtn()}>Export JSON</button>

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

          {activeView !== "overview" && (
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search (id, title, domain, owner)…"
                style={{ flex: "1 1 260px", padding: "10px 12px", borderRadius: 12, border: "1px solid #1e293b", background: "#0b1220", color: "#e2e8f0" }}
              />
              <SelectFilter label="Domain" value={domainFilter} setValue={setDomainFilter} options={domainOptions} />
              <SelectFilter label="Status" value={statusFilter} setValue={setStatusFilter} options={statusOptions} />
              <SelectFilter label="Priority" value={priorityFilter} setValue={setPriorityFilter} options={priorityOptions} />
            </div>
          )}
        </div>

        {/* OVERVIEW */}
        {activeView === "overview" && (
          <div style={{ paddingTop: 18, display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
              <StatCard label="Total Items" value={overviewStats.totalItems} />
              <StatCard label="Evidence Collected" value={`${overviewStats.collectedEvidence}/${overviewStats.totalEvidence}`} />
            </div>

            {/* ✅ Two pie charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <PieChart title="Status Distribution" data={statusPie.length ? statusPie : [{ label: "No data", value: 1, color: "#334155" }]} />
              <PieChart title="Evidence Collection" data={evidencePie} />
            </div>

            <div style={{ border: "1px solid #1e293b", background: "#0b1220", borderRadius: 16, padding: 14 }}>
              <div style={{ fontWeight: 950, marginBottom: 10 }}>Rule: Sign-off required for Passed</div>
              <div style={{ color: "#94a3b8", lineHeight: 1.6 }}>
                Controls/requirements cannot be marked <b>Passed</b> until at least one reviewer sign-off is recorded in the Sign-offs tab.
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
                Edit Priority/Owner/Frequency in the Overview tab inside each card.
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

        <div style={{ marginTop: 28, padding: 14, borderRadius: 14, border: "1px solid #1e293b", background: "#0b1220", color: "#94a3b8", lineHeight: 1.6 }}>
          <strong style={{ color: "#cbd5e1" }}>Disclaimer:</strong> Mock/illustrative tracker. Keep data internal and avoid client confidential info in public deployments.
        </div>
      </div>
    </div>
  );

  function patchAnnexA(id, patch) { setAnnexA((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))); }
  function patchISMS(id, patch) { setIsmsReqs((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))); }
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
        fontWeight: 950,
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
    <div style={{ background: "#0b1220", border: "1px solid #1e293b", borderRadius: 16, padding: 14 }}>
      <div style={{ fontFamily: "ui-monospace", fontWeight: 950, fontSize: 28 }}>{value}</div>
      <div style={{ color: "#94a3b8", fontWeight: 950, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
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

function solidBtn() {
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
