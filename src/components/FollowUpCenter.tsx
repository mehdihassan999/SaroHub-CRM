import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ExternalLink,
  MessageCircle,
  Phone,
  RefreshCw,
  Plus,
  Filter,
} from 'lucide-react';
import { FollowUp } from '../types/crm';

interface FollowUpCenterProps {
  onSelectLead: (leadId: string) => void;
}

export const FollowUpCenter: React.FC<FollowUpCenterProps> = ({ onSelectLead }) => {
  const { followUps, completeFollowUp, rescheduleFollowUp, users, currentUser } = useCRM();

  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [filterOwner, setFilterOwner] = useState<string>(
    currentUser.role === 'intern' ? currentUser.id : 'ALL'
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const relevantFollowUps = followUps.filter((f) => {
    return filterOwner === 'ALL' || f.ownerId === filterOwner;
  });

  const todayList = relevantFollowUps.filter((f) => f.dueDate === todayStr && f.status === 'pending');
  const overdueList = relevantFollowUps.filter((f) => f.status === 'overdue');
  const upcomingList = relevantFollowUps.filter((f) => f.dueDate > todayStr && f.status === 'pending');
  const completedList = relevantFollowUps.filter((f) => f.status === 'completed');

  const displayedList =
    activeTab === 'today'
      ? todayList
      : activeTab === 'overdue'
      ? overdueList
      : activeTab === 'upcoming'
      ? upcomingList
      : completedList;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Follow-Up Command Center
          </h2>
          <p className="text-xs text-slate-500">
            Ensure zero lead leakage with scheduled outreach and one-click task execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Team Members</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'today'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Today's Tasks ({todayList.length})
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'overdue'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          Overdue ({overdueList.length})
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'upcoming'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          Upcoming ({upcomingList.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'completed'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Completed Archive ({completedList.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-2" />
            No follow-ups in this section!
          </div>
        ) : (
          displayedList.map((item) => {
            const owner = users.find((u) => u.id === item.ownerId);

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.status === 'overdue'
                    ? 'border-rose-200 bg-rose-50/50'
                    : item.status === 'completed'
                    ? 'border-slate-200 bg-slate-50/60 opacity-80'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{item.businessName}</span>
                    <span className="text-xs text-slate-500">
                      • {item.contactPerson} ({item.phone})
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.status === 'overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : item.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {item.status === 'overdue'
                        ? 'OVERDUE'
                        : item.status === 'completed'
                        ? 'COMPLETED'
                        : `${item.dueTime || '11:00 AM'}`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">Goal: {item.actionNote}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>Due: {item.dueDate}</span>
                    <span>Owner: {owner?.name || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={`https://wa.me/${item.phone.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-200 bg-white p-2 text-emerald-600 hover:bg-emerald-50"
                    title="Open WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>

                  <button
                    onClick={() => onSelectLead(item.leadId)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open Lead
                  </button>

                  {item.status !== 'completed' && (
                    <>
                      {/* Reschedule quick menu */}
                      <button
                        onClick={() => {
                          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                          rescheduleFollowUp(item.id, tomorrow, item.dueTime);
                          alert('Rescheduled to tomorrow.');
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                        title="Reschedule +1 day"
                      >
                        <RefreshCw className="h-3 w-3" /> +1 Day
                      </button>

                      <button
                        onClick={() => completeFollowUp(item.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
