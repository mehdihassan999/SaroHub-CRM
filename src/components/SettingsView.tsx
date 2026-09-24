import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Settings,
  Users,
  UserPlus,
  ShieldCheck,
  UserX,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Database,
} from 'lucide-react';
import { User, UserRole } from '../types/crm';

export const SettingsView: React.FC = () => {
  const {
    users,
    leads,
    currentUser,
    setIsCreateInternModalOpen,
    reassignLead,
    updateLead,
    clearAllData,
    resetToDemoData,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'users' | 'duplicate_rules' | 'data_management'>('users');
  const [reassignModalIntern, setReassignModalIntern] = useState<User | null>(null);
  const [targetReassignId, setTargetReassignId] = useState<string>(users[0]?.id || '');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleDeactivateIntern = (user: User) => {
    const userLeads = leads.filter((l) => l.assignedInternId === user.id);
    if (userLeads.length > 0) {
      setReassignModalIntern(user);
    } else {
      alert(`User ${user.name} has no active leads and can be safely archived.`);
    }
  };

  const handleExecuteBulkReassign = () => {
    if (!reassignModalIntern) return;
    const userLeads = leads.filter((l) => l.assignedInternId === reassignModalIntern.id);
    userLeads.forEach((l) => {
      reassignLead(l.id, targetReassignId);
    });
    alert(`Successfully transferred ${userLeads.length} leads to new owner. Intern portfolio is now preserved.`);
    setReassignModalIntern(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-700" />
            SaroHub Administration & Security Settings
          </h2>
          <p className="text-xs text-slate-500">
            Manage user roles, safe team transitions, data integrity rules, and CRM configurations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          Team Members & Intern Management ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('duplicate_rules')}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'duplicate_rules'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Duplicate Protection Rules
        </button>

        <button
          onClick={() => setActiveTab('data_management')}
          className={`px-4 py-2 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'data_management'
              ? 'border-rose-600 text-rose-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="h-4 w-4" />
          Database & Scratch Reset
        </button>
      </div>

      {/* User Management */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active SaroHub Team ({users.length})</h3>
              <span className="text-xs text-slate-500">
                Individual workspaces for interns; CEO & CTO have full executive permissions
              </span>
            </div>

            {(currentUser.role === 'ceo' || currentUser.role === 'cto' || currentUser.role === 'admin') && (
              <button
                type="button"
                onClick={() => setIsCreateInternModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition"
              >
                <UserPlus className="h-4 w-4" />
                + Create New Intern Account
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Active Leads Assigned</th>
                  <th className="py-2.5 px-3">Follow-ups Completed</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const assignedCount = leads.filter((l) => l.assignedInternId === u.id).length;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            u.role === 'ceo'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'cto'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.title}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-800">
                        {assignedCount} master leads
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-mono">
                        {u.stats.followUpsCompleted}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {u.role === 'intern' ? (
                          <button
                            onClick={() => handleDeactivateIntern(u)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 flex items-center gap-1 ml-auto"
                            title="Safely offboard intern without losing any leads"
                          >
                            <UserX className="h-3 w-3" />
                            Offboard & Transfer Leads
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Core Executive</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Duplicate Protection Rules Settings */}
      {activeTab === 'duplicate_rules' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Enforced CRM Duplicate Guardrails</h3>
          <p className="text-slate-600">
            SaroHub CRM implements hard-stop duplicate prevention so no client receives conflicting sales outreach:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="font-bold text-slate-900 block text-xs">1. Phone & WhatsApp Normalization</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                All numbers are normalized to E.164 standard (+971, +92, local 0300 stripped to standard digits).
                Matches will block registration immediately.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="font-bold text-slate-900 block text-xs">2. Business Name Fuzzy Search</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Flags common variations (e.g. "ABC Clinic" vs "ABC Dental Clinic Dubai"). Displays existing owner
                to prevent embarrassing double-contacts.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="font-bold text-slate-900 block text-xs">3. Handover Protocol</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Interns discovering an existing lead must request Handover from the current owner or management
                instead of attempting shadow outreach.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Database & Scratch Testing Panel */}
      {activeTab === 'data_management' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">CRM Data Management & Reset</h3>
              <p className="text-slate-500 text-[11px]">
                Control operational test data, test deduplication from scratch, or restore demonstration leads.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              Current Leads: {leads.length}
            </span>
          </div>

          {actionNotice && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clear All Data Box */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
                  <Trash2 className="h-4 w-4" />
                  <h4>Clear All Data (Start from Scratch)</h4>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Removes all current leads, pipeline stages, scheduled follow-up tasks, timeline interactions, CTO technical questions, and CEO handover queues. Allows you to test lead creation, phone deduplication, and workflow pipelines entirely clean.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All Data Now
              </button>
            </div>

            {/* Reload Demo Data Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs mb-1">
                  <RotateCcw className="h-4 w-4 text-emerald-600" />
                  <h4>Reload SaroHub Demo Dataset</h4>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Restores the rich initial showcase dataset featuring dental clinics, restaurants, retail chains, active CTO technical tickets, handover proposals, and intern performance stats.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetToDemoData();
                  setActionNotice('Demo dataset has been reloaded successfully.');
                  setTimeout(() => setActionNotice(null), 4000);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition"
              >
                <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                Reload Demo Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Settings Panel Clear */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Confirm Database Wipe
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to clear all leads ({leads.length}) and records?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will completely empty the leads register, communication timeline, follow-up calendar, and technical escalations so you can input fresh data from scratch.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setConfirmClearOpen(false);
                  setActionNotice('All CRM data has been cleared. The workspace is now completely empty.');
                  setTimeout(() => setActionNotice(null), 4000);
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModalIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Safe Offboarding: Transfer Leads
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Intern <strong>{reassignModalIntern.name}</strong> currently has{' '}
              <strong>
                {leads.filter((l) => l.assignedInternId === reassignModalIntern.id).length} active master leads
              </strong>
              . Select the team member who should take over these records so no client relationships are lost.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transfer all leads to:
              </label>
              <select
                value={targetReassignId}
                onChange={(e) => setTargetReassignId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800"
              >
                {users
                  .filter((u) => u.id !== reassignModalIntern.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReassignModalIntern(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkReassign}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Transfer Leads & Offboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
