// src/iso27001Clauses4to10.js
/**
 * ISO 27001:2022 Clauses 4–10 are mandatory ISMS requirements. [1](https://bastion.tech/learn/iso27001/iso-27001-requirements)[2](https://www.glocertinternational.com/resources/articles/iso-27001-requirements-overview/)
 * This is an ORIGINAL checklist scaffold with editable test steps & evidence.
 */

const BASE = [
  { id: "4.1", area: "Context", title: "Understand internal/external context" },
  { id: "4.2", area: "Context", title: "Identify interested parties and requirements" },
  { id: "4.3", area: "Context", title: "Define ISMS scope" },
  { id: "4.4", area: "Context", title: "Establish ISMS processes and interactions" },

  { id: "5.1", area: "Leadership", title: "Leadership commitment and accountability" },
  { id: "5.2", area: "Leadership", title: "Information security policy" },
  { id: "5.3", area: "Leadership", title: "Roles, responsibilities, and authorities" },

  { id: "6.1", area: "Planning", title: "Risk/opportunity planning and risk treatment approach" },
  { id: "6.2", area: "Planning", title: "Define ISMS objectives and plans" },
  { id: "6.3", area: "Planning", title: "Plan ISMS changes in a controlled manner" },

  { id: "7.1", area: "Support", title: "Resources" },
  { id: "7.2", area: "Support", title: "Competence" },
  { id: "7.3", area: "Support", title: "Awareness" },
  { id: "7.4", area: "Support", title: "Communication" },
  { id: "7.5", area: "Support", title: "Documented information control" },

  { id: "8.1", area: "Operation", title: "Operational planning and control" },
  { id: "8.2", area: "Operation", title: "Perform information security risk assessment" },
  { id: "8.3", area: "Operation", title: "Perform information security risk treatment" },

  { id: "9.1", area: "Performance", title: "Monitor/measure/analyze/evaluate ISMS" },
  { id: "9.2", area: "Performance", title: "Internal audit program" },
  { id: "9.3", area: "Performance", title: "Management review" },

  { id: "10.1", area: "Improvement", title: "Nonconformity and corrective actions" },
  { id: "10.2", area: "Improvement", title: "Continual improvement" },
];

export function buildISMSRequirements() {
  return BASE.map((r) => ({
    type: "requirement",
    id: r.id,
    clause: r.id.split(".")[0], // 4,5,... (optional)
    domain: `Clause ${r.id.split(".")[0]} — ${r.area}`,
    title: `Clause ${r.id}: ${r.title}`,
    objective: "Document what ‘good’ looks like for your ISMS implementation and evidence it.",

    testSteps: [
      "Identify required documented information / artifacts.",
      "Validate the process exists and is implemented.",
      "Verify roles and responsibilities are defined.",
      "Confirm records demonstrate ongoing operation.",
    ],
    evidenceRequests: [
      {
        id: `ER-C${r.id.replace(".", "")}-1`,
        description: "Primary documented information / record(s) supporting this requirement.",
        exampleFileName: "",
        format: "",
        collected: false,
      },
    ],

    status: "Not Started",
    owner: "ISMS Owner",
    frequency: "Ongoing",
    priority: "High",
    notes: "",
  }));
}
