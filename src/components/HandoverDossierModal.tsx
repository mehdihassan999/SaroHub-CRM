import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  X,
  ArrowRightLeft,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  User,
  Mic,
  Video,
  Image as ImageIcon,
  FileText,
  Link2,
  Play,
  Pause,
  ExternalLink,
  Download,
  Send,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Maximize2,
  Copy,
  Check,
  Bot,
  Loader2,
  MessageSquareText,
} from 'lucide-react';
import { HandoverRequest, HandoverAttachment, TimelineItem, AIChatIntelligence } from '../types/crm';
import {
  cleanRawChatText,
  parseWhatsAppMessages,
  extractRequirementsLocally,
} from '../utils/whatsappParser';

interface HandoverDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  handover: HandoverRequest;
  onSelectLead?: (leadId: string) => void;
}

export const HandoverDossierModal: React.FC<HandoverDossierModalProps> = ({
  isOpen,
  onClose,
  handover,
  onSelectLead,
}) => {
  const {
    leads,
    users,
    reviewHandoverRequest,
    reassignLead,
    currentUser,
    addTimelineItem,
    timeline,
  } = useCRM();

  const lead = leads.find((l) => l.id === handover.leadId);

  // Tab state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'conversations' | 'voice_video' | 'visuals' | 'documents'
  >('overview');

  // Audio Playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Lightbox for screenshots
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Copy chat notification
  const [isCopiedChat, setIsCopiedChat] = useState(false);

  // Chat View Mode: Interactive bubbles vs Clean transcript
  const [chatViewMode, setChatViewMode] = useState<'bubbles' | 'transcript'>('bubbles');

  // AI Chat Intelligence Data
  const [dossierAiData, setDossierAiData] = useState<AIChatIntelligence | null>(
    handover.aiChatIntelligence || null
  );
  const [isDossierAiAnalyzing, setIsDossierAiAnalyzing] = useState(false);

  // Action states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnFeedback, setReturnFeedback] = useState('');
  const [executiveNote, setExecutiveNote] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  // Initialize AI intelligence locally if not yet saved on handover
  useEffect(() => {
    if (!dossierAiData) {
      const rawText =
        handover.previousChats ||
        handover.attachments?.find((a) => a.type === 'chat')?.content ||
        '';
      if (rawText && rawText.length > 30) {
        const local = extractRequirementsLocally(rawText, handover.clientProfile?.phone);
        setDossierAiData(local as any);
      }
    }
  }, [handover]);

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, []);

  // Run AI chat parsing inside the dossier
  const handleAnalyzeDossierChat = async () => {
    const rawText =
      handover.previousChats ||
      handover.attachments?.find((a) => a.type === 'chat')?.content ||
      '';
    if (!rawText.trim()) return;

    setIsDossierAiAnalyzing(true);
    try {
      const cleaned = cleanRawChatText(rawText);
      const res = await fetch('/api/gemini/parse-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawChat: cleaned,
          leadContext: {
            businessName: handover.businessName,
            contactPerson: handover.clientProfile?.contactPerson,
            phone: handover.clientProfile?.phone,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDossierAiData(json.data);
          return;
        }
      }
      // Fallback
      const local = extractRequirementsLocally(rawText, handover.clientProfile?.phone);
      setDossierAiData(local as any);
    } catch {
      const local = extractRequirementsLocally(rawText, handover.clientProfile?.phone);
      setDossierAiData(local as any);
    } finally {
      setIsDossierAiAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  const isPending = handover.status === 'Pending' || handover.status === 'Pending Review';

  // Attachments categorised
  const attachments = handover.attachments || [];
  const chatAttachments = attachments.filter((a) => a.type === 'chat');
  const voiceAttachments = attachments.filter((a) => a.type === 'voice_note');
  const videoAttachments = attachments.filter((a) => a.type === 'video');
  const screenshotAttachments = attachments.filter((a) => a.type === 'screenshot');
  const docAttachments = attachments.filter((a) => a.type === 'document' || a.type === 'file');
  const linkAttachments = attachments.filter((a) => a.type === 'url');

  // Timeline events for this lead
  const leadTimelineEvents =
    handover.timelineSnapshot && handover.timelineSnapshot.length > 0
      ? handover.timelineSnapshot
      : timeline.filter((t) => t.leadId === handover.leadId);

  // Handle Audio Playback
  const togglePlayAudio = (att: HandoverAttachment) => {
    if (playingAudioId === att.id) {
      if (activeAudioRef.current) activeAudioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (activeAudioRef.current) activeAudioRef.current.pause();
      if (att.url) {
        const audio = new Audio(att.url);
        audio.playbackRate = playbackSpeed;
        activeAudioRef.current = audio;
        audio.play().catch(() => {});
        setPlayingAudioId(att.id);
        audio.onended = () => setPlayingAudioId(null);
      } else {
        // Fallback simulation
        setPlayingAudioId(att.id);
        setTimeout(() => setPlayingAudioId(null), 4000);
      }
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (activeAudioRef.current) {
      activeAudioRef.current.playbackRate = speed;
    }
  };

  // Accept Handover
  const handleAccept = () => {
    reviewHandoverRequest(
      handover.id,
      'Accepted',
      `Handover accepted by ${currentUser.name} (${currentUser.role.toUpperCase()}). Taking lead ownership.`
    );
    reassignLead(
      handover.leadId,
      currentUser.id,
      `Reassigned to ${currentUser.name} via Handover Acceptance.`
    );
  };

  // Return Handover to Intern
  const handleConfirmReturn = () => {
    if (!returnFeedback.trim()) return;
    reviewHandoverRequest(handover.id, 'Returned', returnFeedback.trim());
    setShowReturnModal(false);
    setReturnFeedback('');
  };

  // Save Executive Note
  const handleSaveExecutiveNote = () => {
    if (!executiveNote.trim()) return;
    addTimelineItem({
      leadId: handover.leadId,
      type: 'internal_note',
      content: `🔒 Executive Note [${currentUser.name}]: ${executiveNote.trim()}`,
      isInternalOnly: true,
    });
    setExecutiveNote('');
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2500);
  };

  // Copy all conversation text
  const handleCopyConversations = () => {
    let text = `=== CONVERSATIONS FOR ${handover.businessName} ===\n\n`;
    if (handover.previousChats) {
      text += `--- PRIMARY CHAT LOG ---\n${handover.previousChats}\n\n`;
    }
    chatAttachments.forEach((c) => {
      text += `--- ${c.title} ---\n${c.content || ''}\n\n`;
    });
    if (leadTimelineEvents.length > 0) {
      text += `--- CRM ACTIVITY LOGS ---\n`;
      leadTimelineEvents.forEach((t) => {
        text += `[${new Date(t.timestamp).toLocaleDateString()} ${new Date(
          t.timestamp
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${t.type.toUpperCase()}: ${t.content}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setIsCopiedChat(true);
    setTimeout(() => setIsCopiedChat(false), 2000);
  };

  // Generate Executive WhatsApp message template
  const clientName = handover.clientProfile?.contactPerson || lead?.contactPerson || 'there';
  const rawPhone = (handover.clientProfile?.phone || lead?.phone || '').replace(/[^\d]/g, '');
  const serviceName =
    handover.whatClientWants?.interestedService ||
    handover.brief?.service ||
    lead?.interestedService ||
    'software solution';

  const executiveWhatsAppMessage = encodeURIComponent(
    `Salam ${clientName}, this is ${currentUser.name}, ${currentUser.role === 'cto' ? 'CTO' : 'CEO'} at SaroHub Technologies (Pvt) Ltd.\n\nOur business development team briefed me regarding your requirement for ${serviceName} at ${handover.businessName}.\n\nI reviewed your project specifications and would like to connect for a quick 10-15 minute discussion to address your questions and outline the next steps. When would be a convenient time for you today or tomorrow?`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-auto flex flex-col w-full max-w-5xl max-h-[94vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* ================= MODAL HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <ArrowRightLeft className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Executive Handover Dossier: {handover.businessName}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isPending
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : handover.status === 'Accepted'
                    ? 'bg-emerald-500 text-white'
                    : handover.status === 'Returned'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {handover.status}
              </span>
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                Target: {handover.handoverTo || handover.toUserName || 'CEO'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span>
                Submitted by: <strong className="text-slate-200">{handover.fromUserName}</strong>
              </span>
              <span>•</span>
              <span>
                Reason: <strong className="text-slate-200">{handover.reason}</strong>
              </span>
              <span>•</span>
              <span>
                Submitted on{' '}
                {new Date(handover.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onSelectLead && (
              <button
                onClick={() => {
                  onClose();
                  onSelectLead(handover.leadId);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                Open Full CRM Lead
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ================= EXECUTIVE FAST ACTIONS BANNER ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-amber-50/50 px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {isPending && (
              <>
                <button
                  onClick={handleAccept}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept Handover & Take Lead
                </button>

                <button
                  onClick={() => setShowReturnModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-2 font-bold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  Return with Feedback
                </button>
              </>
            )}

            {rawPhone && (
              <a
                href={`https://wa.me/${rawPhone}?text=${executiveWhatsAppMessage}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600/10 border border-emerald-300 px-3.5 py-2 font-bold text-emerald-800 hover:bg-emerald-600/20 transition"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                Executive WhatsApp Opener
              </a>
            )}

            {(handover.clientProfile?.phone || lead?.phone) && (
              <a
                href={`tel:${handover.clientProfile?.phone || lead?.phone}`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                Direct Call
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-[11px] text-slate-500 uppercase tracking-wide">
              Intelligence Included:
            </span>
            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-bold text-[11px] text-slate-700 flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-emerald-600" />
              {chatAttachments.length || (handover.previousChats ? 1 : 0)} Chats
            </span>
            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-bold text-[11px] text-slate-700 flex items-center gap-1">
              <Mic className="h-3 w-3 text-rose-600" />
              {voiceAttachments.length} Voice
            </span>
            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-bold text-[11px] text-slate-700 flex items-center gap-1">
              <Video className="h-3 w-3 text-blue-600" />
              {videoAttachments.length} Video
            </span>
            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-bold text-[11px] text-slate-700 flex items-center gap-1">
              <ImageIcon className="h-3 w-3 text-purple-600" />
              {screenshotAttachments.length} Visuals
            </span>
          </div>
        </div>

        {/* ================= TABS NAVIGATION ================= */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-bold transition shrink-0 ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="h-3.5 w-3.5 text-amber-600" />
            Client & Requirement Dossier
          </button>

          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-bold transition shrink-0 ${
              activeTab === 'conversations'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
            All Conversations & Chat Logs
            {(chatAttachments.length > 0 || handover.previousChats) && (
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('voice_video')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-bold transition shrink-0 ${
              activeTab === 'voice_video'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-rose-600" />
            Voice Notes & Video Demos
            {voiceAttachments.length + videoAttachments.length > 0 && (
              <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2">
                {voiceAttachments.length + videoAttachments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('visuals')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-bold transition shrink-0 ${
              activeTab === 'visuals'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-purple-600" />
            Screenshots & References ({screenshotAttachments.length})
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-bold transition shrink-0 ${
              activeTab === 'documents'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            Documents & Links ({docAttachments.length + linkAttachments.length})
          </button>
        </div>

        {/* ================= TAB CONTENT STAGE ================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ---------------- TAB 1: OVERVIEW ---------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Return Reason Banner (if returned) */}
              {handover.returnReason && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs uppercase tracking-wide">
                      Lead Returned to Intern with Feedback:
                    </span>
                    <p className="text-xs mt-1 font-medium">{handover.returnReason}</p>
                  </div>
                </div>
              )}

              {/* Top 2-Column Grid: Who is the Client & What Do They Want */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. WHO IS THE CLIENT */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Who is the Client?</h3>
                        <p className="text-[11px] text-slate-500">
                          Complete profile & verification details
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                      {handover.clientProfile?.industry || lead?.industry || 'Enterprise'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Business Name:</span>
                      <span className="font-bold text-slate-900">
                        {handover.businessName || lead?.businessName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Contact Person / Decision Maker:</span>
                      <span className="font-bold text-slate-900">
                        {handover.clientProfile?.contactPerson || lead?.contactPerson}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Phone & WhatsApp:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {handover.clientProfile?.phone || lead?.phone}
                        </span>
                        {rawPhone && (
                          <a
                            href={`https://wa.me/${rawPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Email Address:</span>
                      <span className="font-medium text-slate-800">
                        {handover.clientProfile?.email || lead?.email || 'Not provided'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Location:</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {handover.clientProfile?.city || lead?.city},{' '}
                        {handover.clientProfile?.country || lead?.country}
                      </span>
                    </div>

                    {(handover.clientProfile?.website || lead?.website) && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400">Existing Website:</span>
                        <a
                          href={
                            (handover.clientProfile?.website || lead?.website || '').startsWith('http')
                              ? handover.clientProfile?.website || lead?.website
                              : `https://${handover.clientProfile?.website || lead?.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          {handover.clientProfile?.website || lead?.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">Lead Source:</span>
                      <span className="font-medium text-slate-800">
                        {handover.clientProfile?.source || lead?.source || 'Outreach'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. WHAT DOES THE CLIENT WANT */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-emerald-950">
                          What Does the Client Want?
                        </h3>
                        <p className="text-[11px] text-emerald-700">
                          Core requirement, deliverables, & scope
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      {handover.whatClientWants?.interestedService ||
                        handover.brief?.service ||
                        lead?.interestedService}
                    </span>
                  </div>

                  {/* Core Problem / Requirement Box */}
                  <div className="rounded-xl border border-emerald-200 bg-white p-3.5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Core Goal & Deliverables:
                    </span>
                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                      {handover.whatClientWants?.coreNeed ||
                        handover.brief?.requirementsSummary ||
                        handover.summary ||
                        lead?.notes ||
                        'Client is seeking custom software development and architecture guidance.'}
                    </p>
                  </div>

                  {/* Commercials Grid: Budget, Timeline, Urgency */}
                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Budget:
                      </span>
                      <span className="text-xs font-bold text-emerald-700 mt-0.5 block truncate">
                        {handover.whatClientWants?.budget ||
                          handover.brief?.budget ||
                          lead?.estimatedBudget ||
                          'Under Discussion'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Timeline:
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                        {handover.whatClientWants?.timeline ||
                          handover.brief?.timeline ||
                          lead?.expectedTimeline ||
                          'Flexible'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Urgency:
                      </span>
                      <span className="text-xs font-bold text-amber-700 mt-0.5 block">
                        {handover.whatClientWants?.urgency || 'High'}
                      </span>
                    </div>
                  </div>

                  {/* Key Objections or Client Questions */}
                  {(handover.whatClientWants?.keyObjections ||
                    handover.brief?.keyObjections ||
                    lead?.temperatureReason) && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs">
                      <span className="font-bold text-amber-900 block text-[11px]">
                        Key Objections / Questions to Address in Closing:
                      </span>
                      <p className="text-amber-950 mt-0.5">
                        {handover.whatClientWants?.keyObjections ||
                          handover.brief?.keyObjections ||
                          lead?.temperatureReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Intern Debrief Notes & Next Steps */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Intern Debrief & Recommended Next Action
                  </span>
                  <span className="text-xs text-slate-400">
                    Submitted by <strong>{handover.fromUserName}</strong>
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-800 leading-relaxed font-medium">
                  {handover.summary ||
                    handover.brief?.requirementsSummary ||
                    'Client communicated interest and requested executive discussion.'}
                </div>

                {handover.brief?.nextAction && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    <span>Recommended next step: {handover.brief.nextAction}</span>
                  </div>
                )}
              </div>

              {/* Quick Jump Links to Full Chats, Voice Notes, etc. */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab('conversations')}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xs hover:border-emerald-500 transition group"
                >
                  <div className="flex items-center justify-between">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </div>
                  <h4 className="mt-2 font-bold text-xs text-slate-900">
                    Read WhatsApp Conversation
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {chatAttachments.length || (handover.previousChats ? 1 : 0)} chat log(s) available
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('voice_video')}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xs hover:border-rose-500 transition group"
                >
                  <div className="flex items-center justify-between">
                    <Mic className="h-5 w-5 text-rose-600" />
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </div>
                  <h4 className="mt-2 font-bold text-xs text-slate-900">Listen to Voice Notes</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {voiceAttachments.length} audio debrief(s) attached
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('visuals')}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xs hover:border-purple-500 transition group"
                >
                  <div className="flex items-center justify-between">
                    <ImageIcon className="h-5 w-5 text-purple-600" />
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </div>
                  <h4 className="mt-2 font-bold text-xs text-slate-900">Inspect Screenshots</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {screenshotAttachments.length} visual reference(s) attached
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* ---------------- TAB 2: CONVERSATIONS & CHAT LOGS ---------------- */}
          {activeTab === 'conversations' && (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    Full WhatsApp & Conversation History
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Inspect all messages exchanged with {handover.clientProfile?.contactPerson || 'the client'} prior to handover.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyConversations}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {isCopiedChat ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" /> Copy Conversation
                      </>
                    )}
                  </button>

                  {rawPhone && (
                    <a
                      href={`https://wa.me/${rawPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700 transition"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Open WhatsApp Web
                    </a>
                  )}
                </div>
              </div>

              {/* AI Distingushed Requirements & Executive Briefing */}
              <div className="rounded-2xl border border-purple-200 bg-linear-to-br from-purple-50/80 via-white to-indigo-50/60 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-2xs">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                        AI Executive Intelligence & Client Requirements
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                          Verified Analysis
                        </span>
                      </h4>
                      <p className="text-[11px] text-purple-700">
                        Automatically extracted from chat messages, negotiations, and voice context
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeDossierChat}
                    disabled={isDossierAiAnalyzing}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition cursor-pointer shadow-2xs"
                  >
                    {isDossierAiAnalyzing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing Chat with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Re-Analyze Chat with AI
                      </>
                    )}
                  </button>
                </div>

                {dossierAiData ? (
                  <div className="space-y-3 text-xs">
                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-purple-100 bg-white p-3 shadow-2xs">
                        <span className="text-[11px] text-slate-400 font-medium block">Business Identified:</span>
                        <span className="font-bold text-slate-900 block mt-0.5 text-xs">
                          {dossierAiData.businessIdentified || handover.businessName}
                        </span>
                      </div>

                      <div className="rounded-xl border border-purple-100 bg-white p-3 shadow-2xs">
                        <span className="text-[11px] text-slate-400 font-medium block">Discussed Budget:</span>
                        <span className="font-bold text-emerald-700 block mt-0.5 text-xs font-mono">
                          {dossierAiData.budgetDiscussed || handover.whatClientWants?.budget || 'PKR 20,000'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-purple-100 bg-white p-3 shadow-2xs">
                        <span className="text-[11px] text-slate-400 font-medium block">Payment Method Agreed:</span>
                        <span className="font-semibold text-slate-800 block mt-0.5 text-xs">
                          {dossierAiData.paymentMethod || 'Easypaisa / Mobile Wallet'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-purple-100 bg-white p-3 shadow-2xs">
                        <span className="text-[11px] text-slate-400 font-medium block">Deal Urgency:</span>
                        <span className="font-bold text-amber-700 block mt-0.5 text-xs">
                          {dossierAiData.urgency || handover.whatClientWants?.urgency || 'High'}
                        </span>
                      </div>
                    </div>

                    {/* Core Need / What Client Wants */}
                    <div className="rounded-xl border border-purple-100 bg-white p-3.5 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                        What Does the Client Want (Core Business Need):
                      </span>
                      <p className="text-slate-800 leading-relaxed text-xs font-medium">
                        {dossierAiData.coreNeed ||
                          handover.whatClientWants?.coreNeed ||
                          'Client needs an online ordering system and digital marketing for home food delivery.'}
                      </p>
                    </div>

                    {/* Products / Menu Items */}
                    {dossierAiData.productsOrMenu && (
                      <div className="rounded-xl border border-purple-100 bg-white p-3.5 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                          Identified Products / Food Menu:
                        </span>
                        <p className="text-slate-800 text-xs">
                          {dossierAiData.productsOrMenu}
                        </p>
                      </div>
                    )}

                    {/* Key Objections / Negotiations */}
                    {dossierAiData.keyObjectionsOrQuestions && (
                      <div className="rounded-xl border border-purple-100 bg-white p-3.5 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                          Pricing & Objections Handled:
                        </span>
                        <p className="text-slate-700 text-xs">
                          {dossierAiData.keyObjectionsOrQuestions}
                        </p>
                      </div>
                    )}

                    {/* Voice Notes Summary */}
                    {dossierAiData.voiceNotesSummary && (
                      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 flex items-start gap-2.5">
                        <Mic className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-bold text-rose-900 block">
                            Voice Notes & Verbal Debrief Summary:
                          </span>
                          <p className="text-rose-950 text-xs mt-0.5">
                            {dossierAiData.voiceNotesSummary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Executive Closing Recommendation */}
                    {dossierAiData.executiveSummary && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-bold text-emerald-900 block">
                            Executive Recommendation for Closing:
                          </span>
                          <p className="text-emerald-950 text-xs mt-0.5">
                            {dossierAiData.executiveSummary}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-500">
                    Click &ldquo;Re-Analyze Chat with AI&rdquo; above to extract requirements, menu items, and budget details automatically.
                  </div>
                )}
              </div>

              {/* View Switcher: Interactive Bubbles vs Raw Transcript */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setChatViewMode('bubbles')}
                    className={`rounded-lg px-3 py-1 font-bold transition cursor-pointer ${
                      chatViewMode === 'bubbles'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    💬 WhatsApp Interactive Bubbles
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatViewMode('transcript')}
                    className={`rounded-lg px-3 py-1 font-bold transition cursor-pointer ${
                      chatViewMode === 'transcript'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📄 Clean Transcript
                  </button>
                </div>

                <span className="text-[11px] text-slate-400">
                  Cleaned of binary headers &amp; encryption notices
                </span>
              </div>

              {/* Dedicated Chat Transcript / Bubbles View */}
              {(handover.previousChats || chatAttachments.length > 0) ? (
                <div className="space-y-4">
                  {(() => {
                    const rawCombined = [
                      handover.previousChats,
                      ...chatAttachments.map((c) => c.content || ''),
                    ]
                      .filter(Boolean)
                      .join('\n\n');

                    const cleanedText = cleanRawChatText(rawCombined);
                    const parsedMessages = parseWhatsAppMessages(cleanedText);

                    if (chatViewMode === 'bubbles') {
                      return (
                        <div className="rounded-2xl border border-slate-200 bg-[#efeae2] p-4 sm:p-6 shadow-inner space-y-3.5 max-h-[550px] overflow-y-auto">
                          {parsedMessages.length === 0 ? (
                            <div className="text-center py-8 text-xs text-slate-500">
                              No parsed messages found. Switch to Clean Transcript to view raw text.
                            </div>
                          ) : (
                            parsedMessages.map((msg) => {
                              const isIntern = msg.sender === 'Intern';
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col ${isIntern ? 'items-end' : 'items-start'}`}
                                >
                                  {/* Sender Label & Time */}
                                  <div className="flex items-center gap-2 mb-1 px-1 text-[11px]">
                                    <span
                                      className={`font-bold ${
                                        isIntern ? 'text-emerald-800' : 'text-slate-700'
                                      }`}
                                    >
                                      {isIntern
                                        ? 'SaroHub Intern / Sales'
                                        : msg.senderRaw || handover.clientProfile?.contactPerson || 'Client'}
                                    </span>
                                    {msg.timestamp && (
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {msg.timestamp}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bubble Content */}
                                  <div
                                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs shadow-2xs leading-relaxed ${
                                      isIntern
                                        ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-xs border border-emerald-200/50'
                                        : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/70'
                                    }`}
                                  >
                                    {msg.isVoice ? (
                                      <div className="flex items-center gap-2.5 py-1">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0">
                                          <Mic className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <span className="font-bold text-rose-950 block">
                                            Voice Note Exchanged
                                          </span>
                                          <span className="text-[11px] text-slate-500 block">
                                            &lt;voice message omitted in WhatsApp text export&gt;
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="whitespace-pre-wrap font-sans text-xs">
                                        {msg.text}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    }

                    // Transcript Mode
                    return (
                      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 p-4 shadow-inner space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
                          <span>Cleaned WhatsApp Conversation Transcript:</span>
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-emerald-400 font-bold">
                            Cleaned of Garbage &amp; Encryption Notices
                          </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed pr-2 text-slate-200">
                          {cleanedText}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                  <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  No direct WhatsApp export file was attached. See the chronological CRM outreach log below.
                </div>
              )}

              {/* Complete CRM Activity & Touchpoint Trail */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Chronological CRM Outreach & Communication Logs ({leadTimelineEvents.length} events)
                  </h4>
                </div>

                {leadTimelineEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No timeline events recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {leadTimelineEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                      >
                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shrink-0">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 capitalize">
                              {event.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(event.timestamp).toLocaleDateString()} •{' '}
                              {new Date(event.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium">{event.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------- TAB 3: VOICE & VIDEO ---------------- */}
          {activeTab === 'voice_video' && (
            <div className="space-y-6">
              {/* Voice Notes Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <Mic className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Voice Notes & Audio Debriefs ({voiceAttachments.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Listen to verbal debriefs recorded by the intern explaining client tone and nuances
                      </p>
                    </div>
                  </div>

                  {/* Playback speed controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px]">
                    <span className="text-slate-500 px-1 font-semibold">Speed:</span>
                    {[1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => changePlaybackSpeed(spd)}
                        className={`rounded-lg px-2 py-0.5 font-bold transition ${
                          playbackSpeed === spd
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {voiceAttachments.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                    <Mic className="h-6 w-6 mx-auto text-slate-300 mb-1.5" />
                    No voice debrief was attached to this handover.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {voiceAttachments.map((voice) => (
                      <div
                        key={voice.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePlayAudio(voice)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition cursor-pointer shrink-0"
                          >
                            {playingAudioId === voice.id ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5 ml-0.5" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{voice.title}</span>
                              <span className="rounded bg-rose-100 px-2 py-0.2 text-[10px] font-bold text-rose-800">
                                {voice.duration || 'Voice Memo'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              {voice.content ||
                                voice.transcript ||
                                'Intern audio debrief of client conversation and requirements.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
                          {voice.url && (
                            <audio
                              controls
                              src={voice.url}
                              className="h-8 w-44 sm:w-52 rounded-lg"
                              preload="metadata"
                            />
                          )}
                          {voice.url && (
                            <a
                              href={voice.url}
                              download={`sarohub_audio_${voice.id}.webm`}
                              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Download className="h-3 w-3" /> Download Audio
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Notes & Screen Demos Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Video className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Video Demos & Screen Recordings ({videoAttachments.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Client walkthroughs, problem video clips, or Loom recordings
                    </p>
                  </div>
                </div>

                {videoAttachments.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                    <Video className="h-6 w-6 mx-auto text-slate-300 mb-1.5" />
                    No video demo or screen recording attached.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videoAttachments.map((vid) => (
                      <div
                        key={vid.id}
                        className="rounded-xl border border-slate-200 bg-slate-900 text-white overflow-hidden space-y-2 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between pb-1 text-slate-300">
                          <span className="font-bold truncate">{vid.title}</span>
                          <span className="text-[10px] text-slate-400">{vid.fileSize || 'Video'}</span>
                        </div>

                        {vid.url ? (
                          <video
                            controls
                            src={vid.url}
                            className="w-full rounded-lg max-h-56 bg-black"
                          />
                        ) : (
                          <div className="h-40 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                            Video preview available via external link
                          </div>
                        )}

                        {vid.content && (
                          <p className="text-[11px] text-slate-300 italic">{vid.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------- TAB 4: VISUALS & SCREENSHOTS ---------------- */}
          {activeTab === 'visuals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-purple-600" />
                    Visual Evidence & Screenshots ({screenshotAttachments.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click on any screenshot to open high-resolution zoom view
                  </p>
                </div>
              </div>

              {screenshotAttachments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
                  <ImageIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  No screenshots or visual references attached.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {screenshotAttachments.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setLightboxImage(img.url || null)}
                      className="group cursor-pointer rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition"
                    >
                      <div className="relative aspect-4/3 bg-slate-100 flex items-center justify-center overflow-hidden">
                        {img.url ? (
                          <img
                            src={img.url}
                            alt={img.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition duration-200"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-slate-300" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Maximize2 className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="p-2.5 text-xs">
                        <p className="font-bold text-slate-800 truncate">{img.title}</p>
                        <span className="text-[10px] text-slate-400 block">{img.fileSize || 'Image'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------------- TAB 5: DOCUMENTS & LINKS ---------------- */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Documents */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Attached Documents & Specifications ({docAttachments.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Client RFPs, technical docs, and requirement PDFs
                    </p>
                  </div>
                </div>

                {docAttachments.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                    No document files attached.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {docAttachments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-800 block truncate">
                              {doc.title}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {doc.fileSize || 'Document'}
                            </span>
                          </div>
                        </div>

                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg bg-white border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition shrink-0"
                          >
                            <Download className="h-3 w-3" /> View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Client URLs & References ({linkAttachments.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Client websites, social media channels, or competitor benchmarks
                    </p>
                  </div>
                </div>

                {linkAttachments.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                    No reference links attached.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkAttachments.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Link2 className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span className="font-bold text-slate-800 truncate">{link.title}</span>
                        </div>

                        {link.url && (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline font-semibold shrink-0"
                          >
                            Open Link <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER & EXECUTIVE ACTIONS ================= */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
          {/* Executive Private Note Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Add confidential executive note as ${currentUser.name}...`}
              value={executiveNote}
              onChange={(e) => setExecutiveNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveExecutiveNote();
              }}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
            />
            <button
              onClick={handleSaveExecutiveNote}
              disabled={!executiveNote.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              {isNoteSaved ? 'Saved!' : 'Log Note'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Client Status: <strong className="text-slate-800">{lead?.status || 'Active'}</strong></span>
              <span>•</span>
              <span>Assigned To: <strong className="text-slate-800">{lead ? users.find((u) => u.id === lead.assignedInternId)?.name : 'N/A'}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RETURN TO INTERN DIALOG ================= */}
      {showReturnModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <RotateCcw className="h-4 w-4" />
              Return Lead to {handover.fromUserName}
            </div>
            <p className="text-xs text-slate-600">
              Provide clear feedback so the intern knows what additional client requirements or details are needed:
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Please ask client for their budget range and whether they need iOS or Android before re-submitting."
              value={returnFeedback}
              onChange={(e) => setReturnFeedback(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-hidden"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-3 py-1.5 font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={!returnFeedback.trim()}
                className="rounded-xl bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 disabled:opacity-40"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX MODAL ================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl">
            <img
              src={lightboxImage}
              alt="Expanded Screenshot"
              className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 rounded-full bg-slate-900/80 p-2 text-white hover:bg-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
