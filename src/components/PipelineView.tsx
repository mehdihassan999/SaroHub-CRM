import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  KanbanSquare,
  Users,
  Flame,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  Clock,
  Plus,
} from 'lucide-react';
import { Lead, LeadStatus } from '../types/crm';

interface PipelineViewProps {
  onSelectLead: (leadId: string) => void;
  onOpenNewLead: () => void;
}

const STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'New', label: 'New Leads', color: 'border-slate-300' },
  { id: 'Contact Ready', label: 'Contact Ready', color: 'border-blue-300' },
  { id: 'Contacted', label: 'Contacted', color: 'border-blue-500' },
  { id: 'Responded', label: 'Responded', color: 'border-emerald-400' },
  { id: 'Qualified', label: 'Qualified', color: 'border-emerald-600' },
  { id: 'Requirements Collected', label: 'Requirements', color: 'border-indigo-400' },
  { id: 'Technical Review', label: 'Tech Review', color: 'border-indigo-600' },
  { id: 'Proposal Sent', label: 'Proposal Sent', color: 'border-amber-500' },
  { id: 'Won', label: 'Won Deals', color: 'border-emerald-700 bg-emerald-50/20' },
  { id: 'Lost', label: 'Lost / Closed', color: 'border-rose-300' },
];

export const PipelineView: React.FC<PipelineViewProps> = ({ onSelectLead, onOpenNewLead }) => {
  const { leads, users, currentUser, updateLead, addTimelineEvent } = useCRM();

  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = leads.filter((lead) => {
    const matchesOwner = selectedOwnerId === 'ALL' || lead.assignedInternId === selectedOwnerId;
    const matchesSearch =
      lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesOwner && matchesSearch;
  });

  const handleMoveStage = (leadId: string, currentStatus: LeadStatus, direction: 'forward' | 'backward') => {
    const currentIndex = STAGES.findIndex((s) => s.id === currentStatus);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < STAGES.length) {
      const nextStatus = STAGES[nextIndex].id;
      updateLead(leadId, { status: nextStatus });
      addTimelineEvent({
        leadId,
        userId: currentUser.id,
        type: 'Status Change',
        content: `Moved pipeline stage from ${currentStatus} to ${nextStatus}`,
        isInternal: true,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KanbanSquare className="h-5 w-5 text-emerald-600" />
            SaroHub Sales Pipeline Board
          </h2>
          <p className="text-xs text-slate-500">
            Track lead lifecycle progression from first outreach to executive closing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Owner Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="ALL">All Team Members ({leads.length})</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search board..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-36 sm:w-48 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          <button
            onClick={onOpenNewLead}
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 flex items-center gap-1 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            New Lead
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Kanban Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1 items-start min-h-[70vh]">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
          const stageTotalEst = stageLeads.reduce((acc, l) => {
            const num = parseInt((l.estimatedBudget || '').replace(/[^\d]/g, ''), 10) || 0;
            return acc + num;
          }, 0);

          return (
            <div
              key={stage.id}
              className={`w-72 shrink-0 rounded-2xl border ${stage.color} bg-slate-50/70 p-3 shadow-2xs space-y-3`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{stage.label}</h3>
                  {stageTotalEst > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">
                      ~${stageTotalEst.toLocaleString()} est.
                    </span>
                  )}
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 max-h-[72vh] overflow-y-auto pr-0.5">
                {stageLeads.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const owner = users.find((u) => u.id === lead.assignedInternId);

                    return (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead.id)}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-2xs transition hover:border-emerald-500 hover:shadow-sm space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 line-clamp-1">
                            {lead.businessName}
                          </h4>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold shrink-0 ${
                              lead.temperature === 'Hot'
                                ? 'bg-rose-50 text-rose-700'
                                : lead.temperature === 'Warm'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {lead.temperature}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {lead.contactPerson} • {lead.city}
                        </p>

                        <div className="rounded bg-slate-50 p-1.5 text-[10px] text-slate-600 line-clamp-1">
                          {lead.interestedService}
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                          <div className="flex items-center gap-1 text-slate-600">
                            <img
                              src={owner?.avatar}
                              alt={owner?.name}
                              className="h-4 w-4 rounded-full border border-slate-200 object-cover"
                            />
                            <span className="font-semibold">{owner?.name.split(' ')[0]}</span>
                          </div>

                          <div className="flex items-center gap-1 font-bold text-emerald-700">
                            <span>Score: {lead.leadScore}</span>
                          </div>
                        </div>

                        {/* Quick Move Buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 opacity-80 group-hover:opacity-100 text-[10px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveStage(lead.id, lead.status, 'backward');
                            }}
                            className="text-slate-400 hover:text-slate-700 font-bold px-1"
                            title="Move back"
                          >
                            ← Prev
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveStage(lead.id, lead.status, 'forward');
                            }}
                            className="text-emerald-600 hover:text-emerald-800 font-bold px-1"
                            title="Move forward"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
