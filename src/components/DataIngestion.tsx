import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Database,
  Search,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ComplianceCategory, AnalysisResult, Company, MaterialitySettings } from '../types';
import { analyzeCompliance, extractMaterialityBenchmark } from '../services/geminiService';
import { cn } from '../lib/utils';
import { deriveIRDCode, IRD_CODE_LABELS } from '../lib/companyUtils';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
const PDFJS_VERSION = '4.10.38';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

interface DataIngestionProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  onFinancialDataUploaded: (companyId: string, data: { content: string; fileName: string; timestamp: string }) => void;
  companies: Company[];
  onAddCompany: (name: string, yearEnd: string, industry: string, registrationNumber?: string, keyPersonnel?: string) => void;
  onDeleteCompany: (id: string) => void;
}

const CATEGORIES: ComplianceCategory[] = [
  'Accounting', 'Audit', 'Quality Management', 'Ethics & Independence', 'Assurance', 'ESG'
];

export default function DataIngestion({ onAnalysisComplete, onFinancialDataUploaded, companies, onAddCompany, onDeleteCompany }: DataIngestionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<ComplianceCategory>('Accounting');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selectedCompanyId when companies are loaded or changed
  React.useEffect(() => {
    if (!selectedCompanyId && companies.length > 0) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  // New Company Form State
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyYearEnd, setNewCompanyYearEnd] = useState('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('');
  const [newCompanyRegNo, setNewCompanyRegNo] = useState('');
  const [newCompanyKeyPersonnel, setNewCompanyKeyPersonnel] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validExtensions = ['.csv', '.txt', '.json', '.xlsx', '.xls', '.docx', '.pdf'];
      const hasValidExtension = validExtensions.some(ext => droppedFile.name.toLowerCase().endsWith(ext));
      
      if (!hasValidExtension) {
        setError("Unsupported file format. Please upload CSV, TXT, JSON, XLSX, DOCX, or PDF.");
        return;
      }

      if (droppedFile.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.");
        return;
      }

      setFile(droppedFile);
      setError(null);
    }
  };

  const handleAddCompany = () => {
    if (!newCompanyName || !newCompanyYearEnd) return;
    onAddCompany(newCompanyName, newCompanyYearEnd, newCompanyIndustry, newCompanyRegNo, newCompanyKeyPersonnel);
    setNewCompanyName('');
    setNewCompanyYearEnd('');
    setNewCompanyIndustry('');
    setNewCompanyRegNo('');
    setNewCompanyKeyPersonnel('');
    setShowNewCompanyForm(false);
  };

  const processFile = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }
    if (!selectedCompanyId) {
      setError("Please select a target client/company.");
      return;
    }

    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) {
      setError("Selected company not found.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(10);

    try {
      let content = "";
      
      if (file.name.endsWith('.csv')) {
        try {
          content = await new Promise((resolve, reject) => {
            Papa.parse(file, {
              complete: (results) => {
                resolve(JSON.stringify(results.data));
              },
              error: (err) => reject(err),
              header: true
            });
          });
        } catch (e) {
          throw new Error("Failed to parse CSV file. Please ensure it's a valid CSV.");
        }
      } else if (file.name.endsWith('.docx')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
        } catch (e) {
          throw new Error("Failed to parse Word document. Please ensure it's a valid .docx file.");
        }
      } else if (file.name.endsWith('.pdf')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          content = fullText;
        } catch (e) {
          console.error("PDF Parsing Error:", e);
          throw new Error("Failed to parse PDF file. This might be due to a protected file or an unsupported format.");
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          let fullText = '';
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            fullText += `Sheet: ${sheetName}\n`;
            fullText += XLSX.utils.sheet_to_csv(worksheet) + '\n\n';
          });
          content = fullText;
        } catch (e) {
          throw new Error("Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file.");
        }
      } else {
        try {
          content = await file.text();
        } catch (e) {
          throw new Error("Failed to read file content.");
        }
      }

      if (!content || content.trim().length === 0) {
        throw new Error("The file appears to be empty or its content could not be extracted.");
      }

      setProgress(40);
      const result = await analyzeCompliance(content, category, file.name, company);
      
      // Store financial data if file is TB or FS for later materiality calculation
      const fileNameLower = file.name.toLowerCase();
      if (fileNameLower.includes('trial balance') || fileNameLower.includes('tb') || 
          fileNameLower.includes('financial statement') || fileNameLower.includes('fs') || 
          fileNameLower.includes('balance sheet') || fileNameLower.includes('profit and loss')) {
        onFinancialDataUploaded(company.id, {
          content,
          fileName: file.name,
          timestamp: new Date().toISOString()
        });
      }

      setProgress(100);
      
      // Small delay to show 100% progress before switching
      setTimeout(() => {
        onAnalysisComplete(result);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 800);
      
    } catch (err: any) {
      console.error("Analysis Error Details:", err);
      setError(err?.message || "Failed to analyze data. Please check the file format and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Ingest Compliance Data</h3>
        <p className="text-slate-500 mb-8">Upload financial statements, audit working papers, or ESG disclosures for AI-powered compliance monitoring.</p>

        <div className="space-y-6">
          {/* Company Selection */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-700">Target Client / Company</label>
              <button 
                onClick={() => setShowNewCompanyForm(!showNewCompanyForm)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
              >
                {showNewCompanyForm ? 'Cancel' : '+ New Client'}
              </button>
            </div>

            {showNewCompanyForm ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Company Name</label>
                    <input 
                      type="text" 
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp HK"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Financial Year-End</label>
                    <input 
                      type="date" 
                      value={newCompanyYearEnd}
                      onChange={(e) => setNewCompanyYearEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Industry (Optional)</label>
                    <input 
                      type="text" 
                      value={newCompanyIndustry}
                      onChange={(e) => setNewCompanyIndustry(e.target.value)}
                      placeholder="e.g. Manufacturing"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Registration No. (Optional)</label>
                    <input 
                      type="text" 
                      value={newCompanyRegNo}
                      onChange={(e) => setNewCompanyRegNo(e.target.value)}
                      placeholder="e.g. 12345678"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Key Personnel (Optional)</label>
                  <input 
                    type="text" 
                    value={newCompanyKeyPersonnel}
                    onChange={(e) => setNewCompanyKeyPersonnel(e.target.value)}
                    placeholder="e.g. John Doe (Director), Jane Smith (CEO)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button 
                  onClick={handleAddCompany}
                  disabled={!newCompanyName || !newCompanyYearEnd}
                  className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  Register Client
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="" disabled>Select a client...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.irdCode})</option>
                    ))}
                  </select>
                  {selectedCompanyId && (
                    <button 
                      onClick={() => onDeleteCompany(selectedCompanyId)}
                      className="p-2.5 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-xl transition-colors"
                      title="Delete Client Profile"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                {selectedCompanyId && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {companies.find(c => c.id === selectedCompanyId)?.irdCode}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase leading-none">IRD Classification</p>
                      <p className="text-xs font-semibold text-blue-900 mt-1">
                        {IRD_CODE_LABELS[companies.find(c => c.id === selectedCompanyId)?.irdCode || 'N']}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Compliance Framework</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                    category === cat 
                      ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all",
              isDragging ? "border-blue-500 bg-blue-50 ring-4 ring-blue-500/10" : 
              file ? "border-blue-400 bg-blue-50/30" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv,.txt,.json,.xlsx,.docx,.pdf"
            />
            
            {file ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <FileText size={32} />
                </div>
                <p className="font-semibold text-slate-800">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-4 text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <X size={16} /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                  <Upload size={32} />
                </div>
                <p className="font-semibold text-slate-800">Click or drag file to upload</p>
                <p className="text-sm text-slate-500 mt-1">Supports CSV, TXT, JSON, XLSX, DOCX, PDF (Max 10MB)</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            disabled={!file || isAnalyzing}
            onClick={processFile}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
              !file || isAnalyzing 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing with AI... {progress}%
              </>
            ) : (
              <>
                <Search size={20} />
                Start Compliance Check
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl">
          <Database className="text-blue-400 mb-4" size={24} />
          <h4 className="font-bold mb-2">Structured Data Support</h4>
          <p className="text-slate-400 text-sm">Directly ingest ERP exports from SAP, Oracle, or custom Excel templates for HKFRS valuation checks.</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl">
          <ShieldCheck className="text-emerald-500 mb-4" size={24} />
          <h4 className="font-bold mb-2 text-slate-800">Professional Standards</h4>
          <p className="text-slate-500 text-sm">Our AI is trained on HKICPA frameworks to ensure accurate detection of non-compliance in audit procedures.</p>
        </div>
      </div>
    </div>
  );
}
