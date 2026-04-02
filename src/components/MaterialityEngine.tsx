import React, { useState, useEffect } from 'react';
import { Company, MaterialitySettings } from '../types';
import { Calculator, Save, AlertCircle, CheckCircle2, RotateCcw, Database, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { extractMaterialityBenchmark } from '../services/geminiService';

interface MaterialityEngineProps {
  company: Company;
  onUpdateMateriality: (settings: MaterialitySettings) => void;
}

const BENCHMARKS = [
  { label: 'Profit Before Tax', value: 'Profit Before Tax', range: '3% - 7%' },
  { label: 'Revenue', value: 'Revenue', range: '0.5% - 1%' },
  { label: 'Total Assets', value: 'Total Assets', range: '0.5% - 2%' },
  { label: 'Net Assets', value: 'Net Assets', range: '1% - 5%' },
  { label: 'Custom', value: 'Custom', range: 'N/A' },
];

export const MaterialityEngine: React.FC<MaterialityEngineProps> = ({ company, onUpdateMateriality }) => {
  const [settings, setSettings] = useState<MaterialitySettings>(
    company.materiality || {
      overallMateriality: 0,
      performanceMateriality: 0,
      clearlyTrivialThreshold: 0,
      benchmark: 'Revenue',
      benchmarkValue: 0,
      percentage: 0.75,
      performancePercentage: 75,
      clearlyTrivialPercentage: 5,
      lastUpdated: new Date().toISOString(),
    }
  );

  const [saved, setSaved] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (company.materiality) {
      setSettings(company.materiality);
    } else {
      setSettings({
        overallMateriality: 0,
        performanceMateriality: 0,
        clearlyTrivialThreshold: 0,
        benchmark: 'Revenue',
        benchmarkValue: 0,
        percentage: 0.75,
        performancePercentage: 75,
        clearlyTrivialPercentage: 5,
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [company.id, company.materiality]);

  useEffect(() => {
    const overall = (settings.benchmarkValue * settings.percentage) / 100;
    const performance = (overall * settings.performancePercentage) / 100;
    const trivial = (overall * settings.clearlyTrivialPercentage) / 100;

    setSettings(prev => ({
      ...prev,
      overallMateriality: overall,
      performanceMateriality: performance,
      clearlyTrivialThreshold: trivial,
    }));
  }, [settings.benchmarkValue, settings.percentage, settings.performancePercentage, settings.clearlyTrivialPercentage]);

  const handleSave = () => {
    onUpdateMateriality({
      ...settings,
      lastUpdated: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaultSettings: MaterialitySettings = {
      overallMateriality: 0,
      performanceMateriality: 0,
      clearlyTrivialThreshold: 0,
      benchmark: 'Revenue',
      benchmarkValue: 0,
      percentage: 0.75,
      performancePercentage: 75,
      clearlyTrivialPercentage: 5,
      lastUpdated: new Date().toISOString(),
    };
    setSettings(defaultSettings);
    onUpdateMateriality(defaultSettings);
  };

  const handleFetchFromFinancialData = async () => {
    if (!company.financialData) return;
    
    setIsExtracting(true);
    try {
      const extracted = await extractMaterialityBenchmark(
        company.financialData.content,
        company.financialData.fileName,
        company
      );
      
      // Use the value for the currently selected benchmark if available in allBenchmarks
      const currentBenchmark = settings.benchmark;
      let extractedValue = 0;
      
      if (extracted.allBenchmarks && extracted.allBenchmarks[currentBenchmark as string]) {
        extractedValue = extracted.allBenchmarks[currentBenchmark as string];
      } else if (extracted.benchmark === currentBenchmark) {
        extractedValue = extracted.benchmarkValue || 0;
      } else {
        // Fallback to whatever the AI thought was best if current selection not found
        extractedValue = extracted.benchmarkValue || 0;
        // Also update the benchmark selection to match what was found if we had to fallback
        setSettings(prev => ({ ...prev, benchmark: extracted.benchmark as any }));
      }

      if (extractedValue > 0) {
        // Default percentages based on standard audit practice
        const defaultPercentages: Record<string, number> = {
          "Profit Before Tax": 5,
          "Revenue": 0.75,
          "Total Assets": 1,
          "Net Assets": 2
        };

        const percentage = defaultPercentages[currentBenchmark as string] || settings.percentage;
        const overall = (extractedValue * percentage) / 100;

        setSettings(prev => ({
          ...prev,
          benchmarkValue: extractedValue,
          percentage: percentage,
          overallMateriality: overall,
          performanceMateriality: overall * (prev.performancePercentage / 100),
          clearlyTrivialThreshold: overall * (prev.clearlyTrivialPercentage / 100),
        }));
      }
    } catch (error) {
      console.error("Failed to extract materiality from financial data:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 border-bottom border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Materiality Calculation Engine</h2>
              <p className="text-sm text-slate-500">Determine quantitative thresholds for {company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                saved 
                  ? "bg-green-100 text-green-700" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              )}
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Benchmark Selection</label>
            <div className="grid grid-cols-2 gap-2">
              {BENCHMARKS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setSettings({ ...settings, benchmark: b.value as any })}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-all text-left",
                    settings.benchmark === b.value
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  )}
                >
                  <div className="font-medium">{b.label}</div>
                  <div className="text-xs opacity-60">{b.range}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Benchmark Value (HKD)
              </label>
              {company.financialData && (
                <button
                  onClick={handleFetchFromFinancialData}
                  disabled={isExtracting}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title={`Last uploaded: ${company.financialData.fileName}`}
                >
                  {isExtracting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Database className="w-3 h-3" />
                  )}
                  Fetch from TB/FS
                </button>
              )}
            </div>
            <input
              type="number"
              value={settings.benchmarkValue}
              onChange={(e) => setSettings({ ...settings, benchmarkValue: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Enter amount..."
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Overall Materiality (%)</label>
              <span className="text-sm font-semibold text-indigo-600">{settings.percentage}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={settings.percentage}
              onChange={(e) => setSettings({ ...settings, percentage: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Performance Materiality (% of Overall)</label>
              <span className="text-sm font-semibold text-indigo-600">{settings.performancePercentage}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="1"
              value={settings.performancePercentage}
              onChange={(e) => setSettings({ ...settings, performancePercentage: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">Typically 50% - 75% depending on risk level</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Clearly Trivial Threshold (% of Overall)</label>
              <span className="text-sm font-semibold text-indigo-600">{settings.clearlyTrivialPercentage}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={settings.clearlyTrivialPercentage}
              onChange={(e) => setSettings({ ...settings, clearlyTrivialPercentage: Number(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">Typically 1% - 5% of Overall Materiality</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">Calculated Thresholds</h3>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-600">Overall Materiality</div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(settings.overallMateriality)}</div>
                <p className="text-xs text-slate-500 mt-1">Based on {settings.percentage}% of {settings.benchmark}</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <AlertCircle className="w-5 h-5 text-indigo-500" />
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase">Performance</div>
                <div className="text-lg font-bold text-slate-900">{formatCurrency(settings.performanceMateriality)}</div>
                <p className="text-[10px] text-slate-400">{settings.performancePercentage}% of Overall</p>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase">Clearly Trivial</div>
                <div className="text-lg font-bold text-slate-900">{formatCurrency(settings.clearlyTrivialThreshold)}</div>
                <p className="text-[10px] text-slate-400">{settings.clearlyTrivialPercentage}% of Overall</p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                <p className="text-xs text-indigo-800 leading-relaxed">
                  These thresholds will be used to triage identified compliance anomalies. 
                  Issues exceeding <strong>Performance Materiality</strong> will be flagged as <strong>High</strong> or <strong>Critical</strong> priority.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
