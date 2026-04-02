import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  FileCode, 
  File as FileIcon,
  CheckCircle2,
  Clock,
  FileJson,
  Search,
  BookOpen,
  AlertCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AnalysisResult, Company } from '../types';
import { cn } from '../lib/utils';

interface ReportsProps {
  history: AnalysisResult[];
  selectedCompany?: Company;
}

export default function Reports({ history }: ReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(result => 
    result.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToPDF = (result: AnalysisResult) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Compliance Analysis Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Company: ${result.companyName} (${result.irdCode})`, 20, 35);
    doc.text(`File: ${result.fileName}`, 20, 45);
    doc.text(`Category: ${result.category}`, 20, 55);
    doc.text(`Status: ${result.status}`, 20, 65);
    doc.text(`Severity: ${result.severity}`, 20, 75);
    doc.text(`Date: ${new Date(result.timestamp).toLocaleString()}`, 20, 85);
    
    doc.text('Summary:', 20, 100);
    const splitSummary = doc.splitTextToSize(result.summary, 170);
    doc.text(splitSummary, 20, 110);

    let y = 140;
    doc.text('Findings:', 20, y);
    y += 10;
    result.findings?.forEach((f, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.text(`${i + 1}. [${f.standardRef}] ${f.description}`, 20, y);
      y += 10;
    });

    doc.save(`Compliance_Report_${result.fileName.split('.')[0]}.pdf`);
  };

  const exportToWord = (result: AnalysisResult) => {
    const content = `Compliance Report: ${result.fileName}\nCompany: ${result.companyName} (${result.irdCode})\nDate: ${new Date(result.timestamp).toLocaleString()}\nStatus: ${result.status}\nSeverity: ${result.severity}\n\nSummary:\n${result.summary}\n\nFindings:\n${result.findings?.map(f => `- [${f.standardRef}] ${f.description}`).join('\n')}`;
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${result.fileName.split('.')[0]}.doc`;
    a.click();
  };

  const exportToText = (result: AnalysisResult) => {
    const content = `Compliance Report: ${result.fileName}\nCompany: ${result.companyName} (${result.irdCode})\nDate: ${new Date(result.timestamp).toLocaleString()}\nStatus: ${result.status}\nSeverity: ${result.severity}\n\nSummary:\n${result.summary}\n\nFindings:\n${result.findings?.map(f => `- [${f.standardRef}] ${f.description}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${result.fileName.split('.')[0]}.txt`;
    a.click();
  };

  const handleConsolidateData = () => {
    const content = history.map(result => (
      `Analysis: ${result.fileName}\nCompany: ${result.companyName} (${result.irdCode})\nCategory: ${result.category}\nStatus: ${result.status}\nFindings: ${result.findings?.length || 0}\n-----------------------------------\n`
    )).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consolidated_Compliance_Data_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Reports & Export</h3>
          <p className="text-slate-500">Generate auditor-ready documentation and export compliance data.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHistory.map((result) => (
          <div key={result.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                    <FileIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600 border border-blue-200">
                        {result.irdCode}
                      </span>
                      <span className="text-xs font-bold text-blue-600">{result.companyName}</span>
                    </div>
                    <h4 className="font-bold text-lg text-slate-900 leading-tight">{result.fileName}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider",
                    result.status === 'Compliant' ? "bg-emerald-100 text-emerald-700" : 
                    result.status === 'Non-Compliant' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {result.status}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider",
                    result.severity === 'Critical' ? "bg-purple-100 text-purple-700" :
                    result.severity === 'High' ? "bg-red-100 text-red-700" :
                    result.severity === 'Medium' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {result.severity} Severity
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Category</span>
                  <span className="text-sm font-semibold text-slate-700">{result.category}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Findings</span>
                  <span className="text-sm font-semibold text-slate-700">{result.findings?.length || 0} Issues</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Executive Summary</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 italic">
                  "{result.summary}"
                </p>
              </div>
            </div>
            
            <div className="p-6 flex-1">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertCircle size={14} /> Top Findings
              </h5>
              <div className="space-y-3">
                {result.findings?.slice(0, 2).map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="mt-1">
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">[{finding.standardRef}]</span>
                      <p className="text-xs text-slate-700 font-medium line-clamp-2">{finding.description}</p>
                    </div>
                  </div>
                ))}
                {(!result.findings || result.findings.length === 0) && (
                  <div className="text-center py-4 text-slate-400 text-xs italic">
                    No findings recorded for this analysis.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-3">
              <button 
                onClick={() => exportToPDF(result)}
                className="flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
              >
                <Download size={14} className="text-red-500" /> PDF
              </button>
              <button 
                onClick={() => exportToWord(result)}
                className="flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
              >
                <FileCode size={14} className="text-blue-500" /> Word
              </button>
              <button 
                onClick={() => exportToText(result)}
                className="flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
              >
                <FileText size={14} className="text-slate-500" /> Text
              </button>
            </div>
          </div>
        ))}
        {filteredHistory.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No reports matching your search. Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Batch Export Card */}
      {history.length > 0 && (
        <div className="bg-[#1E293B] text-white p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600 rounded-2xl">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-xl font-bold">Ready for Regulatory Review?</h4>
              <p className="text-slate-400 text-sm">Export all findings from this session into a single consolidated audit file.</p>
            </div>
          </div>
          <button 
            onClick={handleConsolidateData}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40"
          >
            Consolidate Session Data
          </button>
        </div>
      )}
    </div>
  );
}
