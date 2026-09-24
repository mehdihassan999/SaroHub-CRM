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
  Search,
  Sparkles,
  Building2,
  DollarSign,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';
import { HandoverRequest, HandoverAttachment } from '../types/crm';
import { HandoverDossierModal } from './HandoverDossierModal';

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

  // Recipient Filter: ALL, CEO, CTO
  const [filterRecipient, setFilterRecipient] = useState<'ALL' | 'CEO' | 'CTO'>('ALL');

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Handover for Full Dossier Modal
  const [selectedDossier, setSelectedDossier] = useState<HandoverRequest | null>(null);

  // Audio Playback for quick inline audio
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Note dialog
  const [activeNoteRequestId, setActiveNoteRequestId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

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

  const filteredRequests = handoverRequests.filter((req) => {
    // Status filter
    if (filterStatus === 'Pending') {
      if (req.status !== 'Pending' && req.status !== 'Pending Review') return false;
    } else if (filterStatus !== 'ALL' && req.status !== filterStatus) {
      return false;
    }

    // Target recipient filter
    if (filterRecipient !== 'ALL') {
      const target = req.handoverTo || (req.toUserName?.includes('CTO') ? 'CTO' : 'CEO');
      if (target !== filterRecipient) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = req.businessName.toLowerCase().includes(q);
      const matchContact = req.clientProfile?.contactPerson?.toLowerCase().includes(q) || false;
      const matchIntern = req.fromUserName.toLowerCase().includes(q);
      const matchService = req.brief?.service?.toLowerCase().includes(q) || false;
      if (!matchName && !matchContact && !matchIntern && !matchService) return false;
    }

    return true;
  });

  const handleAcceptHandover = (requestId: string, leadId: string) => {
    reviewHandoverRequest(
      requestId,
      'Accepted',
      `Handover accepted by ${currentUser.name}. Now leading the deal.`
    );
    reassignLead(leadId, currentUser.id, `Lead reassigned to ${currentUser.name} via Handover Acceptance.`);
  };

  const handleReturnToIntern = (requestId: string) => {
    const feedback = prompt(
      'Enter feedback / reason for returning this lead to the intern:',
      'Please verify client budget and get specific requirements before re-handover.'
    );
    if (feedback !== null && feedback.trim()) {
      reviewHandoverRequest(requestId, 'Returned', feedback.trim());
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

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Executive Handover Center
            </h1>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              CEO & CTO Desk
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Comprehensive client dossiers transferred by interns: review who the client is, their exact requirements, full WhatsApp chats, voice notes, and video walkthroughs.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, contact, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 p-1 text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({handoverRequests.length})
          </button>
          <button
            onClick={() => setFilterStatus('Pending')}
            className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
              filterStatus === 'Pending'
                ? 'bg-amber-500 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
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
            className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
              filterStatus === 'Accepted'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Accepted ({handoverRequests.filter((h) => h.status === 'Accepted').length})
          </button>
          <button
            onClick={() => setFilterStatus('Returned')}
            className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
              filterStatus === 'Returned'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Returned ({handoverRequests.filter((h) => h.status === 'Returned').length})
          </button>
        </div>

        {/* Recipient Target: All / CEO / CTO */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium">Target:</span>
          <button
            onClick={() => setFilterRecipient('ALL')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
              filterRecipient === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterRecipient('CEO')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
              filterRecipient === 'CEO'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            CEO Desk
          </button>
          <button
            onClick={() => setFilterRecipient('CTO')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
              filterRecipient === 'CTO'
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            CTO Desk
          </button>
        </div>
      </div>

      {/* Handover Requests Cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-2xs">
            <ArrowRightLeft className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">No Handover Requests Found</h3>
            <p className="mt-1 text-xs text-slate-500">
              When interns escalate qualified clients with complete details, they will appear here.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const lead = leads.find((l) => l.id === req.leadId);
            const isPending = req.status === 'Pending' || req.status === 'Pending Review';
            const atts = req.attachments || [];
            const voiceAtts = atts.filter((a) => a.type === 'voice_note');
            const videoAtts = atts.filter((a) => a.type === 'video');
            const chatAtts = atts.filter((a) => a.type === 'chat');
            const screenAtts = atts.filter((a) => a.type === 'screenshot');
            const docAtts = atts.filter((a) => a.type === 'document' || a.type === 'file');

            const targetLabel = req.handoverTo || (req.toUserName?.includes('CTO') ? 'CTO' : 'CEO');
            const contactPerson = req.clientProfile?.contactPerson || lead?.contactPerson || 'Client Contact';
            const clientPhone = req.clientProfile?.phone || lead?.phone;
            const rawPhone = clientPhone?.replace(/[^\d]/g, '');

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{req.businessName}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : req.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'Returned'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          targetLabel === 'CTO'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        Target: {targetLabel} ({targetLabel === 'CTO' ? 'Nawaz Sharif' : 'Mehdi Raza'})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>
                        From intern: <strong className="text-slate-800">{req.fromUserName}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Reason: <strong className="text-slate-800">{req.reason}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Submitted {new Date(req.createdAt).toLocaleDateString()} at{' '}
                        {new Date(req.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Primary Dossier Action */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => setSelectedDossier(req)}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      Open Full Intelligence Dossier
                    </button>
                  </div>
                </div>

                {/* Card Body: Who is Client & What Do They Want */}
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Column 1: Client Snapshot */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2 text-xs">
                      <span className="font-bold text-[11px] uppercase tracking-wide text-slate-500 block">
                        Who is the Client?
                      </span>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Contact Person:</span>
                          <span className="font-bold text-slate-900">{contactPerson}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Phone & WhatsApp:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              {clientPhone || 'No phone'}
                            </span>
                            {rawPhone && (
                              <a
                                href={`https://wa.me/${rawPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Location:</span>
                          <span className="font-medium text-slate-800">
                            {req.clientProfile?.city || lead?.city || 'Pakistan'},{' '}
                            {req.clientProfile?.country || lead?.country || 'PK'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Industry / Service:</span>
                          <span className="font-semibold text-emerald-700">
                            {req.whatClientWants?.interestedService ||
                              req.brief?.service ||
                              lead?.interestedService}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: What Does He Want */}
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] uppercase tracking-wide text-emerald-800 block">
                          What Does He Want? (Core Goal & Scope)
                        </span>
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-[10px] text-emerald-800">
                          {req.whatClientWants?.budget || req.brief?.budget || 'Under Discussion'}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-900 line-clamp-2 leading-relaxed">
                        {req.whatClientWants?.coreNeed ||
                          req.brief?.requirementsSummary ||
                          req.summary ||
                          'Client requested custom software implementation.'}
                      </p>

                      <div className="flex items-center gap-3 pt-1 border-t border-emerald-100/60 text-[11px] text-slate-500">
                        <span>
                          Timeline: <strong>{req.whatClientWants?.timeline || req.brief?.timeline || 'Flexible'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Urgency: <strong className="text-amber-700">{req.whatClientWants?.urgency || 'High'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attached Intelligence Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        Attached Package:
                      </span>

                      {/* Chat Badge */}
                      <button
                        onClick={() => setSelectedDossier(req)}
                        className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        {chatAtts.length || (req.previousChats ? 1 : 0)} Chat Log(s)
                      </button>

                      {/* Voice Notes Badge + Inline Player */}
                      {voiceAtts.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => togglePlayAudio(v)}
                          className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-800 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {playingAudioId === v.id ? (
                            <>
                              <Pause className="h-3.5 w-3.5 text-rose-600" /> Playing {v.duration || ''}
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 text-rose-600" /> Play Voice ({v.duration || 'Note'})
                            </>
                          )}
                        </button>
                      ))}

                      {/* Video Badge */}
                      {videoAtts.length > 0 && (
                        <button
                          onClick={() => setSelectedDossier(req)}
                          className="rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-800 flex items-center gap-1.5 transition"
                        >
                          <Video className="h-3.5 w-3.5 text-blue-600" />
                          {videoAtts.length} Video(s)
                        </button>
                      )}

                      {/* Screenshots Badge */}
                      {screenAtts.length > 0 && (
                        <button
                          onClick={() => setSelectedDossier(req)}
                          className="rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 text-[11px] font-bold text-purple-800 flex items-center gap-1.5 transition"
                        >
                          <Image className="h-3.5 w-3.5 text-purple-600" />
                          {screenAtts.length} Screenshot(s)
                        </button>
                      )}

                      {/* Documents Badge */}
                      {docAtts.length > 0 && (
                        <button
                          onClick={() => setSelectedDossier(req)}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 transition"
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-600" />
                          {docAtts.length} Doc(s)
                        </button>
                      )}
                    </div>

                    {/* Action Suite */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleAcceptHandover(req.id, req.leadId)}
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Accept & Take Lead
                          </button>
                          <button
                            onClick={() => handleReturnToIntern(req.id)}
                            className="flex items-center gap-1 rounded-xl border border-rose-300 bg-white px-3 py-1.5 font-bold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Return
                          </button>
                        </>
                      )}

                      {rawPhone && (
                        <a
                          href={`https://wa.me/${rawPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          WhatsApp
                        </a>
                      )}

                      <button
                        onClick={() => onSelectLead(req.leadId)}
                        className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        CRM Lead
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Dossier Full Modal */}
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
