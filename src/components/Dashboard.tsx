import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Activity,
  TrendingUp,
  FileWarning,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Globe,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Clock,
  Shield,
  Download,
  FileSearch,
  LayoutGrid,
  AlertCircle,
  Edit2,
  Save,
  Minus,
  Settings,
  X as CloseIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { AnalysisResult, Company, IRDCode, BackgroundCheckResult, AUDIT_FILE_INDEX, Finding, AuditIndexStatus, AuditIndexSummary, ComplianceCategory, MaterialitySettings } from '../types';
import { IRD_CODE_LABELS } from '../lib/companyUtils';
import { exportDashboardToWord, exportIndexSummaryToCSV } from '../services/reportService';
import { Calculator, ShieldAlert as ShieldAlertIcon, Zap, Target, BarChart3 } from 'lucide-react';

interface DashboardProps {
  history: AnalysisResult[];
  selectedCompany?: Company;
  backgroundCheck?: BackgroundCheckResult;
  onRunBackgroundCheck?: () => void;
  onUpdateFinding?: (analysisId: string, findingId: string, newIndex: string) => void;
  onUpdateFindingStatus?: (analysisId: string, findingId: string, status: 'Open' | 'Resolved' | 'Closed') => void;
  onUpdateIndexStatus?: (companyId: string, index: string, status: AuditIndexStatus, memo: string) => void;
  onReprocessAll?: () => void;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#7C3AED'];

type SortField = 'fileName' | 'category' | 'status' | 'severity' | 'timestamp';
type SortOrder = 'asc' | 'desc';

export default function Dashboard({ history, selectedCompany, backgroundCheck, onRunBackgroundCheck, onUpdateFinding, onUpdateFindingStatus, onUpdateIndexStatus, onReprocessAll }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [irdFilter, setIrdFilter] = useState<IRDCode | null>(null);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'fileIndex' | 'indexSummary'>('overview');
  const [editingFinding, setEditingFinding] = useState<{ analysisId: string, findingId: string } | null>(null);
  const [newIndexValue, setNewIndexValue] = useState('');
  const [editingIndexStatus, setEditingIndexStatus] = useState<string | null>(null);
  const [overrideMemo, setOverrideMemo] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);
  const [summaryStatusFilter, setSummaryStatusFilter] = useState<AuditIndexStatus | 'All'>('All');
  const [summarySortField, setSummarySortField] = useState<'index' | 'issueCount'>('index');
  const [summarySortOrder, setSummarySortOrder] = useState<'asc' | 'desc'>('asc');

