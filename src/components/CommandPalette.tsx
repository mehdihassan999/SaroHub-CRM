import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Search,
  ShieldCheck,
  PlusCircle,
  Users,
  LayoutDashboard,
  Layers,
  ArrowRightLeft,
  BookOpen,
  X,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectLead: (leadId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectLead,
}) => {
  const { leads, setIsCheckLeadModalOpen, setIsNewLeadModalOpen } = useCRM();

  const [query, setQuery] = useState('');

  // Handle Ctrl+K shortcut globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or context
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Matched leads
  const matchedLeads = trimmed
    ? leads.filter(
        (l) =>
          l.businessName.toLowerCase().includes(trimmed) ||
          l.contactPerson.toLowerCase().includes(trimmed) ||
          l.phone.includes(trimmed) ||
          l.whatsapp.includes(trimmed) ||
          l.email.toLowerCase().includes(trimmed) ||
          l.city.toLowerCase().includes(trimmed)
      )
    : leads.slice(0, 5);

  const quickActions = [
    {
      id: 'check_lead',
      label: 'Check Lead Before Contact (Duplicate Tool)',
      icon: ShieldCheck,
      action: () => {
        onClose();
        setIsCheckLeadModalOpen(true);
      },
    },
    {
      id: 'new_lead',
      label: 'Create New Master Lead Record',
      icon: PlusCircle,
      action: () => {
        onClose();
        setIsNewLeadModalOpen(true);
      },
    },
    {
      id: 'pipeline',
      label: 'Open Sales Pipeline (Kanban)',
      icon: LayoutDashboard,
      action: () => {
        onClose();
        onNavigateTab('pipeline');
      },
    },
    {
      id: 'technical_queue',
      label: 'Open Technical Queue (CTO Desk)',
      icon: Layers,
      action: () => {
        onClose();
        onNavigateTab('technical_queue');
      },
    },
    {
      id: 'knowledge_base',
      label: 'SaroHub Knowledge Base & Specs',
      icon: BookOpen,
      action: () => {
        onClose();
        onNavigateTab('knowledge_base');
      },
    },
  ];

  const matchedActions = trimmed
    ? quickActions.filter((a) => a.label.toLowerCase().includes(trimmed))
    : quickActions;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-16 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input */}
        <div className="relative border-b border-slate-200 px-4 py-3 flex items-center gap-2.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search phone number, contact, business, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          {matchedActions.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Actions
              </p>
              <div className="space-y-0.5">
                {matchedActions.map((qa) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={qa.id}
                      onClick={qa.action}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Icon className="h-4 w-4 text-emerald-600" />
                      <span>{qa.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leads */}
          <div>
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {trimmed ? 'Matching Master Leads' : 'Recent Leads'}
            </p>

            {matchedLeads.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-400">No matching leads found.</p>
            ) : (
              <div className="space-y-1">
                {matchedLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => {
                      onClose();
                      onSelectLead(lead.id);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{lead.businessName}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {lead.contactPerson} • {lead.phone} • {lead.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="font-semibold text-emerald-600 font-mono">Score {lead.leadScore}</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
