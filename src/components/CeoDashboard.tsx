import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  TrendingUp,
  Users,
  Target,
  Award,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  DollarSign,
  Download,
  Filter,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  Briefcase,
  ChevronRight,
  MessageSquare,
  Mic,
  Video,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { User, Lead, HandoverRequest } from '../types/crm';
import { HandoverDossierModal } from './HandoverDossierModal';

interface CeoDashboardProps {
  onSelectLead: (leadId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const CeoDashboard: React.FC<CeoDashboardProps> = ({ onSelectLead, onNavigateTab }) => {
  const { leads, users, handoverRequests, followUps, auditLogs } = useCRM();

  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<HandoverRequest | null>(null);

  // Sales Pipeline aggregates
  const totalLeads = leads.length;
  const contactedCount = leads.filter((l) => !['New', 'Researching'].includes(l.status)).length;
  const respondedCount = leads.filter((l) =>
    ['Responded', 'Qualified', 'Requirements Collected', 'Technical Review', 'Proposal Required', 'Proposal Sent', 'Negotiation', 'Won'].includes(l.status)
  ).length;
  const qualifiedCount = leads.filter((l) =>
    ['Qualified', 'Requirements Collected', 'Technical Review', 'Proposal Required', 'Proposal Sent', 'Negotiation', 'Won'].includes(l.status)
  ).length;
  const proposalsCount = leads.filter((l) => ['Proposal Required', 'Proposal Sent', 'Negotiation', 'Won'].includes(l.status)).length;
  const wonCount = leads.filter((l) => l.status === 'Won').length;
  const lostCount = leads.filter((l) => l.status === 'Lost' || l.status === 'Not Interested').length;

  const responseRate = contactedCount > 0 ? Math.round((respondedCount / contactedCount) * 100) : 0;
  const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  // Active interns list
  const internUsers = users.filter((u) => u.role === 'intern');

  // Pending handovers
  const pendingHandovers = handoverRequests.filter((h) => h.status === 'Pending Review');

  // Overdue followups across company
  const allOverdue = followUps.filter((f) => f.status === 'overdue');

  const selectedIntern = users.find((u) => u.id === selectedInternId);
  const internLeads = selectedInternId ? leads.filter((l) => l.assignedInternId === selectedInternId) : [];

  const handleExportCSV = () => {
    const headers = ['Business Name', 'Contact Person', 'Phone', 'Email', 'Industry', 'Status', 'Temperature', 'Budget', 'Owner'];
    const rows = leads.map((l) => [
      `"${l.businessName}"`,
      `"${l.contactPerson}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.industry}"`,
      `"${l.status}"`,
      `"${l.temperature}"`,
      `"${l.estimatedBudget || ''}"`,
      `"${users.find((u) => u.id === l.assignedInternId)?.name || 'Unassigned'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sarohub_crm_master_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Executive Sales & Team Overview
            </h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              CEO Desk
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time pipeline analytics, intern productivity metrics, and pending deal handovers across SaroHub Technologies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export Master CSV
          </button>

          {pendingHandovers.length > 0 && (
            <button
              onClick={() => onNavigateTab('handover_center')}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition animate-pulse"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Review {pendingHandovers.length} Deal Handovers
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase text-[10px]">Total Master Leads</span>
            <Users className="h-4 w-4 text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalLeads}</p>
          <span className="text-[10px] text-slate-400">Company-wide records</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase text-[10px]">Contacted</span>
            <Target className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600">{contactedCount}</p>
          <span className="text-[10px] text-slate-400">Outreach initiated</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase text-[10px]">Response Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{responseRate}%</p>
          <span className="text-[10px] text-slate-400">{respondedCount} active responses</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase text-[10px]">Qualified Pipeline</span>
            <Award className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-600">{qualifiedCount}</p>
          <span className="text-[10px] text-slate-400">{proposalsCount} proposals sent/ready</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs">
            <span className="font-bold uppercase text-[10px]">Deals Won</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{wonCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">{conversionRate}% overall win rate</span>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 text-xs">
            <span className="font-bold uppercase text-[10px]">Overdue Follow-ups</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">{allOverdue.length}</p>
          <span className="text-[10px] text-rose-500 font-semibold">Requires managerial nudge</span>
        </div>
      </div>

      {/* Pending Deal Handovers for CEO Desk */}
      {pendingHandovers.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
                <ArrowRightLeft className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Deal Handovers Awaiting CEO Review ({pendingHandovers.length})
                </h3>
                <p className="text-[11px] text-amber-800">
                  Qualified enterprise deals escalated by interns with complete chats, voice debriefs, and client requirements.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('handover_center')}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-1"
            >
              Open Handover Center <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingHandovers.map((h) => {
              const hLead = leads.find((l) => l.id === h.leadId);
              const attCount = h.attachments?.length || 0;
              const hasVoice = h.attachments?.some((a) => a.type === 'voice_note');
              const hasVideo = h.attachments?.some((a) => a.type === 'video');
              const rawPhone = (h.clientProfile?.phone || hLead?.phone || '').replace(/[^\d]/g, '');

              return (
                <div
                  key={h.id}
                  className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">
                        {h.businessName}
                      </span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 shrink-0">
                        {h.whatClientWants?.budget || h.brief?.budget || 'Deal'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Contact: <strong className="text-slate-700">{h.clientProfile?.contactPerson || hLead?.contactPerson}</strong> • Intern: {h.fromUserName}
                    </p>

                    <div className="rounded-lg bg-slate-50 p-2 text-[11px] font-medium text-slate-800 line-clamp-2">
                      {h.whatClientWants?.coreNeed || h.brief?.requirementsSummary || h.summary || 'Client qualified for closing.'}
                    </div>

                    {/* Media pills */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      {(h.previousChats || h.attachments?.some((a) => a.type === 'chat')) && (
                        <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-emerald-800 font-semibold flex items-center gap-0.5">
                          <MessageSquare className="h-2.5 w-2.5" /> Chats
                        </span>
                      )}
                      {hasVoice && (
                        <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-rose-800 font-semibold flex items-center gap-0.5">
                          <Mic className="h-2.5 w-2.5" /> Voice
                        </span>
                      )}
                      {hasVideo && (
                        <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-blue-800 font-semibold flex items-center gap-0.5">
                          <Video className="h-2.5 w-2.5" /> Video
                        </span>
                      )}
                      {attCount > 0 && (
                        <span className="text-slate-400 font-medium">
                          +{attCount} item(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {rawPhone && (
                      <a
                        href={`https://wa.me/${rawPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}

                    <button
                      onClick={() => setSelectedDossier(h)}
                      className="rounded-lg bg-slate-900 px-3 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      Inspect Dossier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Intern Team Productivity Leaderboard (Prompt #12 & #31) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Lead Generation Team Activity & Performance
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any intern to inspect their full assigned portfolio
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Intern Name</th>
                <th className="py-2.5 px-3 text-center">Leads Found</th>
                <th className="py-2.5 px-3 text-center">Contacted</th>
                <th className="py-2.5 px-3 text-center">Messages Sent</th>
                <th className="py-2.5 px-3 text-center">Responses</th>
                <th className="py-2.5 px-3 text-center">Response %</th>
                <th className="py-2.5 px-3 text-center">Follow-ups Done</th>
                <th className="py-2.5 px-3 text-center">Overdue</th>
                <th className="py-2.5 px-3 text-center">Qualified</th>
                <th className="py-2.5 px-3 text-center">Won</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {internUsers.map((intern) => {
                const internSpecificLeads = leads.filter((l) => l.assignedInternId === intern.id);
                const sContacted = internSpecificLeads.filter((l) => !['New', 'Researching'].includes(l.status)).length;
                const sResponded = internSpecificLeads.filter((l) =>
                  ['Responded', 'Qualified', 'Requirements Collected', 'Technical Review', 'Proposal Required', 'Proposal Sent', 'Negotiation', 'Won'].includes(l.status)
                ).length;
                const sRate = sContacted > 0 ? Math.round((sResponded / sContacted) * 100) : 0;
                const sQualified = internSpecificLeads.filter((l) =>
                  ['Qualified', 'Requirements Collected', 'Technical Review', 'Proposal Required', 'Proposal Sent', 'Negotiation', 'Won'].includes(l.status)
                ).length;
                const sWon = internSpecificLeads.filter((l) => l.status === 'Won').length;
                const sOverdue = followUps.filter((f) => f.ownerId === intern.id && f.status === 'overdue').length;

                const isSelected = selectedInternId === intern.id;

                return (
                  <tr
                    key={intern.id}
                    onClick={() => setSelectedInternId(isSelected ? null : intern.id)}
                    className={`cursor-pointer transition hover:bg-slate-50 ${
                      isSelected ? 'bg-emerald-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={intern.avatar}
                          alt={intern.name}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{intern.name}</p>
                          <p className="text-[10px] text-slate-500 font-normal">{intern.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {internSpecificLeads.length}
                    </td>

                    <td className="py-3 px-3 text-center font-medium text-blue-600">
                      {sContacted}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {intern.stats.messagesSent}
                    </td>

                    <td className="py-3 px-3 text-center font-medium text-emerald-600">
                      {sResponded}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
                        {sRate}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {intern.stats.followUpsCompleted}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {sOverdue > 0 ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          {sOverdue}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-indigo-600">
                      {sQualified}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-700">
                      {sWon}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInternId(isSelected ? null : intern.id);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1"
                      >
                        {isSelected ? 'Collapse' : 'Inspect Leads'}
                        <ChevronRight className={`h-3 w-3 transition ${isSelected ? 'rotate-90' : ''}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Drilldown view for selected intern */}
        {selectedIntern && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-900">
                Active Portfolio for {selectedIntern.name} ({internLeads.length} leads)
              </h4>
              <button
                onClick={() => setSelectedInternId(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
              {internLeads.map((l) => (
                <div
                  key={l.id}
                  onClick={() => onSelectLead(l.id)}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-2xs hover:border-emerald-500 transition"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">{l.businessName}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                      {l.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 truncate">
                    {l.contactPerson} • {l.phone}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5">
                    <span>Temp: {l.temperature}</span>
                    <span className="font-bold text-emerald-600">Score: {l.leadScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Handover Dossier Modal */}
      {selectedDossier && (
        <HandoverDossierModal
          isOpen={!!selectedDossier}
          onClose={() => setSelectedDossier(null)}
          handover={selectedDossier}
          onSelectLead={onSelectLead}
        />
      )}
    </div>
  );
};
