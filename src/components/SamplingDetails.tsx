import React from 'react';
import { SamplingAnalysis } from '../types';
import { cn } from '../lib/utils';
import { BarChart3, AlertCircle, CheckCircle2, Info, ArrowRight } from 'lucide-react';

interface SamplingDetailsProps {
  analysis: SamplingAnalysis;
  onOverride?: (newSize: number, reason: string) => void;
}

export function SamplingDetails({ analysis, onOverride }: SamplingDetailsProps) {
  const [isOverriding, setIsOverriding] = React.useState(false);
  const [overrideSize, setOverrideSize] = React.useState(analysis.manualOverrideSize || analysis.calculatedSampleSize);
  const [reason, setReason] = React.useState(analysis.overrideReason || '');

  const handleSaveOverride = () => {
    if (onOverride) {
      onOverride(overrideSize, reason);
      setIsOverriding(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-600" />
          <h5 className="text-sm font-bold text-slate-800 uppercase tracking-tight">HKSA 530 Sampling Analysis</h5>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
          analysis.sufficiencyStatus === 'Sufficient' ? "bg-emerald-100 text-emerald-700" :
          analysis.sufficiencyStatus === 'Insufficient' ? "bg-red-100 text-red-700" :
          "bg-slate-200 text-slate-600"
        )}>
          {analysis.sufficiencyStatus === 'Sufficient' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {analysis.sufficiencyStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Population</span>
          <p className="text-xs font-semibold text-slate-700">{analysis.populationDescription}</p>
          <p className="text-[10px] text-slate-500">{analysis.populationSize.toLocaleString()} items / HKD {analysis.populationValue?.toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tolerable Misstatement</span>
          <p className="text-xs font-semibold text-slate-700">HKD {analysis.tolerableMisstatement.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500">Based on PM</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Sample Size</span>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-slate-900">{analysis.calculatedSampleSize}</p>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-bold">
              {analysis.method}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actual Sample Size</span>
          <p className={cn(
            "text-lg font-bold",
            analysis.actualSampleSize === undefined ? "text-slate-400" :
            analysis.actualSampleSize < analysis.calculatedSampleSize ? "text-red-600" : "text-emerald-600"
          )}>
            {analysis.actualSampleSize ?? 'Not Provided'}
          </p>
        </div>
      </div>

      {analysis.sufficiencyStatus === 'Insufficient' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-red-800 leading-relaxed">
            <strong>HKSA 530 Deficiency:</strong> The actual sample size is below the statistically required minimum. This increases the risk that the auditor's conclusion based on a sample may be different from the conclusion if the entire population were subjected to the same audit procedure.
          </div>
        </div>
      )}

      {isOverriding ? (
        <div className="p-4 bg-white rounded-xl border border-blue-200 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h6 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Manual Override (Professional Judgment)</h6>
            <button onClick={() => setIsOverriding(false)} className="text-slate-400 hover:text-slate-600">
              <Info size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">New Sample Size</label>
              <input 
                type="number" 
                value={overrideSize}
                onChange={(e) => setOverrideSize(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Rationale for Override</label>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain professional judgment..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-10"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsOverriding(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveOverride}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm"
            >
              Save Override
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {analysis.isOverride && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                <ArrowRight size={10} />
                OVERRIDDEN: {analysis.manualOverrideSize}
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsOverriding(true)}
            className="text-[10px] font-bold text-blue-600 hover:underline"
          >
            {analysis.isOverride ? 'Edit Override' : 'Manual Override'}
          </button>
        </div>
      )}
    </div>
  );
}
