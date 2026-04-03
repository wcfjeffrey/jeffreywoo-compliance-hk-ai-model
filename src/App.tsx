import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileUp, 
  ShieldCheck, 
  History, 
  FileText, 
  Settings,
  AlertTriangle,
  CheckCircle2,
  Info,
  Menu,
  X,
  LogOut,
  Calculator,
  Building2,
  ChevronDown,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import DataIngestion from './components/DataIngestion';
import ComplianceAnalysis from './components/ComplianceAnalysis';
import AuditTrail from './components/AuditTrail';
import Reports from './components/Reports';
import { MaterialityEngine } from './components/MaterialityEngine';
import { RegulatoryInspection } from './components/RegulatoryInspection';
import { AnalysisResult, AuditLogEntry, Company, IRDCode, BackgroundCheckResult, Finding, AuditIndexStatus, MaterialitySettings } from './types';
import { deriveIRDCode } from './lib/companyUtils';
import { performBackgroundCheck, reassignIndex } from './services/geminiService';

type View = 'dashboard' | 'ingestion' | 'analysis' | 'audit' | 'reports' | 'settings' | 'materiality' | 'inspection';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [backgroundChecks, setBackgroundChecks] = useState<BackgroundCheckResult[]>([]);
  
  // Multi-Company State
  const [companies, setCompanies] = useState<Company[]>([
    { id: '1', name: 'Global Tech HK', yearEnd: '2025-12-31', irdCode: 'D', industry: 'Technology' },
    { id: '2', name: 'Asia Logistics Ltd', yearEnd: '2025-03-31', irdCode: 'M', industry: 'Logistics' },
    { id: '3', name: 'Pacific Retail Group', yearEnd: '2025-06-30', irdCode: 'N', industry: 'Retail' }
  ]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const addAuditLog = (action: string, details: string, companyId?: string) => {
    const company = companies.find(c => c.id === companyId);
    const newLog: AuditLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user: 'jeffreywoocf@gmail.com',
      action,
      details,
      companyId,
      companyName: company?.name,
      irdCode: company?.irdCode
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    console.log("Analysis Complete:", result);
    setAnalysisHistory(prev => {
      const newHistory = [result, ...prev];
      console.log("Updated Analysis History Count:", newHistory.length);
      return newHistory;
    });
    addAuditLog('Compliance Check', `Analyzed ${result.fileName} for ${result.category}`, result.companyId);
    setCurrentView('analysis');
  };

  const handleUpdateFinding = (analysisId: string, findingId: string, newIndex: string) => {
    setAnalysisHistory(prev => prev.map(analysis => {
      if (analysis.id === analysisId) {
        return {
          ...analysis,
          findings: (analysis.findings || []).map(finding => {
            if (finding.id === findingId) {
              const oldIndex = finding.assignedIndex;
              addAuditLog('Manual Override', `Changed index for finding in ${analysis.fileName} from ${oldIndex} to ${newIndex}`, analysis.companyId);
              return { ...finding, assignedIndex: newIndex, mappingRationale: `Manual override from ${oldIndex} to ${newIndex}` };
            }
            return finding;
          })
        };
      }
      return analysis;
    }));
  };

  const handleUpdateFindingStatus = (analysisId: string, findingId: string, status: 'Open' | 'Resolved' | 'Closed') => {
    setAnalysisHistory(prev => prev.map(analysis => {
      if (analysis.id === analysisId) {
        return {
          ...analysis,
          findings: (analysis.findings || []).map(finding => {
            if (finding.id === findingId) {
              addAuditLog('Finding Status Update', `Changed status for finding in ${analysis.fileName} to ${status}`, analysis.companyId);
              return { ...finding, status };
            }
            return finding;
          })
        };
      }
      return analysis;
    }));
  };

  const handleUpdateIndexStatus = (companyId: string, index: string, status: AuditIndexStatus, memo: string) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        const oldStatus = c.indexOverrides?.[index]?.status || 'Auto';
        addAuditLog('Index Status Override', `Changed status for section ${index} from ${oldStatus} to ${status}. Memo: ${memo}`, companyId);
        return {
          ...c,
          indexOverrides: {
            ...(c.indexOverrides || {}),
            [index]: {
              status,
              memo,
              timestamp: new Date().toISOString(),
              userId: 'jeffreywoocf@gmail.com'
            }
          }
        };
      }
      return c;
    }));
  };

  const handleUpdateMateriality = (companyId: string, settings: MaterialitySettings) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        addAuditLog(
          'Materiality Updated', 
          `Updated materiality thresholds. Overall: ${settings.overallMateriality.toLocaleString()}, Performance: ${settings.performanceMateriality.toLocaleString()}, Trivial: ${settings.clearlyTrivialThreshold.toLocaleString()}`, 
          companyId
        );
        return { ...c, materiality: settings };
      }
      return c;
    }));
  };

  const handleFinancialDataUploaded = (companyId: string, data: { content: string; fileName: string; timestamp: string }) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        return { ...c, financialData: data };
      }
      return c;
    }));
  };

  const handleReprocessHistory = async () => {
    addAuditLog('Reprocess Started', 'Initiating automated re-processing of all historical findings to assign HKICPA index sections.');
    
    const updatedHistory = await Promise.all(analysisHistory.map(async (analysis) => {
      const updatedFindings = await Promise.all((analysis.findings || []).map(async (finding) => {
        if (!finding.assignedIndex || finding.assignedIndex === 'X') {
          const { assignedIndex, mappingRationale } = await reassignIndex(finding);
          return { ...finding, assignedIndex, mappingRationale };
        }
        return finding;
      }));
      return { ...analysis, findings: updatedFindings };
    }));

    setAnalysisHistory(updatedHistory);
    addAuditLog('Reprocess Completed', 'Successfully re-processed historical findings and assigned HKICPA index sections.');
  };

  const handleRunBackgroundCheck = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    addAuditLog('Background Check Started', `Initiating automated background check for ${company.name}`, companyId);
    
    try {
      const result = await performBackgroundCheck(company);
      setBackgroundChecks(prev => [result, ...prev.filter(bc => bc.companyId !== companyId)]);
      
      // Update company risk rating and last check date
      setCompanies(prev => prev.map(c => c.id === companyId ? {
        ...c,
        riskRating: result.riskRating,
        lastBackgroundCheck: result.timestamp
      } : c));

      addAuditLog('Background Check Completed', `Background check for ${company.name} completed. Risk Rating: ${result.riskRating}`, companyId);
    } catch (error: any) {
      console.error("Background Check Failed:", error);
      const isQuotaExceeded = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429');
      const errorMessage = isQuotaExceeded 
        ? `Background check failed due to API quota limits. Please try again later or check your Gemini API billing.`
        : `Automated background check for ${company.name} failed.`;
      
      addAuditLog('Background Check Failed', errorMessage, companyId);
      alert(errorMessage);
    }
  };

  const handleAddCompany = (name: string, yearEnd: string, industry: string, registrationNumber?: string, keyPersonnel?: string) => {
    const newCompanyId = Math.random().toString(36).substr(2, 9);
    const personnelArray = keyPersonnel ? keyPersonnel.split(',').map(p => p.trim()).filter(p => p !== '') : [];
    
    const newCompany: Company = {
      id: newCompanyId,
      name,
      yearEnd,
      irdCode: deriveIRDCode(yearEnd),
      industry,
      registrationNumber,
      keyPersonnel: personnelArray
    };
    setCompanies(prev => [...prev, newCompany]);
    addAuditLog('Add Company', `Added new client: ${name}`, newCompanyId);
    
    // Trigger background check automatically
    handleRunBackgroundCheck(newCompanyId);
  };

  const handleDeleteCompany = (id: string) => {
    const company = companies.find(c => c.id === id);
    if (!company) return;
    
    if (window.confirm(`Are you sure you want to delete ${company.name}? This will remove the company profile. Analysis history will be preserved but unlinked.`)) {
      setCompanies(prev => prev.filter(c => c.id !== id));
      if (selectedCompanyId === id) setSelectedCompanyId('all');
      addAuditLog('Delete Company', `Deleted client profile: ${company.name}`, id);
    }
  };

  const handleDeleteAnalysis = (id: string) => {
    const resultToDelete = analysisHistory.find(h => h.id === id);
    if (resultToDelete) {
      setAnalysisHistory(prev => prev.filter(h => h.id !== id));
      addAuditLog('Delete Analysis', `Deleted analysis for ${resultToDelete.fileName}`);
    }
  };

  const handleDeleteLog = (id: string) => {
    setAuditLogs(prev => prev.filter(log => log.id !== id));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materiality', label: 'Materiality', icon: Calculator },
    { id: 'ingestion', label: 'Data Ingestion', icon: FileUp },
    { id: 'analysis', label: 'Compliance Analysis', icon: ShieldCheck },
    { id: 'inspection', label: 'Regulatory View', icon: ShieldCheck },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-[#1E293B] text-white flex flex-col transition-all duration-300 ease-in-out z-20"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">J</div>
              <span className="font-bold text-lg tracking-tight">JeffreyWoo Compliance HK</span>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} className="mx-auto" />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                currentView === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button className="w-full flex items-center gap-3 p-3 text-slate-400 hover:text-white transition-colors">
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-semibold text-slate-800 capitalize">
              {navItems.find(i => i.id === currentView)?.label || currentView}
            </h2>
            
            {/* Company Selector */}
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                <Building2 size={18} />
              </div>
              <div className="relative group">
                <select 
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="appearance-none bg-transparent pr-8 pl-1 py-1 text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Companies (Consolidated)</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.irdCode})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">Jeffrey Woo</span>
              <span className="text-xs text-slate-500">Senior Auditor</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
              JW
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {currentView === 'dashboard' && (
                <Dashboard 
                  history={selectedCompanyId === 'all' ? analysisHistory : analysisHistory.filter(h => h.companyId === selectedCompanyId)} 
                  selectedCompany={selectedCompany}
                  backgroundCheck={backgroundChecks.find(bc => bc.companyId === selectedCompanyId)}
                  onRunBackgroundCheck={selectedCompanyId !== 'all' ? () => handleRunBackgroundCheck(selectedCompanyId) : undefined}
                  onUpdateFinding={handleUpdateFinding}
                  onUpdateFindingStatus={handleUpdateFindingStatus}
                  onUpdateIndexStatus={handleUpdateIndexStatus}
                  onReprocessAll={handleReprocessHistory}
                />
              )}
              {currentView === 'ingestion' && (
                <DataIngestion 
                  onAnalysisComplete={handleAnalysisComplete} 
                  onFinancialDataUploaded={handleFinancialDataUploaded}
                  companies={companies}
                  onAddCompany={handleAddCompany}
                  onDeleteCompany={handleDeleteCompany}
                />
              )}
              {currentView === 'analysis' && (
                <ComplianceAnalysis 
                  history={selectedCompanyId === 'all' ? analysisHistory : analysisHistory.filter(h => h.companyId === selectedCompanyId)} 
                  onDelete={handleDeleteAnalysis}
                  onUpdateFindingStatus={handleUpdateFindingStatus}
                  onLogAction={addAuditLog}
                />
              )}
              {currentView === 'materiality' && selectedCompany && (
                <MaterialityEngine 
                  company={selectedCompany} 
                  onUpdateMateriality={(settings) => handleUpdateMateriality(selectedCompany.id, settings)} 
                />
              )}
              {currentView === 'materiality' && !selectedCompany && (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-900">Select a Company</h2>
                  <p className="text-slate-500 mt-2">Please select a specific company from the header to manage materiality settings.</p>
                </div>
              )}
              {currentView === 'inspection' && (
                <RegulatoryInspection 
                  company={selectedCompany || companies[0]} 
                  analyses={selectedCompanyId === 'all' ? analysisHistory : analysisHistory.filter(h => h.companyId === selectedCompanyId)}
                  auditLogs={selectedCompanyId === 'all' ? auditLogs : auditLogs.filter(l => l.companyId === selectedCompanyId)}
                  materiality={selectedCompany?.materiality}
                  backgroundCheck={backgroundChecks.find(bc => bc.companyId === selectedCompanyId)}
                />
              )}
              {currentView === 'reports' && (
                <Reports 
                  history={selectedCompanyId === 'all' ? analysisHistory : analysisHistory.filter(h => h.companyId === selectedCompanyId)} 
                  selectedCompany={selectedCompany}
                />
              )}
              {currentView === 'audit' && (
                <AuditTrail 
                  logs={selectedCompanyId === 'all' ? auditLogs : auditLogs.filter(l => l.companyId === selectedCompanyId)} 
                  onDelete={handleDeleteLog}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
