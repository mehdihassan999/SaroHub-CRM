import React, { useState } from 'react';
import { useCRM, isUserAssociatedWithLead } from '../context/CRMContext';
import {
  Users,
  Search,
  PlusCircle,
  ShieldCheck,
  MessageCircle,
  Clock,
  ArrowRightLeft,
  ExternalLink,
  Calendar,
  X,
  CheckCircle2,
} from 'lucide-react';
import { LeadStatus } from '../types/crm';

interface LeadsListViewProps {
  onSelectLead: (leadId: string) => void;
  onOpenNewLead: () => void;
  onOpenCheckLead: () => void;
  onOpenHandover?: (leadId: string) => void;
}

const USEFUL_STATUSES: LeadStatus[] = [
  'New',
  'Message Sent',
  'Responded',
  'Follow-Up',
  'Interested',
  'Not Interested',
  'Handover Requested',
  'Won',
  'Lost',
];

export const LeadsListView: React.FC<LeadsListViewProps> = ({
  onSelectLead,
  onOpenNewLead,
  onOpenCheckLead,
  onOpenHandover,
}) => {
  const { leads, updateLead, currentUser, users, scheduleFollowUp, handoverRequests } = useCRM();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAllLeads, setShowAllLeads] = useState(currentUser.role !== 'intern');

  // Quick follow-up scheduling state
  const [schedulingLeadId, setSchedulingLeadId] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');
  const [followUpNote, setFollowUpNote] = useState('');

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    // If intern and not toggled to all, show leads associated with this intern (including handed-over leads)
    if (
      !showAllLeads &&
      currentUser.role === 'intern' &&
      !isUserAssociatedWithLead(lead, currentUser, handoverRequests)
    ) {
      return false;
    }

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      lead.businessName.toLowerCase().includes(q) ||
      lead.contactPerson.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.interestedService.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    updateLead(leadId, { status: newStatus });
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingLeadId) return;

    scheduleFollowUp({
      leadId: schedulingLeadId,
      dueDate: followUpDate,
      dueTime: followUpTime,
      actionNote: followUpNote.trim() || 'Scheduled follow-up contact',
      priority: 'Medium',
    });

    updateLead(schedulingLeadId, {
      nextFollowUpDate: followUpDate,
      nextFollowUpTime: followUpTime,
      nextAction: followUpNote.trim() || 'Follow-up',
      status: 'Follow-Up',
    });

    setSchedulingLeadId(null);
    setFollowUpNote('');
  };

  const leadToSchedule = leads.find((l) => l.id === schedulingLeadId);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            {currentUser.role === 'intern' && !showAllLeads ? 'My Leads' : 'All Leads'} (
            {filteredLeads.length})
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser.role === 'intern'
              ? 'Leads assigned to you for outreach, follow-ups, and handover.'
              : 'Company-wide lead directory with complete context.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentUser.role === 'intern' && (
            <button
              onClick={() => setShowAllLeads(!showAllLeads)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              {showAllLeads ? 'Show Only My Leads' : 'Show All Team Leads'}
            </button>
          )}

          <button
            onClick={onOpenCheckLead}
            className="rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 transition"
          >
            <ShieldCheck className="h-4 w-4" />
            Check Lead
          </button>

          <button
            onClick={onOpenNewLead}
            className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="h-4 w-4" />
            + Add Lead
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search client name, phone number, service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* 9 Simple Statuses Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            {USEFUL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table: Client, Phone, Service, Status, Last Contact, Next Follow-Up, Action */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Contact</th>
                <th className="py-3 px-3">Next Follow-Up</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const assignedUser = users.find((u) => u.id === lead.assignedInternId);

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition">
                      {/* Client */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectLead(lead.id)}
                          className="font-bold text-slate-900 hover:text-emerald-700 text-left block text-xs"
                        >
                          {lead.businessName}
                        </button>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{lead.contactPerson}</span>
                          {showAllLeads && assignedUser && (
                            <span className="text-[10px] bg-slate-100 rounded px-1.5 py-0.2 text-slate-600">
                              {assignedUser.name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {lead.phone || 'No phone'}
                      </td>

                      {/* Service */}
                      <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate" title={lead.interestedService}>
                        {lead.interestedService}
                      </td>

                      {/* Status Dropdown (Quick Change per Section 7) */}
                      <td className="py-3 px-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={`rounded-lg px-2 py-1 text-[11px] font-bold border focus:outline-hidden cursor-pointer ${
                            lead.status === 'Won'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : lead.status === 'Interested'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : lead.status === 'Handover Requested'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : lead.status === 'Responded'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : lead.status === 'Follow-Up'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : lead.status === 'Not Interested' || lead.status === 'Lost'
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {USEFUL_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Last Contact */}
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {lead.lastContactDate
                          ? new Date(lead.lastContactDate).toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '—'}
                      </td>

                      {/* Next Follow-Up */}
                      <td className="py-3 px-3 text-[11px]">
                        {lead.nextFollowUpDate ? (
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {lead.nextFollowUpDate}
                          </span>
                        ) : (
                          <button
                            onClick={() => setSchedulingLeadId(lead.id)}
                            className="text-slate-400 hover:text-indigo-600 font-medium"
                          >
                            + Set Date
                          </button>
                        )}
                      </td>

                      {/* Actions: Open, WhatsApp, Follow-Up, Handover */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Open */}
                          <button
                            onClick={() => onSelectLead(lead.id)}
                            className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-slate-700 font-semibold hover:bg-slate-100 hover:border-slate-300 transition"
                          >
                            Open
                          </button>

                          {/* WhatsApp */}
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-emerald-700 font-bold hover:bg-emerald-100 flex items-center gap-1 transition"
                              title="Open WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" /> WhatsApp
                            </a>
                          )}

                          {/* Follow-Up */}
                          <button
                            onClick={() => setSchedulingLeadId(lead.id)}
                            className="rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1 text-indigo-700 font-bold hover:bg-indigo-100 flex items-center gap-1 transition"
                            title="Schedule follow-up"
                          >
                            <Clock className="h-3 w-3" /> Follow-Up
                          </button>

                          {/* Handover */}
                          {onOpenHandover && (
                            <button
                              onClick={() => onOpenHandover(lead.id)}
                              className="rounded-lg bg-amber-50 border border-amber-300 px-2 py-1 text-amber-800 font-bold hover:bg-amber-100 flex items-center gap-1 transition shadow-2xs"
                              title="Handover to CEO / CTO"
                            >
                              <ArrowRightLeft className="h-3 w-3 text-amber-600" /> Handover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Follow-Up Modal */}
      {schedulingLeadId && leadToSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Schedule Follow-Up: {leadToSchedule.businessName}
                </h3>
              </div>
              <button
                onClick={() => setSchedulingLeadId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-Up Note</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Send website proposal and ask for 15-min zoom call..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSchedulingLeadId(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-white font-bold hover:bg-indigo-700"
                >
                  Save Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
