// src/iso27001AnnexA2022.js
/**
 * ISO 27001:2022 Annex A scaffold (IDs only; placeholder content).
 * Priorities constrained to High / Medium / Low.
 */

const DOMAIN_BY_CLAUSE = {
  "A.5": "Organisational Controls",
  "A.6": "People Controls",
  "A.7": "Physical Controls",
  "A.8": "Technological Controls",
};

const DEFAULT_OWNER_BY_DOMAIN = {
  "Organisational Controls": "Security / Compliance",
  "People Controls": "HR / Security",
  "Physical Controls": "Facilities / Security",
  "Technological Controls": "IT / Security",
};

const DEFAULT_FREQUENCY_BY_DOMAIN = {
  "Organisational Controls": "Annual",
  "People Controls": "Annual",
  "Physical Controls": "Ongoing",
  "Technological Controls": "Ongoing",
};

const DEFAULT_PRIORITY_BY_DOMAIN = {
  "Organisational Controls": "High",
  "People Controls": "Medium",
  "Physical Controls": "Medium",
  "Technological Controls": "High",
};

function rangeIds(prefix, start, end) {
  const out = [];
  for (let i = start; i <= end; i++) out.push(`${prefix}.${i}`);
  return out;
}

const ANNEX_A_IDS = [
  ...rangeIds("A.5", 1, 37),
  ...rangeIds("A.6", 1, 8),
  ...rangeIds("A.7", 1, 14),
  ...rangeIds("A.8", 1, 34),
];

function clauseFromId(id) {
  const [a, clauseNum] = id.split(".");
  return `${a}.${clauseNum}`;
}

function domainFromId(id) {
  const clause = clauseFromId(id);
  return DOMAIN_BY_CLAUSE[clause] || "Unknown";
}

export function buildAnnexAControls() {
  return ANNEX_A_IDS.map((id) => {
    const clause = clauseFromId(id);
    const domain = domainFromId(id);

    return {
      type: "control",
      id,
      clause,
      domain,

      // Placeholder fields (safe for external demo)
      title: `Annex A control ${id}`,
      objective: "Describe the control intent here (placeholder for demo).",

      testSteps: [
        "Define what to test and sampling approach.",
        "Identify evidence sources and responsible owners.",
        "Evaluate design alignment to scope and risk.",
        "Validate operating effectiveness for the audit period.",
      ],

      evidenceRequests: [
        {
          id: `ER-${id.replaceAll(".", "")}-1`,
          description: "Primary evidence artifact(s) for this control.",
          exampleFileName: "",
          format: "",
          collected: false,
          internalNotes: "",
        },
      ],

      status: "Not Started",
      owner: DEFAULT_OWNER_BY_DOMAIN[domain] || "TBD",
      frequency: DEFAULT_FREQUENCY_BY_DOMAIN[domain] || "TBD",
      priority: DEFAULT_PRIORITY_BY_DOMAIN[domain] || "Medium",
      notes: "",

      // ✅ Two-stage approvals stored here
      signoffs: [],
    };
  });
}
