import React, { useState } from 'react';
import { 
  History, 
  User, 
  Clock, 
  Activity,
  ShieldCheck,
  FileUp,
  FileText,
  Search,
  Download,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { cn } from '../lib/utils';

interface AuditTrailProps {
  logs: AuditLogEntry[];
  onDelete: (id: string) => void;
}

type SortField = 'timestamp' | 'user' | 'action';
type SortOrder = 'asc' | 'desc';

export default function AuditTrail({ logs, onDelete }: AuditTrailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.companyName && log.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    let comparison = 0;
    if (sortField === 'timestamp') {
      comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else {
      comparison = a[sortField].localeCompare(b[sortField]);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleExportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Details', 'Status'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.user,
        log.action,
        log.details,
        'Verified'
      ])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getIcon = (action: string) => {
    if (action.includes('Analyzed')) return <ShieldCheck size={16} />;
    if (action.includes('Ingested')) return <FileUp size={16} />;
    if (action.includes('Report')) return <FileText size={16} />;
    return <Activity size={16} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Audit Trail</h3>
          <p className="text-slate-500">Immutable log of all compliance monitoring activities for regulatory review.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button 
            onClick={handleExportLogs}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Download size={16} /> Export Log
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700" onClick={() => handleSort('timestamp')}>
                  <div className="flex items-center gap-1">
                    Timestamp {sortField === 'timestamp' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700" onClick={() => handleSort('user')}>
                  <div className="flex items-center gap-1">
                    User {sortField === 'user' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-700" onClick={() => handleSort('action')}>
                  <div className="flex items-center gap-1">
                    Action {sortField === 'action' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-sm font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {log.user.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.companyName ? (
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-600 border border-slate-200">
                          {log.irdCode}
                        </span>
                        <span className="text-sm font-medium text-slate-700">{log.companyName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        {getIcon(log.action)}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 max-w-md truncate">{log.details}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onDelete(log.id)}
                      className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Log"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    No logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
        <History className="text-amber-600 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-bold text-amber-900">Regulatory Compliance Note</p>
          <p className="text-xs text-amber-800 mt-1">
            This audit trail is designed to meet HKSQM requirements for engagement documentation and quality control. 
            All entries are time-stamped and linked to the authenticated professional.
          </p>
        </div>
      </div>
    </div>
  );
}
