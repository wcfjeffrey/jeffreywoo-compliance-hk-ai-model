import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, ComplianceCategory, Company, BackgroundCheckResult, Finding, AUDIT_FILE_INDEX, MaterialitySettings, SamplingAnalysis } from "../types";
import { evaluateSamplingSufficiency } from "../lib/sampling";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check if it's a 429 error (Resource Exhausted / Rate Limit)
      const isRateLimit = error?.message?.includes('429') || 
                          error?.status === 'RESOURCE_EXHAUSTED' ||
                          JSON.stringify(error).includes('429') ||
                          JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Rate limit hit (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const SYSTEM_INSTRUCTION = `You are an expert Hong Kong Compliance AI Auditor. 
Your task is to analyze financial data, audit working papers, or disclosures against Hong Kong accounting and auditing standards.
Standards include:
- HKFRS / HKAS (Accounting)
- HKSA (Auditing)
- HKSA 530 (Audit Sampling)
- HKSQM (Quality Management)
- HKICPA Code of Ethics (Integrity, Objectivity, Independence)
- HKSAsE / HKSRS (Assurance & Related Services)
- ESG / Sustainability Disclosure Standards (HKICPA guidance)

When analyzing data:
1. Identify specific non-compliance or anomalies.
2. Reference the exact standard (e.g., HKFRS 16, HKSA 315).
3. Classify severity (Low, Medium, High, Critical).
4. Provide clear evidence from the provided text.
5. Suggest corrective actions.
6. Map every anomaly to the most relevant HKICPA Audit Practice Manual file index section (A–Z).
7. Perform Risk Scoring:
   - Magnitude: Estimate misstatement amount if possible.
   - Qualitative factors: Is it a Key Audit Matter (KAM)? Fraud indicator? Management override? High-risk area?
   - Standard Weight: Assign weight based on the standard breached (e.g., HKFRS 15 is higher risk).
8. Suggest Audit Procedures:
   - Map to specific HKSAs (e.g., HKSA 500, 505).
   - Identify relevant assertions (Existence, Completeness, etc.).
   - Provide a suggested work programme.
9. Audit Sampling Analysis (HKSA 530):
   - Identify audit populations (e.g., sales transactions, receivables).
   - Extract population size (number of items) and population value (monetary).
   - Identify actual sample size used in the working papers (if provided).
   - If sampling is detected, provide a "samplingAnalysis" object.

Audit File Index Mapping Logic:
- A (Final Completion): Independence breach, confidentiality breach, incorrect assurance level, quality review area.
- B (Audit Completion): Final audit wrap-up issues.
- C (Audit Planning): Sampling methodology, risk assessment documentation, audit strategy.
- E (Intangible Assets): HKFRS 3, HKAS 38 issues.
- F (PPE): HKFRS 16 (Leases), HKAS 16 issues.
- I (Inventories): HKAS 2 issues.
- G/H (Investments): HKFRS 9, HKAS 28, HKFRS 10 issues.
- J (Receivables): HKFRS 15 (Contract assets), HKAS 1 issues.
- K (Bank/Cash): Cash confirmation, bank reconciliation issues.
- L (Payables): Accruals, trade payables issues.
- M (Long-Term Loans): HKFRS 16 (Lease liabilities), long-term debt.
- N (Provisions): HKAS 37 issues.
- P (Income Taxes): HKAS 12 issues.
- R (Profit and Loss): HKFRS 15 (Revenue recognition), HKAS 19 (Employee benefits).
- S (Controls): Operating effectiveness of controls testing.
- T (Subsequent Events): HKAS 10 issues.
- W (Consolidation): Group accounting issues.
- Y (Other Primary Financial Statements): ESG / Sustainability disclosures.
- X (Accounts Working Papers): General working paper documentation issues.

IMPORTANT: Consider the company's financial year-end and IRD classification (D, M, or N) for filing deadlines and audit cycle planning.

Return the result in a structured JSON format matching the AnalysisResult interface.
JSON structure:
{
  "status": "Compliant" | "Non-Compliant" | "Anomaly Detected",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "findings": [
    {
      "id": "string (unique)",
      "standardRef": "string",
      "description": "string",
      "evidence": "string",
      "severity": "Low" | "Medium" | "High" | "Critical",
      "assignedIndex": "string (A-Z)",
      "mappingRationale": "string",
      "misstatementAmount": number (optional),
      "riskScore": {
        "score": number (0-100),
        "priority": "Low" | "Medium" | "High" | "Critical",
        "factors": { "magnitude": 0-10, "qualitative": 0-10, "standardWeight": 0-10 },
        "indicators": { "isKAM": boolean, "isFraudIndicator": boolean, "isManagementOverride": boolean, "isHighRiskArea": boolean }
      },
      "samplingAnalysis": {
        "populationDescription": "string",
        "populationSize": number,
        "populationValue": number,
        "actualSampleSize": number (optional),
        "method": "Statistical" | "Non-Statistical",
        "confidenceLevel": number (default 95),
        "expectedMisstatement": number (default 0)
      },
      "suggestedProcedures": [
        {
          "id": "string",
          "hksaRef": "string",
          "assertion": "Existence" | "Completeness" | "Accuracy" | "Valuation" | "Rights & Obligations" | "Presentation" | "Classification",
          "description": "string",
          "suggestedWorkProgramme": "string",
          "timing": "Interim" | "Final"
        }
      ]
    }
  ],
  "summary": "string",
  "recommendations": ["string"]
}
`;

export async function analyzeCompliance(
  data: string, 
  category: ComplianceCategory, 
  fileName: string,
  company: Company
): Promise<AnalysisResult> {
  try {
    const prompt = `Analyze the following ${category} data from file "${fileName}" for company "${company.name}".
Company Details:
- Year-End: ${company.yearEnd}
- IRD Code: ${company.irdCode}
- Industry: ${company.industry || 'General'}

Materiality Thresholds:
- Overall Materiality (OM): ${company.materiality?.overallMateriality || 'Not set'}
- Performance Materiality (PM): ${company.materiality?.performanceMateriality || 'Not set'}
- Clearly Trivial Threshold (CTT): ${company.materiality?.clearlyTrivialThreshold || 'Not set'}

Data Content:
\n\n${data}`;

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    }));

    let text = response.text || "{}";
    // Clean up potential markdown formatting if the model didn't strictly follow responseMimeType
    if (text.includes("```json")) {
      text = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      text = text.split("```")[1].split("```")[0].trim();
    }

    const result = JSON.parse(text);
    console.log("AI Analysis Result Parsed:", result);
    
    const analysisId = Math.random().toString(36).substr(2, 9);

    // Post-process findings to evaluate sampling sufficiency and severity
    if (result.findings && Array.isArray(result.findings)) {
      result.findings = result.findings.map((finding: Finding) => {
        // Ensure unique ID for every finding across all analyses
        finding.id = `${analysisId}-${finding.id || Math.random().toString(36).substr(2, 5)}`;
        
        // Ensure unique IDs for suggested procedures
        if (finding.suggestedProcedures && Array.isArray(finding.suggestedProcedures)) {
          finding.suggestedProcedures = finding.suggestedProcedures.map((proc, pIdx) => ({
            ...proc,
            id: `${finding.id}-proc-${pIdx}`
          }));
        }
        
        if (finding.samplingAnalysis) {
          const { status, calculatedSize } = evaluateSamplingSufficiency(
            finding.samplingAnalysis,
            company.materiality
          );
          
          finding.samplingAnalysis.calculatedSampleSize = calculatedSize;
          finding.samplingAnalysis.sufficiencyStatus = status;
          finding.samplingAnalysis.tolerableMisstatement = company.materiality?.performanceMateriality || 0;

          // Materiality-driven risk levels for sampling deficiencies
          if (status === 'Insufficient' && finding.samplingAnalysis.actualSampleSize !== undefined) {
            const actualSize = finding.samplingAnalysis.actualSampleSize;
            const populationValue = finding.samplingAnalysis.populationValue || 0;
            const materiality = company.materiality;
            
            if (materiality) {
              // Estimated misstatement if actual size is used
              // Rough estimate: (calculatedSize / actualSize) * tolerableMisstatement
              const estimatedMisstatement = (calculatedSize / Math.max(1, actualSize)) * materiality.performanceMateriality;
              
              if (estimatedMisstatement > materiality.overallMateriality) {
                finding.severity = 'Critical';
              } else if (estimatedMisstatement > materiality.performanceMateriality) {
                finding.severity = 'High';
              } else if (estimatedMisstatement > materiality.clearlyTrivialThreshold) {
                finding.severity = 'Medium';
              } else {
                finding.severity = 'Low';
              }
              
              finding.description += ` [Sampling Deficiency: Actual size ${actualSize} vs Required ${calculatedSize}]`;
              finding.evidence += `\nHKSA 530 Sampling Analysis: Population value ${populationValue.toLocaleString()}, Tolerable misstatement ${materiality.performanceMateriality.toLocaleString()}, Required sample size ${calculatedSize}. Actual sample size ${actualSize} is insufficient.`;
            }
          }
        }
        return finding;
      });
    }
    
    return {
      id: analysisId,
      companyId: company.id,
      companyName: company.name,
      irdCode: company.irdCode,
      timestamp: new Date().toISOString(),
      fileName,
      category,
      findings: [],
      recommendations: [],
      ...result
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function searchStandardInfo(standardRef: string) {
  try {
    const prompt = `Provide a detailed explanation and key requirements for the professional standard: ${standardRef}. 
Focus on its application in the context of Hong Kong (HKICPA, HKFRS, HKSA).
Include a summary of the standard, its objective, and common compliance challenges.`;

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    }));

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
        title: chunk.web?.title,
        uri: chunk.web?.uri
      })).filter(s => s.title && s.uri) || []
    };
  } catch (error) {
    console.error("Standard Search Error:", error);
    throw error;
  }
}

