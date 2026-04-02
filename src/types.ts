export type ComplianceCategory = 
  | 'Accounting' 
  | 'Audit' 
  | 'Quality Management' 
  | 'Ethics & Independence' 
  | 'Assurance' 
  | 'ESG';

export interface ComplianceStandard {
  id: string;
  code: string;
  name: string;
  category: ComplianceCategory;
}

export type IRDCode = 'D' | 'M' | 'N';

export interface MaterialitySettings {
  overallMateriality: number;
  performanceMateriality: number;
  clearlyTrivialThreshold: number;
  benchmark: 'Total Assets' | 'Revenue' | 'Profit Before Tax' | 'Net Assets' | 'Custom';
  benchmarkValue: number;
  percentage: number;
  performancePercentage: number;
  clearlyTrivialPercentage: number;
  lastUpdated: string;
}

export interface RiskScore {
  score: number; // 0-100
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: {
    magnitude: number; // 0-10
    qualitative: number; // 0-10
    standardWeight: number; // 0-10
  };
  indicators: {
    isKAM: boolean;
    isFraudIndicator: boolean;
    isManagementOverride: boolean;
    isHighRiskArea: boolean;
  };
}

export interface AuditProcedure {
  id: string;
  hksaRef: string;
  assertion: 'Existence' | 'Completeness' | 'Accuracy' | 'Valuation' | 'Rights & Obligations' | 'Presentation' | 'Classification';
  description: string;
  suggestedWorkProgramme: string;
  timing: 'Interim' | 'Final';
}

export interface Company {
  id: string;
  name: string;
  yearEnd: string; // ISO date string
  irdCode: IRDCode;
  industry?: string;
  registrationNumber?: string;
  keyPersonnel?: string[];
  riskRating?: 'Low' | 'Medium' | 'High' | 'Critical';
  lastBackgroundCheck?: string; // ISO date string
  indexOverrides?: Record<string, { status: AuditIndexStatus; memo: string; timestamp: string; userId: string }>;
  materiality?: MaterialitySettings;
  financialData?: {
    content: string;
    fileName: string;
    timestamp: string;
  };
}

export interface BackgroundCheckResult {
  id: string;
  companyId: string;
  timestamp: string;
  summary: string;
  adverseCount: number;
  neutralCount: number;
  positiveCount: number;
  findings: BackgroundFinding[];
  riskRating: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface BackgroundFinding {
  title: string;
  url: string;
  snippet: string;
  date?: string;
  source: string;
  classification: 'Adverse' | 'Neutral' | 'Positive';
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface AnalysisResult {
  id: string;
  companyId: string;
  companyName: string;
  irdCode: IRDCode;
  timestamp: string;
  fileName: string;
  category: ComplianceCategory;
  status: 'Compliant' | 'Non-Compliant' | 'Anomaly Detected';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  findings: Finding[];
  summary: string;
  recommendations: string[];
}

export interface SamplingAnalysis {
  populationDescription: string;
  populationSize: number; // number of items
  populationValue?: number; // monetary value
  method: 'Statistical' | 'Non-Statistical';
  confidenceLevel: number; // e.g. 95
  expectedMisstatement: number;
  tolerableMisstatement: number;
  calculatedSampleSize: number;
  actualSampleSize?: number;
  sufficiencyStatus: 'Sufficient' | 'Insufficient' | 'Not Provided';
  isOverride?: boolean;
  overrideReason?: string;
  manualOverrideSize?: number;
}

export interface Finding {
  id: string;
  standardRef: string;
  description: string;
  evidence: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedIndex: string; // A-Z
  mappingRationale?: string;
  status?: 'Open' | 'Resolved' | 'Closed';
  riskScore?: RiskScore;
  suggestedProcedures?: AuditProcedure[];
  misstatementAmount?: number;
  samplingAnalysis?: SamplingAnalysis;
}

export const AUDIT_FILE_INDEX: Record<string, string> = {
  'A': 'Final Completion',
  'B': 'Audit Completion',
  'C': 'Audit Planning',
  'D': 'Optional Programmes',
  'E': 'Intangible Assets',
  'F': 'Property, Plant and Equipment',
  'G': 'Investments in Group and Associated Undertakings',
  'H': 'Other Investments',
  'I': 'Inventories',
  'J': 'Trade & Other Receivables',
  'K': 'Bank Balances and Cash',
  'L': 'Trade & Other Payables',
  'M': 'Long-Term Loans and Deferred Income',
  'N': 'Provisions, Contingent Liabilities and Financial Commitments',
  'O': 'Share Capital, Reserves and Statutory Records',
  'P': 'Income Taxes',
  'Q': 'Income and Expenditure – Analyses for Tax Purposes',
  'R': 'Profit and Loss',
  'S': 'Operating Effectiveness of Controls',
  'T': 'Subsequent Events',
  'U': 'Not Used',
  'V': 'General Ledger',
  'W': 'Consolidation',
  'X': 'Accounts Working Papers',
  'Y': 'Other Primary Financial Statements',
  'Z': 'Computer Reports and Records Received'
};

export interface AuditLogEntry {
  id: string;
  companyId?: string;
  companyName?: string;
  irdCode?: IRDCode;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export type AuditIndexStatus = 
  | 'Complete' 
  | 'Issues Found' 
  | 'High Risk' 
  | 'N/A' 
  | 'Pending Review';

export interface AuditIndexSummary {
  index: string;
  title: string;
  status: AuditIndexStatus;
  issueCount: number;
  latestUpdate: string;
  isManual?: boolean;
}

export interface AuditPlan {
  id: string;
  companyId: string;
  timestamp: string;
  risks: {
    findingId: string;
    description: string;
    hksaRefs: string[];
    procedures: AuditProcedure[];
  }[];
  status: 'Draft' | 'Final' | 'Approved';
}

export interface InspectionReport {
  id: string;
  companyId: string;
  timestamp: string;
  sections: {
    title: string;
    content: string;
    type: 'Findings' | 'Materiality' | 'RiskAssessment' | 'AuditTrail' | 'Independence';
  }[];
}
