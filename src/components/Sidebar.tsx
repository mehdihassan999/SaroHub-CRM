import React from 'react';
import { useCRM } from '../context/CRMContext';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Clock,
  ArrowRightLeft,
  BarChart3,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const {
    currentUser,
    followUps,
    handoverRequests,
    setSelectedLeadId,
    setIsNewLeadModalOpen,
  } = useCRM();

  // Badges
  const overdueFollowUpsCount = followUps.filter(
    (f) => f.status === 'overdue' && (currentUser.role === 'ceo' || currentUser.role === 'cto' || f.ownerId === currentUser.id)
  ).length;

  const pendingHandoverCount = handoverRequests.filter(
    (h) => h.status === 'Pending' || h.status === 'Pending Review'
  ).length;

  const role = currentUser.role;

  const handleNav = (tabId: string) => {
    setSelectedLeadId(null);
    setCurrentTab(tabId);
  };

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-slate-200 bg-white p-3.5 select-none shrink-0">
      {/* User & Role Badge */}
      <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              role === 'ceo'
                ? 'bg-amber-100 text-amber-800'
                : role === 'cto'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {role === 'ceo' ? 'CEO' : role === 'cto' ? 'CTO' : 'Intern'}
          </span>
        </div>
        <p className="mt-1 text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
        <p className="text-[11px] text-slate-500 truncate">{currentUser.title}</p>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-0.5">
        {role === 'intern' ? (
          /* ================= INTERN MENU ================= */
          <>
            {/* 1. Dashboard */}
            <button
              onClick={() => handleNav('dashboard')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                currentTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            {/* 2. My Leads */}
            <button
              onClick={() => handleNav('leads')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                currentTab === 'leads'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>My Leads</span>
            </button>

            {/* 3. Add Lead (Quick Action) */}
            <button
              onClick={() => setIsNewLeadModalOpen(true)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/80 transition my-1"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="h-4 w-4 text-emerald-600" />
                <span>Add Lead</span>
              </div>
              <span className="rounded bg-emerald-600 text-white px-1.5 py-0.2 text-[10px] font-bold">
                + New
              </span>
            </button>

            {/* 4. Follow-Ups */}
            <button
              onClick={() => handleNav('follow_ups')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                currentTab === 'follow_ups'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4" />
                <span>Follow-Ups</span>
              </div>
              {overdueFollowUpsCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {overdueFollowUpsCount}
                </span>
              )}
            </button>

            {/* 5. Handover Requests */}
            <button
              onClick={() => handleNav('handover_center')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                currentTab === 'handover_center'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowRightLeft className="h-4 w-4 text-amber-600" />
                <span>Handover Requests</span>
              </div>
              {pendingHandoverCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {pendingHandoverCount}
                </span>
              )}
            </button>
          </>
        ) : (
          /* ================= CEO / CTO MENU ================= */
          <>
            {/* 1. Dashboard */}
            <button
              onClick={() => handleNav('dashboard')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                currentTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            {/* 2. All Leads */}
            <button
              onClick={() => handleNav('leads')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                currentTab === 'leads'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>All Leads</span>
            </button>

            {/* 3. Handover Requests */}
            <button
              onClick={() => handleNav('handover_center')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                currentTab === 'handover_center'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowRightLeft className="h-4 w-4 text-amber-600" />
                <span>Handover Requests</span>
              </div>
              {pendingHandoverCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {pendingHandoverCount}
                </span>
              )}
            </button>

            {/* 4. Team */}
            <button
              onClick={() => handleNav('team')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                currentTab === 'team'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Team</span>
            </button>

            {/* 5. Reports */}
            <button
              onClick={() => handleNav('reports')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                currentTab === 'reports'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Reports</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer System Status */}
      <div className="mt-auto pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          SaroHub CRM
        </span>
        <span className="font-semibold text-slate-500">v2.4 Simple</span>
      </div>
    </aside>
  );
};
