import React, { useEffect, useMemo, useState } from "react";

/**
 * ISO 27001 Dashboard (MVP)
 * - Overview + Controls
 * - Status updates
 * - Evidence checklist
 * - Notes per control
 * - LocalStorage persistence
 * - Import/Export JSON
 */

/* ─────────────────────────────────────────────
SAMPLE DATA (YOU CAN EXPAND THIS)
───────────────────────────────────────────── */
const SAMPLE_CONTROLS = [
  {
    id: "A.5.1",
    clause: "A.5",
    domain: "Organisational Controls",
    title: "Policies for information security",
    objective:
      "Provide management direction and support for information security in accordance with business requirements and applicable obligations.",
    testSteps: [
      "Obtain and review the current information security policy.",
      "Confirm the policy is approved by senior management.",
      "Verify communication/availability to employees and relevant parties.",
      "Confirm review occurs at defined intervals (e.g., annually).",
    ],
    evidenceRequests: [
      {
        id: "ER-A5.1-1",
        description: "Approved Information Security Policy",
        exampleFileName: "Information_Security_Policy.pdf",
        format: "PDF",
      },
      {
        id: "ER-A5.1-2",
        description: "Approval record (board minutes / exec sign-off)",
        exampleFileName: "Board_Minutes_Approval.pdf",
        format: "PDF",
      },
      {
        id: "ER-A5.1-3",
        description: "Distribution/acknowledgement evidence",
        exampleFileName: "Policy_Acknowledgements.csv",
        format: "CSV",
      },
    ],
    status: "Passed",
    owner: "CISO",
    frequency: "Annual",
    priority: "High",
    notes: "",
  },
  {
    id: "A.6.3",
    clause: "A.6",
    domain: "People Controls",
    title: "Information security awareness, education and training",
    objective:
      "Ensure personnel are aware of and fulfill their information security responsibilities.",
    testSteps: [
      "Review training curriculum and schedule.",
      "Obtain completion reports for the current period.",
      "Confirm phishing simulations occur at defined frequency.",
      "Verify new hires complete training within onboarding window.",
    ],
    evidenceRequests: [
      {
        id: "ER-A6.3-1",
        description: "Security awareness curriculum/course list",
        exampleFileName: "Training_Curriculum.pdf",
        format: "PDF",
      },
      {
        id: "ER-A6.3-2",
        description: "Completion dashboard/export by department",
        exampleFileName: "Training_Completion.xlsx",
        format: "XLSX",
      },
      {
        id: "ER-A6.3-3",
        description: "Phishing results report",
        exampleFileName: "Phishing_Results.pdf",
        format: "PDF",
      },
    ],
    status: "In Progress",
    owner: "HR / Security",
    frequency: "Annual",
    priority: "High",
    notes: "",
  },
  {
    id: "A.8.15",
    clause: "A.8",
    domain: "Technological Controls",
    title: "Logging",
    objective:
      "Record events and generate evidence of activities to support security monitoring, investigations, and incident response.",
    testSteps: [
      "Review logging policy and retention requirements.",
      "Verify SIEM collects logs from critical systems.",
      "Validate integrity/immutability controls for logs.",
      "Review sample alerts/tickets for last 30 days.",
    ],
    evidenceRequests: [
      {
        id: "ER-A8.15-1",
        description: "Logging policy (scope + retention)",
        exampleFileName: "Logging_Policy.pdf",
        format: "PDF",
      },
      {
        id: "ER-A8.15-2",
        description: "SIEM source coverage evidence",
        exampleFileName: "SIEM_Sources.csv",
        format: "CSV",
      },
      {
        id: "ER-A8.15-3",
        description: "Log integrity/immutability configuration",
        exampleFileName: "ObjectLock_Config.png",
        format: "PNG",
      },
    ],
    status: "Not Started",
    owner: "Security Ops",
    frequency: "Ongoing",
    priority: "High",
    notes: "",
  },
];

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
};

const PRIORITY_META = {
  Critical: { color: "#ef4444", bg: "#2a0b0b", border: "#7f1d1d" },
  High: { color: "#f59e0b", bg: "#2a1d06", border: "#7c5c12" },
  Medium: { color: "#22c55e", bg: "#052e1a", border: "#14532d" },
  Low: { color: "#94a3b8", bg: "#0b1220", border: "#1e293b" },
};

