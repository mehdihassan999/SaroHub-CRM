import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Users,
  Send,
  MessageCircle,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  Calendar,
  ExternalLink,
  PlusCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface InternDashboardProps {
  onSelectLead: (leadId: string) => void;
  onOpenNewLead: () => void;
  onOpenCheckLead: () => void;
}

export const InternDashboard: React.FC<InternDashboardProps> = ({
  onSelectLead,
  onOpenNewLead,
  onOpenCheckLead,
}) => {
  const { currentUser, leads, followUps, completeFollowUp, handoverRequests } = useCRM();

  const [searchFilter, setSearchFilter] = useState('');

  // Intern leads
  const myLeads = leads.filter(
    (l) => currentUser.role === 'ceo' || currentUser.role === 'admin' || l.assignedInternId === currentUser.id
  );

  // 5 Core Metrics for Intern Dashboard
  const myLeadsCount = myLeads.length;
  const contactedCount = myLeads.filter(
    (l) => l.status === 'Contacted' || l.status === 'Message Sent' || l.status === 'Responded' || l.status === 'Follow-Up' || l.status === 'Interested' || l.status === 'Handover Requested' || l.status === 'Won' || l.status === 'Lost'
  ).length;
  const responsesCount = myLeads.filter(
    (l) => l.status === 'Responded' || l.status === 'Interested' || l.status === 'Won' || l.status === 'Handover Requested'
  ).length;

  const myFollowUps = followUps.filter(
    (f) => currentUser.role === 'ceo' || currentUser.role === 'admin' || f.ownerId === currentUser.id
  );
  const activeFollowUpsCount = myFollowUps.filter((f) => f.status === 'pending' || f.status === 'overdue').length;

  const myPendingHandovers = handoverRequests.filter(
    (h) => (h.status === 'Pending' || h.status === 'Pending Review') && (currentUser.role === 'ceo' || h.fromUserId === currentUser.id)
  );

  // Today's Follow-Ups
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaysFollowUps = myFollowUps.filter(
    (f) => (f.dueDate === todayDateStr || f.status === 'overdue') && f.status !== 'completed'
  );

  // Recent Leads filtered by search
  const recentLeads = myLeads
    .filter((lead) => {
      const q = searchFilter.toLowerCase();
      return (
        lead.businessName.toLowerCase().includes(q) ||
        lead.contactPerson.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.interestedService.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Welcome, {currentUser.name.split(' ')[0]}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Intern Desk
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Find lead → Contact on WhatsApp → Update Status → Follow up → Handover to CEO/CTO.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCheckLead}
            className="flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Check Lead First
          </button>
          <button
            onClick={onOpenNewLead}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <PlusCircle className="h-4 w-4" />
            + Add Lead
          </button>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. My Leads */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-slate-700">My Leads</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{myLeadsCount}</p>
          <span className="text-[10px] text-slate-400">Assigned to you</span>
        </div>

        {/* 2. Contacted */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-slate-700">Contacted</span>
            <Send className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600">{contactedCount}</p>
          <span className="text-[10px] text-slate-400">Outreach made</span>
        </div>

        {/* 3. Responses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-slate-700">Responses</span>
            <MessageCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{responsesCount}</p>
          <span className="text-[10px] text-slate-400">Prospect replied</span>
        </div>

        {/* 4. Follow-Ups */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold text-slate-700">Follow-Ups</span>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-600">{activeFollowUpsCount}</p>
          <span className="text-[10px] text-slate-400">Due & pending</span>
        </div>

        {/* 5. Handover Pending */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-amber-900 text-xs">
            <span className="font-bold">Handover Pending</span>
            <ArrowRightLeft className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{myPendingHandovers.length}</p>
          <span className="text-[10px] text-amber-700 font-medium">Under CEO/CTO review</span>
        </div>
      </div>

      {/* Today's Follow-Ups */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Today's Follow-Ups</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {todaysFollowUps.length} item{todaysFollowUps.length === 1 ? '' : 's'} scheduled
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {todaysFollowUps.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-1" />
              No pending follow-ups for today. Great work!
            </div>
          ) : (
            todaysFollowUps.map((fup) => {
              const lead = leads.find((l) => l.id === fup.leadId);
              const isOverdue = fup.status === 'overdue';

              return (
                <div
                  key={fup.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 text-xs transition ${
                    isOverdue
                      ? 'border-rose-200 bg-rose-50/60'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{fup.businessName}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {fup.phone || lead?.phone || 'No phone'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isOverdue
                            ? 'bg-rose-600 text-white uppercase'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {isOverdue ? 'Overdue' : lead?.status || 'Follow-Up'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Date: <strong>{fup.dueDate}</strong> ({fup.dueTime})
                      </span>
                    </div>

                    <p className="text-slate-700 font-medium">
                      Note: <span className="text-slate-900">{fup.actionNote}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Quick WhatsApp Action */}
                    {fup.phone && (
                      <a
                        href={`https://wa.me/${fup.phone.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white font-bold hover:bg-emerald-700 flex items-center gap-1 transition shadow-2xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}

                    {/* Open Lead */}
                    <button
                      onClick={() => onSelectLead(fup.leadId)}
                      className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-slate-700 font-semibold hover:bg-slate-100 flex items-center gap-1 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </button>

                    {/* Mark Done */}
                    <button
                      onClick={() => completeFollowUp(fup.id)}
                      className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-slate-700 font-bold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 flex items-center gap-1 transition"
                      title="Mark follow-up completed"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Done
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Leads</h2>
            <p className="text-xs text-slate-500">Your most recently active leads</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter leads..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:border-emerald-600 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {recentLeads.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No leads found. Click "+ Add Lead" to start outreach!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onSelectLead(lead.id)}
                        className="font-bold text-slate-900 hover:text-emerald-700 text-left block"
                      >
                        {lead.businessName}
                      </button>
                      <span className="text-[11px] text-slate-400">{lead.contactPerson}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {lead.phone || 'No phone'}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate">
                      {lead.interestedService}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700 font-bold hover:bg-emerald-100 flex items-center gap-1"
                            title="Open WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => onSelectLead(lead.id)}
                          className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-slate-700 font-semibold hover:bg-slate-100 flex items-center gap-1"
                        >
                          Open
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
