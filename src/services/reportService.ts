import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { AnalysisResult, Company, BackgroundCheckResult, AUDIT_FILE_INDEX, AuditIndexSummary } from "../types";
import { IRD_CODE_LABELS } from "../lib/companyUtils";

export async function exportDashboardToWord(
  company: Company | undefined,
  history: AnalysisResult[],
  backgroundCheck: BackgroundCheckResult | undefined
) {
  // Group findings by index
  const allFindings = history.flatMap(h => h.findings.map(f => ({ ...f, fileName: h.fileName, timestamp: h.timestamp })));
  const findingsByIndex = allFindings.reduce((acc, finding) => {
    const idx = finding.assignedIndex || 'X';
    if (!acc[idx]) acc[idx] = [];
    acc[idx].push(finding);
    return acc;
  }, {} as Record<string, any[]>);

  // Identify high risk sections
  const highRiskSections = Object.entries(findingsByIndex)
    .map(([idx, findings]) => ({
      idx,
      title: AUDIT_FILE_INDEX[idx as keyof typeof AUDIT_FILE_INDEX] || 'Other / Unclassified',
      criticalCount: findings.filter(f => f.severity === 'Critical').length,
      highCount: findings.filter(f => f.severity === 'High').length,
      total: findings.length
    }))
    .filter(s => s.criticalCount > 0 || s.highCount > 0)
    .sort((a, b) => (b.criticalCount * 2 + b.highCount) - (a.criticalCount * 2 + a.highCount));

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "Compliance & Risk Assessment Report",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Company Info Section
          new Paragraph({
            text: "Company Information",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Company Name", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(company?.name || "All Companies")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "IRD Classification", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(company ? `${company.irdCode} (${IRD_CODE_LABELS[company.irdCode]})` : "N/A")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Industry", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(company?.industry || "N/A")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Registration No.", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(company?.registrationNumber || "N/A")] }),
                ],
              }),
            ],
          }),

          // Risk Assessment Section
          new Paragraph({
            text: "Risk Assessment Summary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Overall Risk Rating: ", bold: true }),
              new TextRun({ 
                text: company?.riskRating || "UNRATED", 
                color: company?.riskRating === 'Critical' ? "FF0000" : 
                       company?.riskRating === 'High' ? "FF4500" : 
                       company?.riskRating === 'Medium' ? "FFA500" : "008000",
                bold: true 
              }),
            ],
            spacing: { after: 200 },
          }),

          // High Risk Areas
          ...(highRiskSections.length > 0 ? [
            new Paragraph({
              text: "High-Risk Audit Areas",
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 200 },
            }),
            ...highRiskSections.map(s => new Paragraph({
              children: [
                new TextRun({ text: `Section ${s.idx}: ${s.title}`, bold: true, color: "FF0000" }),
                new TextRun({ text: ` - ${s.criticalCount} Critical, ${s.highCount} High priority issues detected.` })
              ],
              spacing: { after: 100 }
            }))
          ] : []),

          new Paragraph({
            children: [
              new TextRun({ text: "Background Check Summary: ", bold: true }),
              new TextRun({ text: backgroundCheck?.summary || "No background check data available." }),
            ],
            spacing: { before: 200, after: 400 },
          }),

          // Audit File Index Breakdown
          new Paragraph({
            text: "Audit File Index Breakdown",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...Object.entries(findingsByIndex).sort().flatMap(([idx, findings]) => [
            new Paragraph({
              text: `Section ${idx}: ${AUDIT_FILE_INDEX[idx as keyof typeof AUDIT_FILE_INDEX] || 'Other'}`,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Severity", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rationale", bold: true })] })] }),
                  ],
                }),
                ...findings.map(f => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ 
                      children: [new TextRun({ 
                        text: f.severity, 
                        color: f.severity === 'Critical' ? "FF0000" : f.severity === 'High' ? "FF4500" : "000000" 
                      })] 
                    })] }),
                    new TableCell({ children: [new Paragraph(f.description)] }),
                    new TableCell({ children: [new Paragraph(f.mappingRationale || "N/A")] }),
                  ],
                })),
              ],
            }),
          ]),

          // Footer Disclaimer
          new Paragraph({
            children: [
              new TextRun({
                text: "Disclaimer: This report is generated based on automated AI analysis and public search results. It should be reviewed by a professional auditor for final verification.",
                italics: true,
                size: 18,
              })
            ],
            spacing: { before: 800 },
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = company 
    ? `Compliance_Report_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`
    : `Consolidated_Compliance_Report_${new Date().toISOString().split('T')[0]}.docx`;
  
  saveAs(blob, fileName);
}

export function exportIndexSummaryToCSV(companyName: string, data: AuditIndexSummary[]) {
  const headers = ["Index", "Section Title", "Status", "Issue Count", "Latest Update", "Manual Override"];
  const rows = data.map(s => [
    s.index,
    s.title,
    s.status,
    s.issueCount.toString(),
    s.latestUpdate ? new Date(s.latestUpdate).toLocaleDateString() : "N/A",
    s.isManual ? "Yes" : "No"
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const fileName = `Audit_Index_Summary_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, fileName);
}