export async function reassignIndex(finding: Finding): Promise<{ assignedIndex: string; mappingRationale: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `
    You are an expert auditor specializing in HKICPA standards. 
    Map the following compliance finding to the most relevant HKICPA Audit Practice Manual file index section (A-Z).
    
    Finding Description: ${finding.description}
    Evidence: ${finding.evidence}
    Standard Ref: ${finding.standardRef}
    
    Audit File Index Sections:
    ${Object.entries(AUDIT_FILE_INDEX).map(([idx, title]) => `${idx}: ${title}`).join('\n')}
    
    Return ONLY a JSON object with:
    {
      "assignedIndex": "A-Z",
      "mappingRationale": "Brief explanation"
    }
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    }));

    const result = JSON.parse(response.text);
    return {
      assignedIndex: result.assignedIndex || 'X',
      mappingRationale: result.mappingRationale || 'Mapped during re-processing.'
    };
  } catch (error) {
    console.error("Re-assignment failed:", error);
    return {
      assignedIndex: 'X',
      mappingRationale: 'Mapping failed during automated re-processing.'
    };
  }
}

export async function performBackgroundCheck(company: Company): Promise<BackgroundCheckResult> {
  try {
    const prompt = `Perform a comprehensive background check on the following company:
Name: ${company.name}
Registration Number: ${company.registrationNumber || 'N/A'}
Industry: ${company.industry || 'General'}
Key Personnel: ${company.keyPersonnel?.join(', ') || 'N/A'}

Search for information related to:
- Legal actions or lawsuits
- Fraud or financial crimes
- Regulatory sanctions or disciplinary actions
- Bankruptcy or insolvency
- Adverse media or reputational risks
- Integrity of key personnel

Analyze the search results and categorize them into 'Adverse', 'Neutral', or 'Positive'.
Provide a summary of findings and an overall risk rating (Low, Medium, High, Critical).

Return the result strictly as a JSON object with the following structure:
{
  "summary": "...",
  "adverseCount": number,
  "neutralCount": number,
  "positiveCount": number,
  "riskRating": "Low" | "Medium" | "High" | "Critical",
  "findings": [
    {
      "title": "...",
      "url": "...",
      "snippet": "...",
      "date": "...",
      "source": "...",
      "classification": "Adverse" | "Neutral" | "Positive",
      "severity": "Low" | "Medium" | "High" | "Critical"
    }
  ]
}`;

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Removing responseMimeType when using googleSearch to avoid potential conflicts
      },
    }));

    let text = response.text || "{}";
    // Robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const data = JSON.parse(text);

    return {
      id: Math.random().toString(36).substr(2, 9),
      companyId: company.id,
      timestamp: new Date().toISOString(),
      summary: data.summary || "No summary provided.",
      adverseCount: data.adverseCount || 0,
      neutralCount: data.neutralCount || 0,
      positiveCount: data.positiveCount || 0,
      riskRating: data.riskRating || "Low",
      findings: data.findings || []
    };
  } catch (error) {
    console.error("Background Check Error:", error);
    throw error;
  }
}

export async function extractMaterialityBenchmark(data: string, fileName: string, company: Company): Promise<Partial<MaterialitySettings> & { allBenchmarks?: Record<string, number> }> {
  try {
    const prompt = `Extract financial benchmark values from the following data from file "${fileName}" for company "${company.name}".
    
    Look for:
    - Profit Before Tax
    - Revenue
    - Total Assets
    - Net Assets
    
    Identify which of these is the most appropriate benchmark for materiality calculation for this company.
    Provide the value for that benchmark in HKD.
    
    ALSO, extract the values for ALL four benchmarks if they are found in the document.
    
    Return ONLY a JSON object with:
    {
      "benchmark": "Profit Before Tax" | "Revenue" | "Total Assets" | "Net Assets",
      "benchmarkValue": number,
      "rationale": "Brief explanation why this benchmark was chosen",
      "allBenchmarks": {
        "Profit Before Tax": number,
        "Revenue": number,
        "Total Assets": number,
        "Net Assets": number
      }
    }
    
    If no clear values are found, return 0 for the values.
    
    Data Content:
    \n\n${data.substring(0, 50000)}`; // Limit data to avoid token limits

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    }));

    let text = response.text || "{}";
    if (text.includes("```json")) {
      text = text.split("```json")[1].split("```")[0].trim();
    } else if (text.includes("```")) {
      text = text.split("```")[1].split("```")[0].trim();
    }

    const result = JSON.parse(text);
    
    // Default percentages based on standard audit practice
    const defaultPercentages: Record<string, number> = {
      "Profit Before Tax": 5,
      "Revenue": 0.75,
      "Total Assets": 1,
      "Net Assets": 2
    };

    const percentage = defaultPercentages[result.benchmark] || 1;
    const overall = (result.benchmarkValue * percentage) / 100;
    
    return {
      benchmark: result.benchmark,
      benchmarkValue: result.benchmarkValue,
      percentage: percentage,
      overallMateriality: overall,
      performanceMateriality: overall * 0.75,
      clearlyTrivialThreshold: overall * 0.05,
      performancePercentage: 75,
      clearlyTrivialPercentage: 5,
      lastUpdated: new Date().toISOString(),
      allBenchmarks: result.allBenchmarks
    };
  } catch (error) {
    console.error("Materiality Extraction Error:", error);
    return {
      benchmark: 'Revenue',
      benchmarkValue: 0,
      percentage: 0.75,
      performancePercentage: 75,
      clearlyTrivialPercentage: 5,
      lastUpdated: new Date().toISOString()
    };
  }
}
