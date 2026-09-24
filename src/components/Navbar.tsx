import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Search,
  ShieldCheck,
  PlusCircle,
  Bell,
  Command,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Trash2,
  RotateCcw,
  UserPlus,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const {
    currentUser,
    users,
    switchUser,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setIsCheckLeadModalOpen,
    setIsNewLeadModalOpen,
    setIsCommandPaletteOpen,
    setIsCreateInternModalOpen,
    setSelectedLeadId,
    clearAllData,
    resetToDemoData,
    leads,
  } = useCRM();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Brand & Left Section */}
      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-sm">
            SH
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">
                SaroHub
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                CRM
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Internal Lead & Sales Management
            </p>
          </div>
        </div>

        {/* Global Search Bar (Trigger for Command Palette & Quick Checker) */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 sm:w-64 md:w-80"
          title="Press Ctrl+K to search"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="flex-1 text-left truncate">Search phone, business, contact...</span>
          <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-2xs sm:inline-block">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Clear Data Button (Start from Scratch) */}
        <button
          onClick={() => setIsClearModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 cursor-pointer"
          title="Clear all leads, follow-ups, timeline logs to check CRM from scratch"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Clear Data</span>
        </button>

        {/* CEO & CTO: Create New Intern Account */}
        {(currentUser.role === 'ceo' || currentUser.role === 'cto' || currentUser.role === 'admin') && (
          <button
            onClick={() => setIsCreateInternModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer"
            title="Create a new individual workspace account for a new intern"
          >
            <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden lg:inline">+ New Intern</span>
          </button>
        )}

        {/* Core Protection Tool: "Check Lead" */}
        <button
          onClick={() => setIsCheckLeadModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          title="Quick check if lead or phone already exists"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="hidden sm:inline">Check Lead</span>
          <span className="sm:hidden">Check</span>
        </button>

        {/* New Lead Button */}
        <button
          onClick={() => setIsNewLeadModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <PlusCircle className="h-4 w-4" />
          <span>+ Add Lead</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-800">Notifications</h4>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                    {unreadNotifications.length} new
                  </span>
                </div>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-medium text-emerald-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No notifications right now.
                  </div>
                ) : (
                  notifications.slice(0, 6).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.leadId) {
                          setSelectedLeadId(notif.leadId);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`cursor-pointer p-2.5 transition rounded-lg hover:bg-slate-50 ${
                        !notif.isRead ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Demo Role / User Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsUserSwitcherOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 transition hover:bg-slate-50"
            title="Switch demo user session"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-6 w-6 rounded-full object-cover border border-slate-200"
            />
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold leading-tight text-slate-800">
                {currentUser.name}
              </p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* User Switcher Menu */}
          {isUserSwitcherOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="px-2 py-1.5 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Role
                </p>
                <p className="text-[11px] text-slate-500">
                  Experience SaroHub CRM as different team members:
                </p>
              </div>

              <div className="space-y-1 py-1.5">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setIsUserSwitcherOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition ${
                        isCurrent ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="h-7 w-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold leading-tight">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.title}</p>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              {(currentUser.role === 'ceo' || currentUser.role === 'cto' || currentUser.role === 'admin') && (
                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsUserSwitcherOpen(false);
                      setIsCreateInternModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-left text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                    <span>+ Create New Intern Account</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clear Data / Reset Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Clear All Data to Test from Scratch?
                </h3>
                <p className="text-xs text-slate-500">
                  This will wipe all active leads ({leads.length}), follow-ups, timeline logs, and technical requests.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs text-rose-800 leading-relaxed space-y-1.5">
              <p className="font-semibold">What will be cleared:</p>
              <ul className="list-disc list-inside space-y-0.5 text-rose-700 text-[11px]">
                <li>All leads in the Master Directory & Sales Pipeline</li>
                <li>All scheduled follow-ups and reminders</li>
                <li>All communication timeline logs, WhatsApp messages, and voice notes</li>
                <li>All CTO technical queries & CEO handover requests</li>
                <li>All intern stats reset to 0 for a clean fresh slate</li>
              </ul>
              <p className="text-[11px] text-slate-500 pt-1">
                Note: You can always restore the sample demo dataset at any time via Settings.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  resetToDemoData();
                  setIsClearModalOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                Reload Demo Data
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAllData();
                    setIsClearModalOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
