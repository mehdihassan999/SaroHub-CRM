import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Mic,
  Link2,
  FileText,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Phone,
  UserCheck,
  Download,
  Video,
  Image,
  MessageCircle,
} from 'lucide-react';
import { HandoverAttachment } from '../types/crm';

interface HandoverCenterViewProps {
  onSelectLead: (leadId: string) => void;
}

export const HandoverCenterView: React.FC<HandoverCenterViewProps> = ({ onSelectLead }) => {
  const {
    handoverRequests,
    leads,
    users,
    reviewHandoverRequest,
    reassignLead,
    currentUser,
    addTimelineItem,
  } = useCRM();

  // Status Filter: Pending, Accepted, Returned, Completed, or ALL
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'Pending' | 'Accepted' | 'Returned' | 'Completed'
  >('ALL');

  // Expanded chat logs
  const [expandedChatIds, setExpandedChatIds] = useState<Record<string, boolean>>({});

  // Audio Playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Note dialog
  const [activeNoteRequestId, setActiveNoteRequestId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Reassign owner dialog
  const [activeReassignRequestId, setActiveReassignRequestId] = useState<string | null>(null);
  const [selectedNewOwner, setSelectedNewOwner] = useState(currentUser.id);

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) activeAudioRef.current.pause();
    };
  }, []);

  const togglePlayAudio = (att: HandoverAttachment) => {
    if (playingAudioId === att.id) {
      if (activeAudioRef.current) activeAudioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (activeAudioRef.current) activeAudioRef.current.pause();
      if (att.url) {
        const audio = new Audio(att.url);
        activeAudioRef.current = audio;
        audio.play().catch(() => {});
        audio.onended = () => setPlayingAudioId(null);
      }
      setPlayingAudioId(att.id);
    }
  };

  const toggleChatExpand = (id: string) => {
    setExpandedChatIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter requests
  const filteredRequests = handoverRequests.filter((h) => {
    const isPending = h.status === 'Pending' || h.status === 'Pending Review';
    if (filterStatus === 'Pending') return isPending;
    if (filterStatus === 'Accepted') return h.status === 'Accepted';
    if (filterStatus === 'Returned') return h.status === 'Returned';
    if (filterStatus === 'Completed') return h.status === 'Completed';
    return true;
  });

  const handleAcceptHandover = (requestId: string, leadId: string) => {
    reviewHandoverRequest(requestId, 'Accepted', 'Handover accepted by management.');
    reassignLead(leadId, currentUser.id);
  };

  const handleReturnToIntern = (requestId: string) => {
    const feedback = prompt(
      'Enter feedback / reason for returning this lead to the intern:',
      'Please verify client budget and get specific requirements before re-handover.'
    );
    if (feedback !== null) {
      reviewHandoverRequest(requestId, 'Returned', feedback);
    }
  };

  const handleSaveNote = (requestId: string, leadId: string) => {
    if (!noteText.trim()) return;
    addTimelineItem({
      leadId,
      type: 'internal_note',
      content: `Executive Note from ${currentUser.name}: ${noteText.trim()}`,
      isInternalOnly: true,
    });
    setNoteText('');
    setActiveNoteRequestId(null);
  };

  const handleSaveReassign = (requestId: string, leadId: string) => {
    reassignLead(leadId, selectedNewOwner, 'Reassigned from Handover Center.');
    setActiveReassignRequestId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-amber-600" />
              Handover Requests
            </h1>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              CEO & CTO Center
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Review complete lead context, WhatsApp conversations, audio notes, and attachments submitted by interns.
          </p>
        </div>

        {/* Status Filter Tabs (Section 16: Pending, Accepted, Returned, Completed) */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              filterStatus === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({handoverRequests.length})
          </button>
          <button
            onClick={() => setFilterStatus('Pending')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              filterStatus === 'Pending'
                ? 'bg-amber-500 text-white font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pending (
            {
              handoverRequests.filter(
                (h) => h.status === 'Pending' || h.status === 'Pending Review'
              ).length
            }
            )
          </button>
          <button
            onClick={() => setFilterStatus('Accepted')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              filterStatus === 'Accepted'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Accepted ({handoverRequests.filter((h) => h.status === 'Accepted').length})
          </button>
          <button
            onClick={() => setFilterStatus('Returned')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition ${
              filterStatus === 'Returned'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Returned ({handoverRequests.filter((h) => h.status === 'Returned').length})
          </button>
        </div>
      </div>

      {/* Handover Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
            No handover requests matching "{filterStatus}".
          </div>
        ) : (
          filteredRequests.map((req) => {
            const lead = leads.find((l) => l.id === req.leadId);
            const isPending = req.status === 'Pending' || req.status === 'Pending Review';
            const chatAttachments = (req.attachments || []).filter((a) => a.type === 'chat');
            const otherAttachments = (req.attachments || []).filter((a) => a.type !== 'chat');

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 transition hover:border-slate-300"
              >
                {/* Top Section: Business Name, Submitter, Target, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900">
                        New Handover: {req.businessName}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'Returned'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>
                        Submitted by: <strong className="text-slate-800">{req.fromUserName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Handover to:{' '}
                        <strong className="text-indigo-700 font-bold">
                          {req.handoverTo || req.toUserName || 'CEO'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Reason: <strong className="text-slate-800">{req.reason}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectLead(req.leadId)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    Open Full Lead
                  </button>
                </div>

                {/* Section 13: Automatic Handover Package Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left Column: Client Details & Requirement */}
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Client & Contact:
                      </span>
                      <div className="text-slate-800 font-medium space-y-0.5">
                        <p>
                          <strong>Contact:</strong> {req.brief.contact}
                        </p>
                        <p>
                          <strong>Service:</strong> {req.brief.service}
                        </p>
                        {lead && (
                          <p>
                            <strong>Location:</strong> {lead.city}, {lead.country} •{' '}
                            <strong>Industry:</strong> {lead.industry}
                          </p>
                        )}
                        {lead?.website && (
                          <p>
                            <strong>Website:</strong>{' '}
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {lead.website}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Intern Summary:
                      </span>
                      <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-slate-800 font-medium">
                        {req.summary || req.brief.requirementsSummary || 'No summary provided.'}
                      </div>
                    </div>

                    {req.returnReason && (
                      <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-rose-800">
                        <span className="font-bold block text-[11px]">Return Reason:</span>
                        <p className="mt-0.5">{req.returnReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Communication, WhatsApp Logs, Attachments */}
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Conversation Context & Attachments:
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">
                          {(req.attachments || []).length} item
                          {(req.attachments || []).length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {/* WhatsApp Chat Logs view/download */}
                      {chatAttachments.length > 0 ? (
                        chatAttachments.map((chat) => (
                          <div
                            key={chat.id}
                            className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs mb-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                                {chat.title}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleChatExpand(chat.id)}
                                  className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-0.5"
                                >
                                  {expandedChatIds[chat.id] ? (
                                    <>
                                      Collapse <ChevronUp className="h-3 w-3" />
                                    </>
                                  ) : (
                                    <>
                                      View Chat <ChevronDown className="h-3 w-3" />
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {expandedChatIds[chat.id] && (
                              <div className="mt-2 p-2 bg-white rounded border border-emerald-200 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                                {chat.content}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic mb-2">
                          No direct WhatsApp export attached.
                        </p>
                      )}

                      {/* Other Attachments: Screenshots, Voice notes, Videos, Links, Documents */}
                      {otherAttachments.length > 0 && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {otherAttachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {att.type === 'voice_note' && (
                                  <Mic className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                )}
                                {att.type === 'screenshot' && (
                                  <Image className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                                )}
                                {att.type === 'video' && (
                                  <Video className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                )}
                                {att.type === 'url' && (
                                  <Link2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                )}
                                {att.type === 'document' && (
                                  <FileText className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                                )}
                                <span className="font-semibold text-slate-800 truncate">
                                  {att.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {att.type === 'voice_note' && (
                                  <button
                                    onClick={() => togglePlayAudio(att)}
                                    className="rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 flex items-center gap-1"
                                  >
                                    {playingAudioId === att.id ? (
                                      <>
                                        <Pause className="h-3 w-3" /> Pause
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-3 w-3" /> Play
                                      </>
                                    )}
                                  </button>
                                )}

                                {att.url && (
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline text-[11px] font-semibold flex items-center gap-0.5"
                                  >
                                    Open <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 14 Actions: Accept Handover, Return to Intern, Add Note, Contact Client, Change Owner */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Accept Handover */}
                    {isPending && (
                      <button
                        onClick={() => handleAcceptHandover(req.id, req.leadId)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Accept Handover
                      </button>
                    )}

                    {/* Return to Intern */}
                    {isPending && (
                      <button
                        onClick={() => handleReturnToIntern(req.id)}
                        className="rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition"
                      >
                        <RotateCcw className="h-4 w-4" /> Return to Intern
                      </button>
                    )}

                    {/* Add Note */}
                    <button
                      onClick={() => setActiveNoteRequestId(req.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-400" /> Add Note
                    </button>

                    {/* Change Owner */}
                    <button
                      onClick={() => setActiveReassignRequestId(req.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" /> Change Owner
                    </button>
                  </div>

                  {/* Contact Client (Direct WhatsApp) */}
                  {lead?.phone && (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition"
                    >
                      <MessageCircle className="h-4 w-4 text-emerald-600" /> Contact Client on WhatsApp
                    </a>
                  )}
                </div>

                {/* Inline Add Note Form */}
                {activeNoteRequestId === req.id && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <label className="font-bold text-slate-700 block">
                      Executive Note for {req.businessName}:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Reviewed requirements, schedule pricing call tomorrow..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:outline-hidden"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveNoteRequestId(null)}
                        className="px-3 py-1 text-slate-500 hover:text-slate-700 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNote(req.id, req.leadId)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-700"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Change Owner Form */}
                {activeReassignRequestId === req.id && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <label className="font-bold text-slate-700 block">
                      Change Lead Owner:
                    </label>
                    <select
                      value={selectedNewOwner}
                      onChange={(e) => setSelectedNewOwner(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveReassignRequestId(null)}
                        className="px-3 py-1 text-slate-500 hover:text-slate-700 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveReassign(req.id, req.leadId)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-700"
                      >
                        Confirm Reassign
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
