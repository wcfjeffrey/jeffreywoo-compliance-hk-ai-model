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
- 📑 **Multi‑Framework Compliance** – Automatically checks financial statements, audit working papers, and ESG disclosures against HKFRS, HKAS, HKSA, HKSQM, HKICPA Code of Ethics, HKSAE, HKSRS, and Environmental, Social and Governance (ESG) guidance.
- ⚖️ **Materiality & Risk Triage** – Calculates overall materiality, performance materiality, and clearly trivial thresholds (HKSA 320). Flags issues by severity (Critical / High / Medium / Low) so you focus on what really matters.
- 🎯 **Audit Sampling Engine** – Uses materiality values to compute required sample sizes under HKSA 530. Alerts when sample sizes are insufficient.
- 🔍 **Ethics & Independence Tracker** – Detects breaches of confidentiality, objectivity, and independence (e.g., audit partner also providing tax advisory).
- 📦 **Regulatory Inspection View** – One‑click export of the entire audit file in HKICPA Practice Review‑ready format (PDF, Excel). Filter by standard (e.g., HKSA 230).
- 🌱 **ESG Assurance Readiness** – Reviews sustainability disclosures against emerging standards and HKICPA guidance. Flags unsupported claims (e.g., “carbon neutral” without evidence).
- 🏢 **Multi‑Company & IRD Support** – Handles multiple clients, each with its own data. Classifies year‑ends using Hong Kong Inland Revenue Department (IRD) Accounting Date Codes (N / D / M).

### 🗓️ IRD Accounting Date Codes
- **N code:** 1 April to 30 November → filing due within 1 month of issue, no extension allowed.
- **D code:** 1 December to 31 December → filing due within 1 month of issue, extension available until August 15.
- **M code profit cases:** 1 January to 31 March → filing due within 1 month of issue, extension available until November 15
- **M code loss cases:** 1 January to 31 March → filing due within 1 month of issue, extension available until January 31 of the following year 

**Note:** IRD uses the N / D / M Accounting Date Codes to classify companies based on their financial year-end dates. These codes determine the filing deadlines for Profits Tax Returns, and the extension dates are different for each category. Moreover, the extension dates (August 15, November 15 and January 31) are not fixed forever. They are administrative deadlines set by IRD, and IRD can adjust them depending on the year’s filing arrangements, weekends, or public holidays

## 💡Compliance Transformation Impact
This project shows how AI can strengthen financial governance by:
- Automating anomaly detection across important Hong Kong compliance professional frameworks (including HKFRS, HKAS, HKSA, HKSQM, HKICPA Code of Ethics, HKSAE, HKSRS, ESG guidance) – reducing manual review time.
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
| **Assurance & Related Services**	| HKSAEs, HKSRS 4400 (agreed‑upon procedures)| 
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
<img src="assets/JeffreyWooComplianceHK2.png" alt="JeffreyWooComplianceHK2" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK3.png" alt="JeffreyWooComplianceHK3" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK4.png" alt="JeffreyWooComplianceHK4" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK5.png" alt="JeffreyWooComplianceHK5" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK6.png" alt="JeffreyWooComplianceHK6" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK7.png" alt="JeffreyWooComplianceHK7" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK8.png" alt="JeffreyWooComplianceHK8" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK9.png" alt="JeffreyWooComplianceHK9" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK10.png" alt="JeffreyWooComplianceHK10" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK11.png" alt="JeffreyWooComplianceHK11" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK12.png" alt="JeffreyWooComplianceHK12" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK13.png" alt="JeffreyWooComplianceHK13" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK14.png" alt="JeffreyWooComplianceHK14" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK15.png" alt="JeffreyWooComplianceHK15" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK16.png" alt="JeffreyWooComplianceHK16" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK17.png" alt="JeffreyWooComplianceHK17" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK18.png" alt="JeffreyWooComplianceHK18" width="1200" height="1400" />
<img src="assets/JeffreyWooComplianceHK19.png" alt="JeffreyWooComplianceHK19" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK20.png" alt="JeffreyWooComplianceHK20" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK21.png" alt="JeffreyWooComplianceHK21" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK22.png" alt="JeffreyWooComplianceHK22" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK23.png" alt="JeffreyWooComplianceHK23" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK24.png" alt="JeffreyWooComplianceHK24" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK25.png" alt="JeffreyWooComplianceHK25" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK26.png" alt="JeffreyWooComplianceHK26" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK27.png" alt="JeffreyWooComplianceHK27" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK28.png" alt="JeffreyWooComplianceHK28" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK29.png" alt="JeffreyWooComplianceHK29" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK30.png" alt="JeffreyWooComplianceHK30" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK31.png" alt="JeffreyWooComplianceHK31" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK32.png" alt="JeffreyWooComplianceHK32" width="1200" height="1600" />
<img src="assets/JeffreyWooComplianceHK33.png" alt="JeffreyWooComplianceHK33" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK34.png" alt="JeffreyWooComplianceHK34" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK35.png" alt="JeffreyWooComplianceHK35" width="1200" height="600" />
<img src="assets/JeffreyWooComplianceHK36.png" alt="JeffreyWooComplianceHK36" width="1200" height="2200" />
<img src="assets/JeffreyWooComplianceHK37.png" alt="JeffreyWooComplianceHK37" width="1200" height="1200" />
<img src="assets/JeffreyWooComplianceHK38.png" alt="JeffreyWooComplianceHK38" width="1200" height="1400" />
<img src="assets/JeffreyWooComplianceHK39.png" alt="JeffreyWooComplianceHK39" width="1200" height="2200" />
<img src="assets/JeffreyWooComplianceHK40.png" alt="JeffreyWooComplianceHK40" width="1200" height="1200" />