  const handleRunCheck = async () => {
    if (!onRunBackgroundCheck) return;
    setIsRunningCheck(true);
    await onRunBackgroundCheck();
    setIsRunningCheck(false);
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      await exportDashboardToWord(selectedCompany, history, backgroundCheck);
    } catch (error) {
      console.error("Export Failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReprocess = async () => {
    if (!onReprocessAll) return;
    setIsReprocessing(true);
    try {
      await onReprocessAll();
    } catch (error) {
      console.error("Reprocess Failed:", error);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleSaveOverride = (analysisId: string, findingId: string) => {
    if (onUpdateFinding && newIndexValue) {
      onUpdateFinding(analysisId, findingId, newIndexValue);
      setEditingFinding(null);
      setNewIndexValue('');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredHistory = history.filter(h => {
    const matchesSearch = h.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? h.status === statusFilter : true;
    const matchesIRD = irdFilter ? h.irdCode === irdFilter : true;
    return matchesSearch && matchesStatus && matchesIRD;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortField === 'timestamp') {
      comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else {
      comparison = a[sortField].localeCompare(b[sortField]);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const stats = [
    { 
      label: selectedCompany ? 'Company Analyses' : 'Total Portfolio Analyses', 
      value: history.length, 
      icon: Activity, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Critical/High Risk', 
      value: history.flatMap(h => h.findings).filter(f => f.riskScore?.priority === 'Critical' || f.riskScore?.priority === 'High').length, 
      icon: ShieldAlert, 
      color: 'text-red-600', 
      bg: 'bg-red-50' 
    },
    { 
      label: 'Sampling Deficiencies', 
      value: history.flatMap(h => h.findings).filter(f => f.samplingAnalysis?.sufficiencyStatus === 'Insufficient').length, 
      icon: BarChart3, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
    { 
      label: 'Misstatement Exposure', 
      value: new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD', maximumFractionDigits: 0 }).format(
        history.flatMap(h => h.findings).reduce((acc, f) => acc + (f.misstatementAmount || 0), 0)
      ), 
      icon: Target, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
  ];

  const irdData = [
    { name: 'Code D', value: history.filter(h => h.irdCode === 'D').length },
    { name: 'Code M', value: history.filter(h => h.irdCode === 'M').length },
    { name: 'Code N', value: history.filter(h => h.irdCode === 'N').length },
  ].filter(d => d.value > 0);

  const categories: ComplianceCategory[] = [
    'Accounting', 
    'Audit', 
    'Quality Management', 
    'Ethics & Independence', 
    'Assurance', 
    'ESG'
  ];

  const categoryData = categories.map(cat => {
    const activeIssuesCount = history
      .filter(h => h.category === cat)
      .reduce((acc, h) => {
        const activeFindings = h.findings.filter(f => f.status !== 'Resolved' && f.status !== 'Closed');
        return acc + activeFindings.length;
      }, 0);
    
    return {
      name: cat,
      value: activeIssuesCount
    };
  }).filter(d => d.value > 0);

  const severityData = [
    { name: 'Low', value: history.filter(h => h.severity === 'Low').length },
    { name: 'Medium', value: history.filter(h => h.severity === 'Medium').length },
    { name: 'High', value: history.filter(h => h.severity === 'High').length },
    { name: 'Critical', value: history.filter(h => h.severity === 'Critical').length },
  ].filter(d => d.value > 0);

  // Group findings by index for File Index View
  const findingsByIndex = history.reduce((acc, analysis) => {
    analysis.findings.forEach(finding => {
      const index = finding.assignedIndex || 'X'; // Default to X if missing
      if (!acc[index]) acc[index] = [];
      acc[index].push({ ...finding, analysisId: analysis.id, analysisFileName: analysis.fileName, timestamp: analysis.timestamp });
    });
    return acc;
  }, {} as Record<string, (Finding & { analysisId: string, analysisFileName: string, timestamp: string })[]>);

  // Calculate Audit Index Summary (A-Z)
  const indexSummaryData: AuditIndexSummary[] = Object.entries(AUDIT_FILE_INDEX).map(([index, title]) => {
    const findings = findingsByIndex[index] || [];
    const manualOverride = selectedCompany?.indexOverrides?.[index];
    
    let status: AuditIndexStatus = 'Pending Review';
    let latestUpdate = '';

    // Automatic logic
    const activeFindings = findings.filter(f => f.status !== 'Resolved' && f.status !== 'Closed');
    const hasHighRisk = activeFindings.some(f => f.severity === 'High' || f.severity === 'Critical');
    const hasOpenIssues = activeFindings.length > 0;
    
    // Find latest update from findings
    if (findings.length > 0) {
      const latestFinding = [...findings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      latestUpdate = latestFinding.timestamp;
    }

    if (hasHighRisk) {
      status = 'High Risk';
    } else if (hasOpenIssues) {
      status = 'Issues Found';
    } else {
      status = 'Pending Review';
    }

    // Manual override takes precedence
    if (manualOverride) {
      status = manualOverride.status;
      if (!latestUpdate || new Date(manualOverride.timestamp).getTime() > new Date(latestUpdate).getTime()) {
        latestUpdate = manualOverride.timestamp;
      }
    }

    return {
      index,
      title,
      status,
      issueCount: findings.length,
      latestUpdate,
      isManual: !!manualOverride
    };
  });

  const filteredIndexSummary = indexSummaryData
    .filter(s => summaryStatusFilter === 'All' || s.status === summaryStatusFilter)
    .sort((a, b) => {
      if (summarySortField === 'index') {
        return summarySortOrder === 'asc' ? a.index.localeCompare(b.index) : b.index.localeCompare(a.index);
      } else {
        return summarySortOrder === 'asc' ? a.issueCount - b.issueCount : b.issueCount - a.issueCount;
      }
    });

  const healthSummary = {
    totalWithIssues: indexSummaryData.filter(s => s.status === 'Issues Found').length,
    highRisk: indexSummaryData.filter(s => s.status === 'High Risk').length,
    complete: indexSummaryData.filter(s => s.status === 'Complete').length,
    na: indexSummaryData.filter(s => s.status === 'N/A').length,
  };

  const getStatusIcon = (status: AuditIndexStatus) => {
    switch (status) {
      case 'Complete': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'Issues Found': return <AlertTriangle className="text-amber-500" size={18} />;
      case 'High Risk': return <ShieldAlert className="text-red-500" size={18} />;
      case 'N/A': return <Minus className="text-slate-400" size={18} />;
      case 'Pending Review': return <Clock className="text-blue-400" size={18} />;
    }
  };

  const getStatusColor = (status: AuditIndexStatus) => {
    switch (status) {
      case 'Complete': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Issues Found': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'High Risk': return 'bg-red-50 text-red-700 border-red-100';
      case 'N/A': return 'bg-slate-50 text-slate-700 border-slate-100';
      case 'Pending Review': return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  // High-Risk Alert calculation
  const highRiskSections = Object.entries(findingsByIndex)
    .map(([index, findings]) => ({
      index,
      title: AUDIT_FILE_INDEX[index] || 'Unknown',
      highCount: findings.filter(f => f.severity === 'High' || f.severity === 'Critical').length,
      totalCount: findings.length
    }))
    .filter(s => s.highCount > 0)
    .sort((a, b) => b.highCount - a.highCount)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* View Switcher */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setViewMode('overview')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
            viewMode === 'overview' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <LayoutGrid size={16} />
          Overview
        </button>
        <button
          onClick={() => setViewMode('fileIndex')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
            viewMode === 'fileIndex' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileSearch size={16} />
          Findings by Index
        </button>
        <button
          onClick={() => setViewMode('indexSummary')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
            viewMode === 'indexSummary' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <LayoutGrid size={16} />
          Index Summary
        </button>
      </div>

      {selectedCompany && viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Materiality & Sampling Summary */}
          {selectedCompany.materiality && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                      <Calculator size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Materiality Thresholds</h3>
                      <div className="flex items-center gap-6 mt-2">
                        <div>
                          <div className="text-xs text-slate-500">Overall</div>
                          <div className="text-lg font-bold text-slate-900">
                            {new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD', maximumFractionDigits: 0 }).format(selectedCompany.materiality.overallMateriality)}
                          </div>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div>
                          <div className="text-xs text-slate-500">Performance</div>
                          <div className="text-lg font-bold text-slate-900">
                            {new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD', maximumFractionDigits: 0 }).format(selectedCompany.materiality.performanceMateriality)}
                          </div>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div>
                          <div className="text-xs text-slate-500">Clearly Trivial</div>
                          <div className="text-lg font-bold text-slate-900">
                            {new Intl.NumberFormat('en-HK', { style: 'currency', currency: 'HKD', maximumFractionDigits: 0 }).format(selectedCompany.materiality.clearlyTrivialThreshold)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Benchmark</div>
                    <div className="text-sm font-semibold text-slate-700">{selectedCompany.materiality.percentage}% of {selectedCompany.materiality.benchmark}</div>
                  </div>
                </div>

                {/* Sampling Sufficiency Quick View */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 size={14} className="text-blue-500" />
                      HKSA 530 Sampling Sufficiency
                    </h4>
                    <span className="text-[10px] text-slate-400 italic">Based on Performance Materiality</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {history.flatMap(h => h.findings)
                      .filter(f => f.samplingAnalysis)
                      .slice(0, 3)
                      .map((f, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-slate-900 truncate max-w-[100px]">
                              {f.samplingAnalysis?.populationDescription}
                            </span>
                            <span className={cn(
                              "text-[8px] font-bold px-1 py-0.5 rounded uppercase",
                              f.samplingAnalysis?.sufficiencyStatus === 'Sufficient' ? "bg-emerald-100 text-emerald-700" :
                              f.samplingAnalysis?.sufficiencyStatus === 'Insufficient' ? "bg-red-100 text-red-700" :
                              "bg-slate-200 text-slate-600"
                            )}>
                              {f.samplingAnalysis?.sufficiencyStatus}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Actual: {f.samplingAnalysis?.actualSampleSize || 'N/A'}</span>
                            <span>Req: {f.samplingAnalysis?.calculatedSampleSize}</span>
                          </div>
                        </div>
                      ))}
                    {history.flatMap(h => h.findings).filter(f => f.samplingAnalysis).length === 0 && (
                      <div className="col-span-3 text-center py-2 text-xs text-slate-400 italic">
                        No sampling data identified in recent analyses.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Risk Triage</h3>
                  <Zap size={18} className="text-amber-500" />
                </div>
                <div className="space-y-3">
                  {['Critical', 'High', 'Medium', 'Low'].map(priority => {
                    const count = history.flatMap(h => h.findings).filter(f => (f.riskScore?.priority || 'Low') === priority).length;
                    return (
                      <div key={priority} className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded",
                          priority === 'Critical' ? "bg-red-100 text-red-700" :
                          priority === 'High' ? "bg-orange-100 text-orange-700" :
                          priority === 'Medium' ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-700"
                        )}>{priority}</span>
                        <span className="text-sm font-bold text-slate-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-900/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Building2 size={32} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">{selectedCompany.name}</h3>
                  <button 
                    onClick={handleExportWord}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-all disabled:opacity-50"
                    title="Export Report to Word"
                  >
                    {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Export Report
                  </button>
                  <button 
                    onClick={handleReprocess}
                    disabled={isReprocessing}
                    className="flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-all disabled:opacity-50"
                    title="Reprocess all historical findings for HKICPA indexing"
                  >
                    {isReprocessing ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                    Reprocess All
                  </button>
                  <button 
                    onClick={() => {
                      // In a real app, this would re-fetch or re-calculate from server
                      // Here we just trigger a re-render by toggling a dummy state or just calling a prop
                      if (onReprocessAll) onReprocessAll();
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-all"
                    title="Re-evaluate all section statuses"
                  >
                    <TrendingUp size={14} />
                    Refresh Status
                  </button>
                </div>
                <p className="text-blue-100 text-sm">
                  IRD Year-End: {new Date(selectedCompany.yearEnd).toLocaleDateString()} ({IRD_CODE_LABELS[selectedCompany.irdCode]})
                  {selectedCompany.industry && ` • Industry: ${selectedCompany.industry}`}
                </p>
                {selectedCompany.registrationNumber && (
                  <p className="text-blue-200 text-xs mt-1 font-mono">Reg No: {selectedCompany.registrationNumber}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-blue-100 text-xs uppercase font-bold tracking-wider">Background Risk</p>
                <div className={cn(
                  "text-xl font-black px-3 py-1 rounded-lg mt-1 inline-block",
                  selectedCompany.riskRating === 'Critical' ? "bg-purple-500 text-white" :
                  selectedCompany.riskRating === 'High' ? "bg-red-500 text-white" :
                  selectedCompany.riskRating === 'Medium' ? "bg-amber-500 text-white" :
                  selectedCompany.riskRating === 'Low' ? "bg-emerald-500 text-white" :
                  "bg-white/20 text-white"
                )}>
                  {selectedCompany.riskRating || 'UNRATED'}
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-xs uppercase font-bold tracking-wider">IRD Classification</p>
                <p className="text-4xl font-black">{selectedCompany.irdCode}</p>
              </div>
            </div>
          </div>

          {/* Background Check Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-slate-800">Background Check (Google Search)</h3>
              </div>
              <button 
                onClick={handleRunCheck}
                disabled={isRunningCheck}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all disabled:opacity-50"
              >
                {isRunningCheck ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                {backgroundCheck ? 'Refresh Check' : 'Run Background Check'}
              </button>
            </div>
            
            <div className="p-6">
              {backgroundCheck ? (
                <div className="space-y-6">
                  {/* Summary Header */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Last Checked</span>
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <Clock size={14} />
                        {new Date(backgroundCheck.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">Adverse Findings</span>
                      <div className="text-2xl font-bold text-red-600">{backgroundCheck.adverseCount}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Neutral Findings</span>
                      <div className="text-2xl font-bold text-slate-700">{backgroundCheck.neutralCount}</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Positive Findings</span>
                      <div className="text-2xl font-bold text-emerald-600">{backgroundCheck.positiveCount}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Shield size={14} /> Risk Summary
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed italic">
                      "{backgroundCheck.summary}"
                    </p>
                  </div>

                  {/* Findings List */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detailed Search Results</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {backgroundCheck.findings.map((finding, idx) => (
                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                finding.classification === 'Adverse' ? "bg-red-100 text-red-700" :
                                finding.classification === 'Positive' ? "bg-emerald-100 text-emerald-700" :
                                "bg-slate-100 text-slate-700"
                              )}>
                                {finding.classification}
                              </span>
                              {finding.severity && (
                                <span className={cn(
                                  "text-[10px] font-bold uppercase",
                                  finding.severity === 'Critical' ? "text-purple-600" :
                                  finding.severity === 'High' ? "text-red-600" :
                                  finding.severity === 'Medium' ? "text-amber-600" :
                                  "text-blue-600"
                                )}>
                                  {finding.severity} Severity
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">{finding.source}</span>
                          </div>
                          <h5 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                            {finding.title}
                            <a href={finding.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                              <ExternalLink size={14} />
                            </a>
                          </h5>
                          <p className="text-xs text-slate-600 line-clamp-2">{finding.snippet}</p>
                          {finding.date && <span className="text-[10px] text-slate-400 mt-2 block italic">{finding.date}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 italic">
                    <p><strong>Disclaimer:</strong> Search results are from public sources and may not be exhaustive; they supplement but do not replace professional due diligence. This automated check is for professional audit planning and risk assessment purposes only.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                  <ShieldCheck size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">No background check data available for this company.</p>
                  <p className="text-xs mt-1">Run a background check to identify potential reputational or legal risks.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'overview' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={stat.color} size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Compliance by Category */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Compliance by Category
              </h3>
              <div className="h-[300px]">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">
                    No data available yet
                  </div>
                )}
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <FileWarning size={20} className="text-amber-600" />
                IRD Code Distribution
              </h3>
              <div className="h-[300px]">
                {irdData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={irdData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {irdData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">
                    No data available yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Recent Compliance Alerts</h3>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {(['D', 'M', 'N'] as IRDCode[]).map(code => (
                    <button
                      key={code}
                      onClick={() => setIrdFilter(irdFilter === code ? null : code)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        irdFilter === code 
                          ? "bg-white text-blue-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {code}
                    </button>
                  ))}
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {['Compliant', 'Non-Compliant', 'Anomaly Detected'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border",
                        statusFilter === status 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {status === 'Anomaly Detected' ? 'Anomaly' : status}
                    </button>
                  ))}
                  <button 
                    onClick={() => setStatusFilter(null)}
                    className={cn(
                      "p-1.5 rounded-lg border transition-all",
                      statusFilter ? "text-blue-600 border-blue-200 bg-blue-50" : "text-slate-400 border-slate-200"
                    )}
                  >
                    <Filter size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700" onClick={() => handleSort('fileName')}>
                      <div className="flex items-center gap-1">
                        File Name {sortField === 'fileName' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold">Company</th>
                    <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-1">
                        Category {sortField === 'category' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1">
                        Status {sortField === 'status' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700" onClick={() => handleSort('severity')}>
                      <div className="flex items-center gap-1">
                        Severity {sortField === 'severity' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700" onClick={() => handleSort('timestamp')}>
                      <div className="flex items-center gap-1">
                        Date {sortField === 'timestamp' ? (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{item.fileName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {item.irdCode}
                          </span>
                          <span className="text-sm font-medium text-slate-700">{item.companyName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.category}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-semibold",
                          item.status === 'Compliant' ? "bg-emerald-100 text-emerald-700" :
                          item.status === 'Non-Compliant' ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-xs font-bold uppercase",
                          item.severity === 'Critical' ? "text-purple-600" :
                          item.severity === 'High' ? "text-red-600" :
                          item.severity === 'Medium' ? "text-amber-600" :
                          "text-blue-600"
                        )}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                        No recent activity found. Start by ingesting data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : viewMode === 'fileIndex' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          {/* High Risk Alert Dashboard */}
          {highRiskSections.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 text-red-700 mb-4">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold uppercase tracking-tight">High-Risk Alert: Critical Sections Detected</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {highRiskSections.map((section, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">{section.index}</span>
                      <span className="text-xs font-bold text-red-600 px-2 py-0.5 bg-red-50 rounded uppercase">{section.highCount} Critical Issues</span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{section.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Requires immediate partner review and quality control verification.</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Index View (A-Z) */}
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(AUDIT_FILE_INDEX).map(([index, title]) => {
              const findings = findingsByIndex[index] || [];
              if (findings.length === 0) return null;

              return (
                <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-lg">{index}</span>
                      <div>
                        <h4 className="font-bold text-slate-800">{title}</h4>
                        <p className="text-xs text-slate-500">{findings.length} Anomalies detected in this section</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {findings.slice(0, 5).map((f, i) => (
                          <div key={i} className={cn(
                            "w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white",
                            f.severity === 'Critical' ? "bg-purple-500" :
                            f.severity === 'High' ? "bg-red-500" :
                            f.severity === 'Medium' ? "bg-amber-500" : "bg-blue-500"
                          )}>
                            !
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {findings.map((finding) => (
                      <div key={finding.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              finding.severity === 'Critical' ? "bg-purple-100 text-purple-700" :
                              finding.severity === 'High' ? "bg-red-100 text-red-700" :
                              finding.severity === 'Medium' ? "bg-amber-100 text-amber-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              {finding.severity}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{finding.standardRef}</span>
                            <span className="text-[10px] text-slate-400">• {finding.analysisFileName}</span>
                          </div>
                          
                          {/* Manual Override UI */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status:</span>
                              <select
                                value={finding.status || 'Open'}
                                onChange={(e) => onUpdateFindingStatus?.(finding.analysisId, finding.id, e.target.value as any)}
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

                            {editingFinding?.findingId === finding.id ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={newIndexValue}
                                  onChange={(e) => setNewIndexValue(e.target.value)}
                                  className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                  {Object.entries(AUDIT_FILE_INDEX).map(([idx, name]) => (
                                    <option key={idx} value={idx}>{idx} - {name}</option>
                                  ))}
                                </select>
                                <button 
                                  onClick={() => handleSaveOverride(finding.analysisId, finding.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Save size={14} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingFinding({ analysisId: finding.analysisId, findingId: finding.id });
                                  setNewIndexValue(finding.assignedIndex);
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-tight"
                              >
                                <Edit2 size={10} /> Override Index
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 mb-2">{finding.description}</p>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Evidence</p>
                          <p className="text-xs text-slate-600 leading-relaxed italic">"{finding.evidence}"</p>
                        </div>
                        {finding.mappingRationale && (
                          <p className="text-[10px] text-slate-400 mt-3 italic">AI Mapping Rationale: {finding.mappingRationale}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          {/* Health Summary & Export */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sections with Issues</p>
                <p className="text-3xl font-black text-amber-600">{healthSummary.totalWithIssues}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">High-Risk Sections</p>
                <p className="text-3xl font-black text-red-600">{healthSummary.highRisk}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Complete Sections</p>
                <p className="text-3xl font-black text-emerald-600">{healthSummary.complete}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">N/A Sections</p>
                <p className="text-3xl font-black text-slate-400">{healthSummary.na}</p>
              </div>
            </div>
            
            <button 
              onClick={() => exportIndexSummaryToCSV(selectedCompany?.name || 'Consolidated', indexSummaryData)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Legend & Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-6 text-xs flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={14} />
                <span className="font-medium text-slate-600">Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={14} />
                <span className="font-medium text-slate-600">Issues Found</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={14} />
                <span className="font-medium text-slate-600">High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="text-slate-400" size={14} />
                <span className="font-medium text-slate-600">Not Applicable (N/A)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-blue-400" size={14} />
                <span className="font-medium text-slate-600">Pending Review</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Filter:</span>
                <select 
                  value={summaryStatusFilter}
                  onChange={(e) => setSummaryStatusFilter(e.target.value as any)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Complete">Complete</option>
                  <option value="Issues Found">Issues Found</option>
                  <option value="High Risk">High Risk</option>
                  <option value="N/A">Not Applicable</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Sort:</span>
                <select 
                  value={summarySortField}
                  onChange={(e) => setSummarySortField(e.target.value as any)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700"
                >
                  <option value="index">By Index</option>
                  <option value="issueCount">By Issue Count</option>
                </select>
                <button 
                  onClick={() => setSummarySortOrder(summarySortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Index Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Index</th>
                    <th className="px-6 py-4 font-semibold">Section Title</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-center">Issues</th>
                    <th className="px-6 py-4 font-semibold">Latest Update</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIndexSummary.map((section) => (
                    <React.Fragment key={section.index}>
                      <tr className={cn(
                        "hover:bg-slate-50 transition-colors cursor-pointer",
                        expandedIndex === section.index && "bg-slate-50"
                      )} onClick={() => setExpandedIndex(expandedIndex === section.index ? null : section.index)}>
                        <td className="px-6 py-4">
                          <span className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                            {section.index}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{section.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold w-fit",
                            getStatusColor(section.status)
                          )}>
                            {getStatusIcon(section.status)}
                            {section.status}
                            {section.isManual && <Settings size={10} className="ml-1 opacity-50" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "text-sm font-bold",
                            section.issueCount > 0 ? "text-blue-600 underline" : "text-slate-400"
                          )}>
                            {section.issueCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {section.latestUpdate ? new Date(section.latestUpdate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-left">
                            <button 
                              onClick={() => setEditingIndexStatus(editingIndexStatus === section.index ? null : section.index)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Settings size={16} />
                            </button>
                            
                            {editingIndexStatus === section.index && (
                              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="text-xs font-bold text-slate-400 uppercase">Override Status: {section.index}</h5>
                                  <button onClick={() => setEditingIndexStatus(null)} className="text-slate-400 hover:text-slate-600">
                                    <CloseIcon size={14} />
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 gap-2">
                                    {(['Complete', 'N/A', 'Pending Review'] as AuditIndexStatus[]).map(status => (
                                      <button
                                        key={status}
                                        onClick={() => {
                                          if (onUpdateIndexStatus && selectedCompany) {
                                            onUpdateIndexStatus(selectedCompany.id, section.index, status, overrideMemo);
                                            setEditingIndexStatus(null);
                                            setOverrideMemo('');
                                          }
                                        }}
                                        className={cn(
                                          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left",
                                          section.status === status ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        )}
                                      >
                                        {getStatusIcon(status)}
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                  <textarea 
                                    placeholder="Add a memo/reason..."
                                    value={overrideMemo}
                                    onChange={(e) => setOverrideMemo(e.target.value)}
                                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-20 resize-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedIndex === section.index && section.issueCount > 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                            <div className="space-y-4">
                              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issues in Section {section.index}</h5>
                              <div className="grid grid-cols-1 gap-3">
                                {findingsByIndex[section.index]?.map((finding) => (
                                  <div key={finding.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className={cn(
                                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                          finding.severity === 'Critical' ? "bg-purple-100 text-purple-700" :
                                          finding.severity === 'High' ? "bg-red-100 text-red-700" :
                                          finding.severity === 'Medium' ? "bg-amber-100 text-amber-700" :
                                          "bg-blue-100 text-blue-700"
                                        )}>
                                          {finding.severity}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500">{finding.standardRef}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400">{new Date(finding.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-800">{finding.description}</p>
                                    <p className="text-xs text-slate-500 mt-2 italic">"{finding.evidence}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
