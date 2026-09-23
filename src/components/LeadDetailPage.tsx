import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  ArrowLeft,
  Building2,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Clock,
  User,
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  HelpCircle,
  FileText,
  Mic,
  Link2,
  UploadCloud,
  Send,
  Copy,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { LeadStatus } from '../types/crm';
import { HandoverModal } from './HandoverModal';

interface LeadDetailPageProps {
  leadId: string;
  onBack: () => void;
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

const COMMUNICATION_RESULTS = [
  'Message Sent',
  'Client Responded',
  'No Response',
  'Interested',
  'Not Interested',
  'Asked for Details',
] as const;

export const LeadDetailPage: React.FC<LeadDetailPageProps> = ({ leadId, onBack }) => {
  const {
    leads,
    users,
    currentUser,
    timeline,
    updateLead,
    addTimelineItem,
    scheduleFollowUp,
    createTechRequest,
    techRequests,
    handoverRequests,
  } = useCRM();

  const lead = leads.find((l) => l.id === leadId);
  const assignedUser = users.find((u) => u.id === lead?.assignedInternId);

  // Handover modal state
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const activeHandover = handoverRequests.find((h) => h.leadId === leadId);

  // Notes state
  const [notesText, setNotesText] = useState(lead?.notes || '');
  const [isNotesSaved, setIsNotesSaved] = useState(false);

  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState(
    lead?.nextFollowUpDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [followUpNote, setFollowUpNote] = useState(lead?.nextAction || 'Send website quotation');
  const [isFollowUpSaved, setIsFollowUpSaved] = useState(false);

  // Ask CTO question state
  const [clientTechQuestion, setClientTechQuestion] = useState('');
  const [isTechSubmitting, setIsTechSubmitting] = useState(false);

  // Simple AI Assistant state
  const [aiPromptType, setAiPromptType] = useState<string>('initial');
  const [aiGeneratedText, setAiGeneratedText] = useState<string>(
    `Hi ${lead?.contactPerson || 'there'}! This is ${currentUser.name.split(' ')[0]} from SaroHub Technologies. We noticed your business ${lead?.businessName || ''} and specialize in ${lead?.interestedService || 'high-converting web platforms'}. Would you be open to a quick 5-minute chat on how we can help you streamline online bookings?`
  );
  const [isCopied, setIsCopied] = useState(false);

  // Communication composer state
  const [commType, setCommType] = useState<'message' | 'note' | 'voice' | 'file' | 'link'>('message');
  const [commInput, setCommInput] = useState('');

  if (!lead) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="text-sm">Lead record not found.</p>
        <button
          onClick={onBack}
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </button>
      </div>
    );
  }

  // Handle Quick Communication Result (Section 9)
  const handleRecordResult = (result: (typeof COMMUNICATION_RESULTS)[number]) => {
    let newStatus: LeadStatus = lead.status;
    let timelineContent = `Outreach result logged: ${result}`;

    if (result === 'Message Sent') {
      newStatus = 'Message Sent';
      timelineContent = `WhatsApp message sent to ${lead.contactPerson}`;
    } else if (result === 'Client Responded') {
      newStatus = 'Responded';
      timelineContent = `Client responded to WhatsApp message`;
    } else if (result === 'Interested') {
      newStatus = 'Interested';
      timelineContent = `Client expressed strong interest in ${lead.interestedService}`;
    } else if (result === 'Not Interested') {
      newStatus = 'Not Interested';
      timelineContent = `Client stated they are not interested currently`;
    } else if (result === 'No Response') {
      newStatus = 'Follow-Up';
      timelineContent = `No response yet from client. Scheduled for follow-up.`;
    } else if (result === 'Asked for Details') {
      newStatus = 'Responded';
      timelineContent = `Client requested pricing and portfolio details`;
    }

    updateLead(lead.id, {
      status: newStatus,
      lastContactDate: new Date().toISOString(),
    });

    addTimelineItem({
      leadId: lead.id,
      type: result.includes('Responded') ? 'whatsapp_received' : 'whatsapp_sent',
      content: timelineContent,
    });
  };