const LS_KEY = "iso27001_dashboard_state_v1";

const safeArray = (x) => (Array.isArray(x) ? x : []);

/* ─────────────────────────────────────────────
UI ATOMS
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
CONTROL CARD
───────────────────────────────────────────── */
function ControlCard({
  control,
  evidenceChecked,
  onToggleEvidence,
  onChangeStatus,
  onChangeNotes,
}) {
  const [open, setOpen] = useState(false);

  const domain = control.domain || "Unknown";
  const dm = DOMAIN_META[domain] || { color: "#94a3b8" };
  const sm = STATUS_META[control.status] || STATUS_META["Not Started"];
  const pm = PRIORITY_META[control.priority] || PRIORITY_META.Medium;

  const ev = safeArray(control.evidenceRequests);
  const totalEv = ev.length;
  const doneEv = ev.filter((e) => evidenceChecked[e.id]).length;

  return (
    <div
      style={{
        background: "#0b1220",
        border: "1px solid #1e293b",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: open
          ? "0 12px 40px rgba(0,0,0,0.35)"
          : "0 3px 12px rgba(0,0,0,0.20)",
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
        <Chip label={control.id} color={dm.color} bg="#0f172a" border="#1e293b" />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 14 }}>
            {control.title}
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip label={domain} color="#e2e8f0" bg="#0f172a" border="#1e293b" />
            <Chip
              label={`${control.priority || "Medium"} priority`}
              color={pm.color}
              bg={pm.bg}
              border={pm.border}
            />
            <Chip
              label={`Owner: ${control.owner || "—"}`}
              color="#94a3b8"
              bg="#0f172a"
              border="#1e293b"
            />
            <Chip
              label={`${doneEv}/${totalEv} evidence`}
              color={doneEv === totalEv && totalEv > 0 ? "#22c55e" : "#94a3b8"}
              bg="#0f172a"
              border="#1e293b"
            />
          </div>
        </div>

        <Chip
          label={`${sm.icon} ${control.status}`}
          color={sm.color}
          bg={sm.bg}
          border={sm.border}
        />
        <div style={{ color: "#94a3b8", fontSize: 16 }}>{open ? "▾" : "▸"}</div>
      </div>

      {/* Collapsed progress */}
      {!open && doneEv > 0 && (
        <div style={{ padding: "0 14px 14px" }}>
          <Progress value={doneEv} total={totalEv} color="#22c55e" />
        </div>
      )}

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: "1px solid #111827", padding: 14 }}>
          {/* Objective */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                color: "#94a3b8",
                fontWeight: 800,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Objective
            </div>
            <div style={{ marginTop: 6, color: "#cbd5e1", lineHeight: 1.5 }}>
              {control.objective || "—"}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 14,
            }}
          >
            {/* Test Steps */}
            <div
              style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontWeight: 800,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Test Procedure
              </div>
              <ol style={{ marginTop: 8, paddingLeft: 16, color: "#cbd5e1" }}>
                {safeArray(control.testSteps).map((s, i) => (
                  <li key={i} style={{ marginBottom: 6, lineHeight: 1.45 }}>
                    {s}
                  </li>
                ))}
                {safeArray(control.testSteps).length === 0 && <li>—</li>}
              </ol>
            </div>

            {/* Status + Notes */}
            <div
              style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontWeight: 800,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Status
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.keys(STATUS_META).map((s) => {
                  const meta = STATUS_META[s];
                  const active = control.status === s;
                  return (
                    <button
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeStatus(control.id, s);
                      }}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        border: `1px solid ${active ? meta.border : "#1e293b"}`,
                        background: active ? meta.bg : "#0b1220",
                        color: active ? meta.color : "#94a3b8",
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      {meta.icon} {s}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 14,
                  color: "#94a3b8",
                  fontWeight: 800,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Notes
              </div>

              <textarea
                value={control.notes || ""}
                onChange={(e) => onChangeNotes(control.id, e.target.value)}
                placeholder="Add notes, gaps, remediation plan..."
                style={{
                  marginTop: 8,
                  width: "100%",
                  minHeight: 92,
                  borderRadius: 10,
                  background: "#0b1220",
                  border: "1px solid #1e293b",
                  color: "#e2e8f0",
                  padding: 10,
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Evidence */}
          <div
            style={{
              marginTop: 14,
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontWeight: 800,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Evidence Requests ({doneEv}/{totalEv})
              </div>
              <div style={{ width: 260 }}>
                <Progress value={doneEv} total={totalEv} color="#22c55e" />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              {ev.map((item) => {
                const checked = !!evidenceChecked[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => onToggleEvidence(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 10px",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: checked ? "#052e1a" : "#0b1220",
                      border: `1px solid ${checked ? "#14532d" : "#1e293b"}`,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 6,
                        border: `2px solid ${checked ? "#22c55e" : "#475569"}`,
                        background: checked ? "#22c55e" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      {checked && (
                        <span style={{ color: "#fff", fontWeight: 900, fontSize: 12 }}>
                          ✓
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 13 }}>
                        {item.description}
                      </div>
                      <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {item.exampleFileName && (
                          <Chip
                            label={item.exampleFileName}
                            color="#94a3b8"
                            bg="#0f172a"
                            border="#1e293b"
                          />
                        )}
                        {item.format && (
                          <Chip
                            label={item.format}
                            color="#94a3b8"
                            bg="#0f172a"
                            border="#1e293b"
                          />
                        )}
                        <Chip label={item.id} color="#64748b" bg="#0b1220" border="#1e293b" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {ev.length === 0 && (
                <div style={{ color: "#94a3b8" }}>No evidence defined for this control.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [activeView, setActiveView] = useState("controls"); // controls | overview
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [controls, setControls] = useState(SAMPLE_CONTROLS);
  const [evidenceChecked, setEvidenceChecked] = useState({});

  // Load saved state
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.controls) setControls(parsed.controls);
      if (parsed?.evidenceChecked) setEvidenceChecked(parsed.evidenceChecked);
    } catch {
      // ignore bad state
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ controls, evidenceChecked }));
  }, [controls, evidenceChecked]);

  const toggleEvidence = (id) =>
    setEvidenceChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const changeStatus = (controlId, newStatus) =>
    setControls((prev) =>
      prev.map((c) => (c.id === controlId ? { ...c, status: newStatus } : c))
    );

  const changeNotes = (controlId, notes) =>
    setControls((prev) =>
      prev.map((c) => (c.id === controlId ? { ...c, notes } : c))
    );

  const filteredControls = useMemo(() => {
    const q = search.trim().toLowerCase();
    return controls.filter((c) => {
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
  }, [controls, search, domainFilter, statusFilter, priorityFilter]);

  const statusCounts = useMemo(() => {
    const m = { Passed: 0, "In Progress": 0, "Not Started": 0, Failed: 0 };
    controls.forEach((c) => (m[c.status] = (m[c.status] || 0) + 1));
    return m;
  }, [controls]);

  const totalEvidence = useMemo(() => {
    return controls.reduce((sum, c) => sum + safeArray(c.evidenceRequests).length, 0);
  }, [controls]);

  const collectedEvidence = useMemo(() => {
    return Object.values(evidenceChecked).filter(Boolean).length;
  }, [evidenceChecked]);

  const domainProgress = useMemo(() => {
    const domains = [...new Set(controls.map((c) => c.domain))];
    return domains.map((d) => {
      const dControls = controls.filter((c) => c.domain === d);
      const passed = dControls.filter((c) => c.status === "Passed").length;
      const total = dControls.length;
      const totalEv = dControls.reduce((s, c) => s + safeArray(c.evidenceRequests).length, 0);
      const doneEv = dControls.reduce((s, c) => {
        const ev = safeArray(c.evidenceRequests);
        return s + ev.filter((e) => evidenceChecked[e.id]).length;
      }, 0);
      return { domain: d, passed, total, totalEv, doneEv };
    });
  }, [controls, evidenceChecked]);

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ controls, evidenceChecked }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "iso27001-dashboard-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJSON(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed?.controls) throw new Error("Invalid file: missing controls");
    setControls(parsed.controls);
    setEvidenceChecked(parsed.evidenceChecked || {});
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0c111d", color: "#e2e8f0" }}>
      <style>{`
        * { box-sizing: border-box; }
        button { cursor: pointer; }
        input::placeholder { color: #64748b; }
      `}</style>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "18px 18px" }}>
        {/* Top bar */}
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
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1 0%, #0891b2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
              }}
            >
              ISO
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                ISO 27001:2022 — Audit Dashboard
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                Mock/illustrative tracker for controls & evidence collection
              </div>
            </div>

            <button onClick={() => setActiveView("controls")} style={navBtn(activeView === "controls")}>
              Controls
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
        </div>

        {/* OVERVIEW VIEW */}
        {activeView === "overview" && (
          <div style={{ paddingTop: 18 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <StatCard label="Total Controls" value={controls.length} />
              <StatCard label="Passed" value={statusCounts["Passed"] || 0} />
              <StatCard label="In Progress" value={statusCounts["In Progress"] || 0} />
              <StatCard label="Not Started" value={statusCounts["Not Started"] || 0} />
              <StatCard label="Evidence Collected" value={`${collectedEvidence}/${totalEvidence}`} />
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
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Domain Progress</div>
              {domainProgress.map((d) => {
                const dm = DOMAIN_META[d.domain] || { color: "#94a3b8" };
                return (
                  <div key={d.domain} style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: dm.color }}>{d.domain}</div>
                      <div style={{ color: "#94a3b8", fontFamily: "ui-monospace", fontSize: 12 }}>
                        {d.passed}/{d.total} passed · {d.doneEv}/{d.totalEv} evidence
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>
                          Controls Passed
                        </div>
                        <Progress value={d.passed} total={d.total} color={dm.color} />
                      </div>
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>
                          Evidence Collected
                        </div>
                        <Progress value={d.doneEv} total={d.totalEv} color="#22c55e" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTROLS VIEW */}
        {activeView === "controls" && (
          <div style={{ paddingTop: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search controls (id, title, domain, owner)…"
                style={{
                  flex: "1 1 240px",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #1e293b",
                  background: "#0b1220",
                  color: "#e2e8f0",
                }}
              />

              <SelectFilter
                label="Domain"
                value={domainFilter}
                setValue={setDomainFilter}
                options={["ALL", ...Object.keys(DOMAIN_META)]}
              />
              <SelectFilter
                label="Status"
                value={statusFilter}
                setValue={setStatusFilter}
                options={["ALL", ...Object.keys(STATUS_META)]}
              />
              <SelectFilter
                label="Priority"
                value={priorityFilter}
                setValue={setPriorityFilter}
                options={["ALL", ...Object.keys(PRIORITY_META)]}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ color: "#94a3b8", fontFamily: "ui-monospace" }}>
                Showing {filteredControls.length} of {controls.length}
              </div>
              <div style={{ color: "#22c55e", fontFamily: "ui-monospace" }}>
                Evidence: {collectedEvidence}/{totalEvidence}
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {filteredControls.map((c) => (
                <ControlCard
                  key={c.id}
                  control={c}
                  evidenceChecked={evidenceChecked}
                  onToggleEvidence={toggleEvidence}
                  onChangeStatus={changeStatus}
                  onChangeNotes={changeNotes}
                />
              ))}

              {filteredControls.length === 0 && (
                <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>
                  No controls match your filters.
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
          <strong style={{ color: "#cbd5e1" }}>Disclaimer:</strong> This is a mock/illustrative dashboard for tracking controls and evidence. It is not
          formal audit documentation or a certification deliverable.
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
        fontWeight: 800,
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
      <div style={{ fontFamily: "ui-monospace", fontWeight: 900, fontSize: 28 }}>
        {value}
      </div>
      <div
        style={{
          color: "#94a3b8",
          fontWeight: 800,
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
    fontWeight: 800,
  };
}

function solidBtn(isLabel = false) {
  return {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #1e293b",
    background: "#0b1220",
    color: "#e2e8f0",
    fontWeight: 800,
    cursor: isLabel ? "pointer" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
}
``
