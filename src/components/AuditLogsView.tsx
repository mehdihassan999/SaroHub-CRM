import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, users } = useCRM();

  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filtered = auditLogs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch =
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-slate-700" />
            CRM Security & Activity Audit Log
          </h2>
          <p className="text-xs text-slate-500">
            Immutable log tracking lead creation, ownership changes, duplicate blocks, and outreach events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs focus:border-slate-400 focus:bg-white focus:outline-hidden"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Event Types</option>
            <option value="Lead Created">Lead Created</option>
            <option value="Duplicate Prevented">Duplicate Prevented</option>
            <option value="Status Change">Status Change</option>
            <option value="Technical Escalation">Technical Escalation</option>
            <option value="Technical Answered">Technical Answered</option>
            <option value="Handover Requested">Handover Requested</option>
            <option value="Follow-up Completed">Follow-up Completed</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No audit records matching filter.
            </div>
          ) : (
            filtered.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs hover:bg-slate-50 transition"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                      log.action === 'Duplicate Prevented'
                        ? 'bg-rose-100 text-rose-800'
                        : log.action.includes('Technical')
                        ? 'bg-indigo-100 text-indigo-800'
                        : log.action.includes('Handover')
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {log.action}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span className="text-slate-600 ml-1.5">{log.details}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0 font-mono">
                  <Clock className="h-3 w-3" />
                  {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
