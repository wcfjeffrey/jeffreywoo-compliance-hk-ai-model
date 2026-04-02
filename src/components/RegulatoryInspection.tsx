import React, { useState } from 'react';
import { Company, AnalysisResult, Finding, AuditLogEntry, MaterialitySettings } from '../types';
import { FileDown, ShieldCheck, Filter, Search, ChevronRight, FileText, CheckCircle2, AlertCircle, Clock, User, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface RegulatoryInspectionProps {
  company: Company;
  analyses: AnalysisResult[];
  auditLogs: AuditLogEntry[];
  materiality?: MaterialitySettings;
}

export const RegulatoryInspection: React.FC<RegulatoryInspectionProps> = ({ company, analyses, auditLogs, materiality }) => {
  const [filter, setFilter] = useState({
    category: 'All',
    priority: 'All',
    standard: '',
  });

  const [generating, setGenerating] = useState(false);

  const filteredFindings = analyses.flatMap(a => a.findings).filter(f => {
    const matchesCategory = filter.category === 'All' || analyses.find(a => a.findings.includes(f))?.category === filter.category;
    const matchesPriority = filter.priority === 'All' || f.riskScore?.priority === filter.priority;
    const matchesStandard = !filter.standard || f.standardRef.toLowerCase().includes(filter.standard.toLowerCase());
    return matchesCategory && matchesPriority && matchesStandard;
  });

  const handleGenerateReport = () => {
    setGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const reportData = {
        company: {
          name: company.name,
          registrationNumber: company.registrationNumber,
          industry: company.industry,
          yearEnd: company.yearEnd,
          irdCode: company.irdCode,
        },
        materiality,
        findings: filteredFindings.map(f => ({
          standard: f.standardRef,
          description: f.description,
          evidence: f.evidence,
          riskScore: f.riskScore,
          procedures: f.suggestedProcedures,
          assignedIndex: f.assignedIndex,
        })),
        auditTrail: auditLogs.map(l => ({
          timestamp: l.timestamp,
          action: l.action,
          details: l.details,
          user: l.user,
        })),
        generatedAt: new Date().toISOString(),
        reportType: "HKICPA Practice Review Readiness Package"
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Regulatory_Inspection_Package_${company.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setGenerating(false);
    }, 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Regulatory Inspection View</h1>
              <p className="text-indigo-200/70 text-sm">HKICPA Practice Review Readiness & File Packaging</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Engagement</div>
              <div className="text-lg font-semibold">{company.name}</div>
              <div className="text-xs text-indigo-200/50 mt-1">FYE: {company.yearEnd}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Issues Logged</div>
              <div className="text-lg font-semibold">{filteredFindings.length} Findings</div>
              <div className="text-xs text-indigo-200/50 mt-1">Filtered by current view</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Materiality</div>
              <div className="text-lg font-semibold">{materiality ? formatCurrency(materiality.overallMateriality) : 'Not Set'}</div>
              <div className="text-xs text-indigo-200/50 mt-1">Overall Threshold</div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg",
                generating 
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed" 
                  : "bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-105 active:scale-95"
              )}
            >
              {generating ? <Clock className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
              {generating ? 'Generating Package...' : 'One-Click Consolidated PDF'}
            </button>
            <div className="text-xs text-indigo-200/50 max-w-[300px]">
              Generates a full audit file package including materiality, risk assessments, and audit trail for HKICPA inspection.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by standard (e.g. HKSA 230)..."
                value={filter.standard}
                onChange={(e) => setFilter({ ...filter, standard: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
              />
            </div>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all bg-white"
            >
              <option value="All">All Categories</option>
              <option value="Accounting">Accounting</option>
              <option value="Audit">Audit</option>
              <option value="Quality Management">Quality Management</option>
              <option value="Ethics & Independence">Ethics & Independence</option>
            </select>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all bg-white"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Standard Ref</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFindings.map((finding) => (
                <tr key={finding.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {finding.standardRef}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900 max-w-md truncate">
                      {finding.description}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 italic truncate">
                      Evidence: {finding.evidence}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter",
                      finding.riskScore?.priority === 'Critical' ? "bg-red-100 text-red-700" :
                      finding.riskScore?.priority === 'High' ? "bg-orange-100 text-orange-700" :
                      finding.riskScore?.priority === 'Medium' ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {finding.riskScore?.priority || 'Low'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter",
                      finding.status === 'Closed' ? "bg-green-100 text-green-700" :
                      finding.status === 'Resolved' ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {finding.status || 'Open'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${finding.riskScore?.score || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{finding.riskScore?.score || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Audit Trail (Inspection Ready)</h3>
          </div>
          <div className="space-y-4">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0 h-fit">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{log.action}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{log.details}</div>
                  <div className="text-[9px] text-slate-400 mt-1 font-medium">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Practice Review Sections (A-Z)</h3>
          </div>
          <div className="space-y-4">
            {['A', 'B', 'C', 'E', 'F', 'G', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'].map((section) => {
              const sectionFindings = filteredFindings.filter(f => f.assignedIndex === section);
              if (sectionFindings.length === 0) return null;
              
              return (
                <div key={section} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Section {section}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {sectionFindings.length} Finding{sectionFindings.length > 1 ? 's' : ''} Identified
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sectionFindings.some(f => f.riskScore?.priority === 'Critical') && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                      Review Ready
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredFindings.every(f => !f.assignedIndex) && (
              <div className="text-center py-8 text-slate-400 italic text-xs">
                No indexed findings found for this engagement.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
