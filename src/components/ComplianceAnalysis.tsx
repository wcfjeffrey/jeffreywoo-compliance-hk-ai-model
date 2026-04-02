import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AnalysisResult, Finding, SamplingAnalysis } from '../types';
import { cn } from '../lib/utils';
import { searchStandardInfo } from '../services/geminiService';
import { AuditProcedures } from './AuditProcedures';
import { SamplingDetails } from './SamplingDetails';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Search,
  Filter,
  ExternalLink,
  FileText,
  Trash2,
  Loader2,
  Globe,
  BookOpen,
  Zap,
  Target,
  Info
} from 'lucide-react';
interface ComplianceAnalysisProps {
  history: AnalysisResult[];
  onDelete: (id: string) => void;
  onUpdateFindingStatus?: (analysisId: string, findingId: string, status: 'Open' | 'Resolved' | 'Closed') => void;
  onLogAction?: (action: string, details: string, companyId?: string) => void;
}

export default function ComplianceAnalysis({ history, onDelete, onUpdateFindingStatus, onLogAction }: ComplianceAnalysisProps) {
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(history[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [searchingStandard, setSearchingStandard] = useState<string | null>(null);
  const [standardDetails, setStandardDetails] = useState<Record<string, { text: string, sources: { title: string, uri: string }[] }>>({});

  const handleSearchStandard = async (standardRef: string) => {
    if (standardDetails[standardRef]) {
      // Toggle off if already showing
      const newDetails = { ...standardDetails };
      delete newDetails[standardRef];
      setStandardDetails(newDetails);
      return;
    }

    setSearchingStandard(standardRef);
    try {
      const result = await searchStandardInfo(standardRef);
      setStandardDetails(prev => ({
        ...prev,
        [standardRef]: result
      }));
    } catch (error) {
      console.error("Failed to search standard:", error);
    } finally {
      setSearchingStandard(null);
    }
  };

  const filteredHistory = history.filter(h => {
    const matchesSearch = h.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter ? h.severity === severityFilter : true;
    return matchesSearch && matchesSeverity;
  });

  const handleGenerateMemo = (result: AnalysisResult) => {
    const content = `Compliance Memo: ${result.fileName}\nDate: ${new Date(result.timestamp).toLocaleString()}\nStatus: ${result.status}\nSeverity: ${result.severity}\n\nSummary:\n${result.summary}\n\nFindings:\n${result.findings?.map(f => `- [${f.standardRef}] ${f.description}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Memo_${result.fileName.split('.')[0]}.txt`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)]">
      {/* Sidebar List */}
      <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search analyses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Recent Analyses</span>
            <div className="flex gap-2">
              {['Critical', 'High', 'Medium', 'Low'].map(s => (
                <button 
                  key={s}
                  onClick={() => setSeverityFilter(severityFilter === s ? null : s)}
                  className={cn(
                    "px-1.5 py-0.5 rounded border transition-colors",
                    severityFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 hover:border-slate-400"
                  )}
                >
                  {s[0]}
                </button>
              ))}
              <Filter 
                size={14} 
                className={cn("cursor-pointer hover:text-slate-700", severityFilter && "text-blue-600")} 
                onClick={() => setSeverityFilter(null)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredHistory.map((result) => (
            <div key={result.id} className="relative group">
              <button
                onClick={() => setSelectedResult(result)}
                className={cn(
                  "w-full p-4 text-left border-b border-slate-50 transition-all hover:bg-slate-50",
                  selectedResult?.id === result.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 truncate max-w-[180px]">{result.fileName}</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{result.companyName}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                      result.severity === 'Critical' ? "bg-purple-100 text-purple-700" :
                      result.severity === 'High' ? "bg-red-100 text-red-700" :
                      result.severity === 'Medium' ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {result.severity}
                    </span>
                    <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-600 border border-slate-200">
                      {result.irdCode}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{result.category}</span>
                  <span>•</span>
                  <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                </div>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(result.id);
                  if (selectedResult?.id === result.id) setSelectedResult(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {filteredHistory.length === 0 && (
            <div className="p-8 text-center text-slate-400 italic text-sm">
              No analyses found.
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {selectedResult ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded uppercase">
                      IRD Code {selectedResult.irdCode}
                    </span>
                    <span className="text-sm font-bold text-blue-600">{selectedResult.companyName}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedResult.fileName}</h3>
                  <p className="text-slate-500 flex items-center gap-2 mt-1">
                    <FileText size={16} />
                    {selectedResult.category} Framework Analysis
                  </p>
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-bold",
                  selectedResult.status === 'Compliant' ? "bg-emerald-100 text-emerald-700" :
                  selectedResult.status === 'Non-Compliant' ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                )}>
                  {selectedResult.status === 'Compliant' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                  {selectedResult.status}
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-700 text-sm leading-relaxed markdown-body">
                <span className="font-bold text-slate-900 block mb-1 uppercase text-[10px] tracking-wider">Executive Summary</span>
                <ReactMarkdown>{selectedResult.summary}</ReactMarkdown>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Findings */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" size={20} />
                    Detailed Findings
                  </h4>
                </div>
                <div className="space-y-4">
                  {selectedResult.findings?.map((finding, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">
                            {finding.standardRef}
                          </span>
                          <button 
                            onClick={() => handleSearchStandard(finding.standardRef)}
                            disabled={searchingStandard === finding.standardRef}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all",
                              standardDetails[finding.standardRef]
                                ? "bg-blue-600 text-white"
                                : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                            )}
                            title={`Research ${finding.standardRef} with AI`}
                          >
                            {searchingStandard === finding.standardRef ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Globe size={12} />
                            )}
                            {standardDetails[finding.standardRef] ? 'Hide Research' : 'Google Research'}
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status:</span>
                            <select
                              value={finding.status || 'Open'}
                              onChange={(e) => onUpdateFindingStatus?.(selectedResult.id, finding.id, e.target.value as any)}
                              className={cn(
                                "text-[10px] font-bold border rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase",
                                finding.status === 'Resolved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                finding.status === 'Closed' ? "bg-slate-100 text-slate-600 border-slate-200" :
                                "bg-white text-blue-600 border-blue-200"
                              )}
                            >
                              <option value="Open">Open</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold uppercase",
                            finding.severity === 'Critical' ? "text-purple-600" :
                            finding.severity === 'High' ? "text-red-600" :
                            finding.severity === 'Medium' ? "text-amber-600" :
                            "text-blue-600"
                          )}>
                            {finding.severity} Severity
                          </span>
                        </div>
                      </div>
                      <div className="font-semibold text-slate-800 mb-2 markdown-body">
                        <ReactMarkdown>{finding.description}</ReactMarkdown>
                      </div>

                      {/* Risk Score Details */}
                      {finding.riskScore && (
                        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Zap size={14} className="text-amber-500" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Score</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900">{finding.riskScore.score}/100</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target size={14} className="text-blue-500" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</span>
                            </div>
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded",
                              finding.riskScore.priority === 'Critical' ? "bg-red-100 text-red-700" :
                              finding.riskScore.priority === 'High' ? "bg-orange-100 text-orange-700" :
                              finding.riskScore.priority === 'Medium' ? "bg-blue-100 text-blue-700" :
                              "bg-slate-100 text-slate-700"
                            )}>{finding.riskScore.priority}</span>
                          </div>
                        </div>
                      )}

                      {/* Risk Factors */}
                      {finding.riskScore?.factors && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-600">
                            MAGNITUDE: {finding.riskScore.factors.magnitude}
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-[9px] font-bold text-slate-600">
                            QUALITATIVE: {finding.riskScore.factors.qualitative}
                          </div>
                          {finding.riskScore.indicators?.isFraudIndicator && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded text-[9px] font-bold text-red-600 border border-red-100">
                              FRAUD INDICATOR
                            </div>
                          )}
                          {finding.riskScore.indicators?.isManagementOverride && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded text-[9px] font-bold text-purple-600 border border-purple-100">
                              MGMT OVERRIDE
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 italic mb-4">
                        <span className="font-bold text-slate-400 block mb-1 uppercase text-[9px]">Evidence</span>
                        "{finding.evidence}"
                      </div>

                      {/* Sampling Analysis Details */}
                      {finding.samplingAnalysis && (
                        <SamplingDetails 
                          analysis={finding.samplingAnalysis} 
                          onOverride={(newSize, reason) => {
                            if (onLogAction) {
                              onLogAction('Sampling Override', `Overrode sample size for ${finding.samplingAnalysis?.populationDescription} to ${newSize}. Reason: ${reason}`, selectedResult.companyId);
                            }
                            // In a real app, we would update the state here
                          }}
                        />
                      )}

                      {/* Suggested Procedures */}
                      {finding.suggestedProcedures && finding.suggestedProcedures.length > 0 && (
                        <div className="mt-4">
                          <AuditProcedures 
                            finding={finding} 
                            onAcceptProcedure={(proc) => onLogAction?.('Procedure Accepted', `Accepted procedure: ${proc.description} (${proc.hksaRef})`, selectedResult.companyId)}
                            onDismissProcedure={(procId) => onLogAction?.('Procedure Dismissed', `Dismissed procedure ID: ${procId}`, selectedResult.companyId)}
                          />
                        </div>
                      )}

                      {/* Standard Research Results */}
                      {standardDetails[finding.standardRef] && (
                        <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-2 mb-3 text-blue-700">
                            <BookOpen size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Standard Research Details</span>
                          </div>
                          <div className="text-xs text-slate-700 leading-relaxed markdown-body mb-4">
                            <ReactMarkdown>{standardDetails[finding.standardRef].text}</ReactMarkdown>
                          </div>
                          {standardDetails[finding.standardRef].sources.length > 0 && (
                            <div className="pt-3 border-t border-blue-200">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Sources</span>
                              <div className="flex flex-wrap gap-2">
                                {standardDetails[finding.standardRef].sources.map((source, sIdx) => (
                                  <a 
                                    key={sIdx}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 bg-white border border-blue-100 rounded text-[10px] text-blue-600 hover:bg-blue-50 transition-colors"
                                  >
                                    <ExternalLink size={10} />
                                    {source.title}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <ChevronRight className="text-blue-600" size={20} />
                  Corrective Actions
                </h4>
                <ul className="space-y-3">
                  {selectedResult.recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-blue-800">
                      <div className="w-5 h-5 rounded-full bg-blue-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-end gap-4">
              <button 
                onClick={() => handleGenerateMemo(selectedResult)}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
              >
                Generate Official Memo
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
            <ShieldCheck size={64} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-slate-300">No Analysis Selected</h3>
            <p className="max-w-xs mt-2">Select an analysis from the sidebar or ingest new data to see detailed compliance findings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
