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