  // Handle Notes Save
  const handleSaveNotes = () => {
    updateLead(lead.id, { notes: notesText.trim() });
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 2000);
  };

  // Handle Follow-Up Save
  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleFollowUp({
      leadId: lead.id,
      dueDate: followUpDate,
      dueTime: '11:00 AM',
      actionNote: followUpNote.trim(),
      priority: 'Medium',
    });

    updateLead(lead.id, {
      nextFollowUpDate: followUpDate,
      nextAction: followUpNote.trim(),
      status: lead.status === 'New' ? 'Follow-Up' : lead.status,
    });

    setIsFollowUpSaved(true);
    setTimeout(() => setIsFollowUpSaved(false), 2000);
  };

  // Handle Ask CTO
  const handleAskCto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientTechQuestion.trim()) return;

    setIsTechSubmitting(true);
    createTechRequest({
      leadId: lead.id,
      question: clientTechQuestion.trim(),
      context: `Service: ${lead.interestedService}. Client: ${lead.businessName}. Notes: ${lead.notes || 'None'}`,
      clientRequirement: lead.interestedService,
      urgency: 'High',
    });

    addTimelineItem({
      leadId: lead.id,
      type: 'tech_request',
      content: `Question asked to CTO: "${clientTechQuestion.trim()}"`,
      isInternalOnly: true,
    });

    setClientTechQuestion('');
    setIsTechSubmitting(false);
  };

  // Simple AI message generators (Section 20)
  const handleAiAction = (action: 'generate' | 'improve' | 'reply' | 'tech' | 'followup') => {
    setAiPromptType(action);
    const clientName = lead.contactPerson || 'Client';
    const bizName = lead.businessName;
    const service = lead.interestedService;

    if (action === 'generate') {
      setAiGeneratedText(
        `Hi ${clientName}, hope you're having a productive week! I'm reaching out from SaroHub Technologies regarding ${bizName}. We build custom ${service} designed to increase client conversion and automate bookings. Would you be open to seeing a 2-minute video demo of how this works for similar businesses?`
      );
    } else if (action === 'improve') {
      setAiGeneratedText(
        `Hello ${clientName}! Following up regarding ${bizName}'s inquiry for ${service}. We can deliver a turnkey solution with seamless WhatsApp notifications and mobile responsiveness. Could we schedule a brief 10-minute call tomorrow at 11 AM to discuss your timeline?`
      );
    } else if (action === 'reply') {
      setAiGeneratedText(
        `Thank you for reaching out, ${clientName}! Yes, we can certainly implement ${service} tailored to ${bizName}'s workflow. Our team provides complete development, hosting, and technical support. Are you available for a quick demonstration?`
      );
    } else if (action === 'tech') {
      setAiGeneratedText(
        `Regarding your technical requirement: Yes, our modern architecture allows complete API synchronization between your existing systems and the new ${service} web platform. Data updates in real time with zero downtime.`
      );
    } else if (action === 'followup') {
      setAiGeneratedText(
        `Hi ${clientName}, just checking in to see if you had a chance to review our previous message regarding ${bizName}'s ${service}? We'd love to help you get started whenever you're ready!`
      );
    }
  };

  const handleCopyAi = () => {
    navigator.clipboard.writeText(aiGeneratedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Add Communication Item
  const handleAddCommunication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commInput.trim()) return;

    let type: any = 'internal_note';
    let prefix = 'Note';
    if (commType === 'message') {
      type = 'whatsapp_sent';
      prefix = 'Message';
    } else if (commType === 'voice') {
      type = 'voice_note';
      prefix = 'Voice Note';
    } else if (commType === 'file') {
      type = 'file_upload';
      prefix = 'File';
    } else if (commType === 'link') {
      type = 'internal_note';
      prefix = 'Link';
    }

    addTimelineItem({
      leadId: lead.id,
      type,
      content: `${prefix}: ${commInput.trim()}`,
    });

    setCommInput('');
  };

  // Lead Timeline filtered
  const leadTimeline = timeline.filter((t) => t.leadId === lead.id);

  // Technical requests for this lead
  const leadTechRequests = techRequests.filter((t) => t.leadId === lead.id);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* ================= SECTION 8 TOP BAR ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </button>

          {activeHandover && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                activeHandover.status === 'Accepted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activeHandover.status === 'Accepted'
                ? `Lead handed over to ${activeHandover.handoverTo || 'CEO'} ✓`
                : `Handover pending with ${activeHandover.handoverTo || 'CEO'}`}
            </span>
          )}
        </div>

        {/* Top Details Grid */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-black text-slate-900">{lead.businessName}</h1>
              <span className="font-mono text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Phone: {lead.phone || 'No phone'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span>
                Assigned to: <strong className="text-slate-800">{assignedUser?.name || 'Unassigned'}</strong>
              </span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span>Status:</span>
                <select
                  value={lead.status}
                  onChange={(e) => updateLead(lead.id, { status: e.target.value as LeadStatus })}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-hidden"
                >
                  {USEFUL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* LARGE, OBVIOUS HANDOVER BUTTON (Section 10) */}
          <button
            onClick={() => setIsHandoverOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition shrink-0"
          >
            <ArrowRightLeft className="h-5 w-5" />
            HANDOVER TO CEO / CTO
          </button>
        </div>
      </div>

      {/* ================= SECTION 9: WHATSAPP & RESULT LOGGER ================= */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-950">WhatsApp Direct Outreach</span>
              <p className="text-[11px] text-emerald-800">
                Open WhatsApp to chat with {lead.contactPerson}, then click a result below to record it.
              </p>
            </div>
          </div>

          {/* Open WhatsApp Button */}
          {lead.phone && (
            <a
              href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <MessageCircle className="h-4 w-4" /> Open WhatsApp Web
            </a>
          )}
        </div>

        {/* 1-Click Communication Result Logger */}
        <div className="pt-2 border-t border-emerald-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-1.5">
            Record What Happened (1-Click Log):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {COMMUNICATION_RESULTS.map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => handleRecordResult(res)}
                className="rounded-lg bg-white border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-600 hover:text-white transition shadow-2xs"
              >
                + {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 2-COLUMN MAIN WORKSPACE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN: CLIENT DETAILS, NOTES, FOLLOW-UP, ASK CTO */}
        <div className="space-y-5">
          {/* CLIENT DETAILS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Client Details
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Contact Person:</span>
                <span className="font-bold text-slate-800">{lead.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phone / WhatsApp:</span>
                <span className="font-mono font-bold text-slate-800">{lead.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email:</span>
                <span className="text-slate-800 font-medium">{lead.email || 'None provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Website:</span>
                {lead.website ? (
                  <a
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-medium flex items-center gap-1 truncate"
                  >
                    {lead.website} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">No website</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Industry:</span>
                <span className="text-slate-800 font-medium">{lead.industry}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location:</span>
                <span className="text-slate-800 font-medium">
                  {lead.city}, {lead.country}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px]">Service Required:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs inline-block mt-0.5">
                  {lead.interestedService}
                </span>
              </div>
            </div>
          </div>

          {/* NOTES (Section 8: Simple Internal Notes) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes</h2>
              {isNotesSaved && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>
            <textarea
              rows={3}
              placeholder="Client wants a modern website and asked about online booking..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Save Notes
              </button>
            </div>
          </div>

          {/* NEXT FOLLOW-UP (Section 19) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Next Follow-Up
                </h2>
              </div>
              {isFollowUpSaved && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Follow-Up Scheduled
                </span>
              )}
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Date</label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-500 block mb-0.5">Follow-Up Note</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Send website quotation"
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Save Follow-Up
                </button>
              </div>
            </form>
          </div>

          {/* ASK CTO / TECHNICAL QUESTIONS (Section 21) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ask CTO (Technical Question)
              </h2>
            </div>
            <p className="text-[11px] text-slate-500">
              Client asked a technical question you can't answer? Submit directly to CTO Nawaz Sharif.
            </p>

            <form onSubmit={handleAskCto} className="space-y-2 text-xs">
              <textarea
                rows={2}
                placeholder="e.g. Can you integrate our existing POS system with the website?"
                value={clientTechQuestion}
                onChange={(e) => setClientTechQuestion(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!clientTechQuestion.trim() || isTechSubmitting}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Submit Question to CTO
                </button>
              </div>
            </form>

            {/* Previous Questions & CTO Answers */}
            {leadTechRequests.length > 0 && (
              <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  CTO Q&A History:
                </span>
                {leadTechRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs">
                    <p className="font-bold text-slate-800">Q: {req.question}</p>
                    {req.ctoAnswer ? (
                      <div className="mt-1.5 p-2 bg-white rounded-lg border border-emerald-200 text-emerald-900">
                        <span className="font-bold block text-[10px] text-emerald-700">
                          CTO Answer:
                        </span>
                        <p>{req.ctoAnswer}</p>
                      </div>
                    ) : (
                      <span className="mt-1 inline-block text-[11px] text-amber-700 font-semibold">
                        Awaiting CTO reply...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SIMPLE AI ASSISTANT & COMMUNICATION TIMELINE */}
        <div className="space-y-5">
          {/* SIMPLE AI ASSISTANT (Section 20) */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                  Simple AI Assistant
                </h2>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                Instant Helper
              </span>
            </div>

            {/* 5 Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleAiAction('generate')}
                className="rounded-lg bg-white border border-purple-200 px-2.5 py-1 font-semibold text-purple-900 hover:bg-purple-600 hover:text-white transition shadow-2xs"
              >
                Generate Message
              </button>
              <button
                type="button"
                onClick={() => handleAiAction('improve')}
                className="rounded-lg bg-white border border-purple-200 px-2.5 py-1 font-semibold text-purple-900 hover:bg-purple-600 hover:text-white transition shadow-2xs"
              >
                Improve Message
              </button>
              <button
                type="button"
                onClick={() => handleAiAction('reply')}
                className="rounded-lg bg-white border border-purple-200 px-2.5 py-1 font-semibold text-purple-900 hover:bg-purple-600 hover:text-white transition shadow-2xs"
              >
                Reply to Client
              </button>
              <button
                type="button"
                onClick={() => handleAiAction('tech')}
                className="rounded-lg bg-white border border-purple-200 px-2.5 py-1 font-semibold text-purple-900 hover:bg-purple-600 hover:text-white transition shadow-2xs"
              >
                Explain Tech Question
              </button>
              <button
                type="button"
                onClick={() => handleAiAction('followup')}
                className="rounded-lg bg-white border border-purple-200 px-2.5 py-1 font-semibold text-purple-900 hover:bg-purple-600 hover:text-white transition shadow-2xs"
              >
                Generate Follow-Up
              </button>
            </div>

            {/* AI Generated Text Box */}
            <div className="space-y-2">
              <textarea
                rows={4}
                value={aiGeneratedText}
                onChange={(e) => setAiGeneratedText(e.target.value)}
                className="w-full rounded-xl border border-purple-200 bg-white p-3 text-xs text-slate-800 focus:outline-hidden"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Copy or edit before sending</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAi}
                    className="flex items-center gap-1 rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50 transition"
                  >
                    <Copy className="h-3.5 w-3.5" /> {isCopied ? 'Copied!' : 'Copy'}
                  </button>

                  {lead.phone && (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                        aiGeneratedText
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Send via WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COMMUNICATION TIMELINE (Section 8) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Communication Timeline
            </h2>

            {/* Timeline Events List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {leadTimeline.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center italic">
                  No communication logged yet. Use the 1-click logger or composer below.
                </p>
              ) : (
                leadTimeline.map((item) => {
                  const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  });

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs"
                    >
                      <span className="font-bold text-slate-500 shrink-0 text-[11px] mt-0.5">
                        {dateStr} —
                      </span>
                      <div className="flex-1">
                        <span className="text-slate-800 font-medium">{item.content}</span>
                        <span className="text-[10px] text-slate-400 ml-2">by {item.authorName}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add Bar: Message, Note, Voice Note, File, Link */}
            <form onSubmit={handleAddCommunication} className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCommType('message')}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    commType === 'message'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + Message
                </button>
                <button
                  type="button"
                  onClick={() => setCommType('note')}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    commType === 'note'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + Note
                </button>
                <button
                  type="button"
                  onClick={() => setCommType('voice')}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    commType === 'voice'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + Voice note
                </button>
                <button
                  type="button"
                  onClick={() => setCommType('file')}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    commType === 'file'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + File
                </button>
                <button
                  type="button"
                  onClick={() => setCommType('link')}
                  className={`rounded-lg px-2.5 py-1 font-semibold ${
                    commType === 'link'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + Link
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    commType === 'message'
                      ? 'Log sent or received client message...'
                      : commType === 'note'
                      ? 'Add quick internal note...'
                      : commType === 'voice'
                      ? 'Summary of voice note...'
                      : commType === 'file'
                      ? 'File name or description...'
                      : 'Paste URL or link...'
                  }
                  value={commInput}
                  onChange={(e) => setCommInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 p-2 text-xs focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!commInput.trim()}
                  className="rounded-xl bg-slate-900 px-3.5 py-2 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Handover Modal */}
      {isHandoverOpen && (
        <HandoverModal
          isOpen={isHandoverOpen}
          onClose={() => setIsHandoverOpen(false)}
          lead={lead}
        />
      )}
    </div>
  );
};
