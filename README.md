<div align="center">
  <img src="assets/JeffreyWooComplianceHK.png" alt="JeffreyWooComplianceHKBanner" width="1200" height="600" />
</div>

## 📊 Overview

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![HTML](https://img.shields.io/badge/HTML-%23E34F26.svg?logo=html5&logoColor=white)
![React](https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-886FBF?logo=googlegemini&logoColor=fff)

> **Not your typical compliance checklist tool!**

**JeffreyWoo HK Compliance** is an AI-powered compliance monitoring application that automatically detects anomalies and potential non-compliance with Hong Kong accounting and auditing frameworks. It helps audit firms, accounting managers, and compliance officers catch issues early, reduce risk, and prepare for regulatory inspections.

## ✨ What It Does
- 📑 **Multi‑Framework Compliance** – Automatically checks financial statements, audit working papers, and ESG disclosures against HKFRS, HKAS, HKSA, HKSQM, HKICPA Code of Ethics, HKSRS, and sustainability guidance.
- ⚖️ **Materiality & Risk Triage** – Calculates overall materiality, performance materiality, and clearly trivial thresholds (HKSA 320). Flags issues by severity (Critical / High / Medium / Low) so you focus on what really matters.
- 🎯 **Audit Sampling Engine** – Uses materiality values to compute required sample sizes under HKSA 530. Alerts when sample sizes are insufficient.
- 🔍 **Ethics & Independence Tracker** – Detects breaches of confidentiality, objectivity, and independence (e.g., audit partner also providing tax advisory).
- 📦 **Regulatory Inspection View** – One‑click export of the entire audit file in HKICPA Practice Review‑ready format (PDF, Excel). Filter by standard (e.g., HKSA 230).
- 🌱 **ESG Assurance Readiness** – Reviews sustainability disclosures against emerging standards and HKICPA guidance. Flags unsupported claims (e.g., “carbon neutral” without evidence).
- 🏢 **Multi‑Company & IRD Support** – Handles multiple clients, each with its own data. Classifies year‑ends using Hong Kong Inland Revenue Department (IRD) Accounting Date Codes (N / D / M).

### IRD Accounting Date Codes
- **N code:** 1 April 2024 to 30 November 2024
- **D code:** 1 December to 31 December 2024
- **M code profit cases:** 1 January 2025 to 31 March 2025
- **M code loss cases:** 1 January 2025 to 31 March 2025
**Note:** IRD uses the N / D / M Accounting Date Codes to classify companies based on their financial year-end dates. These codes determine the filing deadlines for Profits Tax Returns.

## 💡Compliance Transformation Impact
This project shows how AI can strengthen financial governance by:
- Automating anomaly detection across important Hong Kong compliance professional frameworks (including HKFRS, HKAS, HKSA, HKSQM, HKICPA Code of Ethics, HKSAsE, HKSRS, ESG guidance) – reducing manual review time.
- Embedding materiality‑based judgment into everyday compliance checks – aligning with real audit methodology.
- Improving audit quality through automated sampling calculations, ethics monitoring, and documentation gap alerts.
- Preparing firms for regulatory inspection with a ready‑to‑export Practice Review file.
- Supporting ESG assurance as sustainability reporting becomes mandatory.

## 🚀 Why Choose JeffreyWoo Compliance HK
Most compliance tools only flag **“rule violations”**. HK Compliance AI goes further – it applies materiality, risk scoring, and audit procedure automation so you can prioritise issues, respond appropriately, and demonstrate professional judgment to regulators and clients.

## 📚 Standards & Frameworks Covered
| Category	| Standards| 
|-----------|----------|
| **Accounting**	| HKFRS, HKAS (recognition, measurement, disclosure)| 
| **Auditing**	| HKSA 230, 320, 500, 505, 530, 550, 570, etc.| 
| **Quality Management**	| HKSQM 1 (firm‑level), HKSQM 2 (engagement quality review)| 
| **Ethics**	| HKICPA Code of Ethics (integrity, objectivity, confidentiality, independence)| 
| **Assurance & Related Services**	| HKSAsE, HKSRS 4400 (agreed‑upon procedures)| 
| **ESG / Sustainability**	| HKICPA sustainability guidance, ISSB‑aligned disclosure checks| 

## ⭐ Finance & Audit Skills Strengthened
- Applying materiality (HKSA 320) in an automated risk triage engine.
- Implementing audit sampling (HKSA 530) calculations driven by performance materiality.
- Building a regulatory inspection export that mirrors HKICPA Practice Review structure.
- Integrating ethics & independence checks into a multi‑company workflow.
- Parsing structured (ERP, Excel) and unstructured (audit reports, disclosures) data.
- Designing dashboards and audit trails suitable for external auditor and regulator review.

## 🤖 Tech Stack
- **Language** – TypeScript, HTML
- **Framework** – React (with Vite)
- **UI** – Standard React components, styled via TSX
- **Runtime** – Node.js
- **AI** – Google Gemini (for anomaly detection and standard mapping)

## 📦 Getting Started
1. Upload your financial data (trial balance, audit working papers, ESG disclosures) as Excel or PDF.
2. The app automatically detects issues and maps them to the relevant HK standard.
3. Review the Compliance Dashboard – issues are grouped by category, severity, and HKICPA Audit File Index (A–Z).
4. Use the Regulatory Inspection View to export a Practice Review‑ready file.

## 📁 HKICPA Audit File Index
 <img src="assets/JeffreyWooComplianceHK1.png" alt="JeffreyWooComplianceHK1" width="600" height="600" />

## ⚙️ Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 📋 Sample







