import React from 'react';
import { Finding, AuditProcedure } from '../types';
import { BookOpen, CheckCircle2, ChevronRight, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AuditProceduresProps {
  finding: Finding;
  onAcceptProcedure: (procedure: AuditProcedure) => void;
  onDismissProcedure: (procedureId: string) => void;
}

export const AuditProcedures: React.FC<AuditProceduresProps> = ({ finding, onAcceptProcedure, onDismissProcedure }) => {
  const procedures = finding.suggestedProcedures || [];

  if (procedures.length === 0) {
    return (
      <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
        <div className="p-3 bg-white rounded-full w-fit mx-auto mb-4 shadow-sm border border-slate-100">
          <AlertTriangle className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">No Automated Procedures Suggested</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
          The AI analysis did not identify specific audit procedures for this finding. 
          Consider manual risk assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Suggested Audit Procedures</h3>
        </div>
        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
          {procedures.length} SUGGESTIONS
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {procedures.map((proc, idx) => (
          <motion.div
            key={proc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="p-4 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-tighter">
                      {proc.hksaRef}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase tracking-tighter">
                      {proc.assertion}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase tracking-tighter">
                      {proc.timing}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                    {proc.description}
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onAcceptProcedure(proc)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Accept Procedure"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDismissProcedure(proc.id)}
                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Dismiss"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Work Programme Item</div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{proc.suggestedWorkProgramme}"
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-indigo-600 hover:underline cursor-pointer">
                  <ExternalLink className="w-3 h-3" />
                  View Standard Text
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                  Ref: {proc.hksaRef}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
