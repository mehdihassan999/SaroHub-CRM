import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  X,
  ArrowRightLeft,
  MessageSquare,
  Mic,
  MicOff,
  Link2,
  FileUp,
  Trash2,
  Play,
  Pause,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  FileText,
  Video,
  Image,
  Sparkles,
} from 'lucide-react';
import { Lead, HandoverAttachment } from '../types/crm';

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

const HANDOVER_REASONS = [
  'Client is interested',
  'Technical question',
  'Client requested meeting',
  'Client requested quotation',
  'Client wants custom solution',
  'Need management discussion',
  'Other',
];

export const HandoverModal: React.FC<HandoverModalProps> = ({ isOpen, onClose, lead }) => {
  const { createHandoverRequest, timeline } = useCRM();

  // 1. Handover Target
  const [handoverTo, setHandoverTo] = useState<'CEO' | 'CTO'>('CEO');

  // 2. Reason
  const [reason, setReason] = useState('Client is interested');
  const [customReason, setCustomReason] = useState('');

  // 3. Intern Summary
  const [internSummary, setInternSummary] = useState(
    lead.notes
      ? `Client: ${lead.businessName}. Note: ${lead.notes}. Expressed interest in ${lead.interestedService}.`
      : `Client owns a business in ${lead.city}. They are interested in ${lead.interestedService} and asked for pricing & details.`
  );

  // 4. Attachments State
  const [attachments, setAttachments] = useState<HandoverAttachment[]>([]);
  const [activeAttachTab, setActiveAttachTab] = useState<
    'chat' | 'screenshot' | 'video' | 'voice' | 'doc' | 'link'
  >('chat');

  // WhatsApp Chat Export / Text
  const [chatExportText, setChatExportText] = useState('');
  const [chatFileLoaded, setChatFileLoaded] = useState(false);

  // Link State
  const [linkCategory, setLinkCategory] = useState('Client Website');
  const [linkUrl, setLinkUrl] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // File Inputs
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (activeAudioRef.current) activeAudioRef.current.pause();
    };
  }, []);

  if (!isOpen) return null;

  // WhatsApp .txt upload handler
  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setChatExportText(content);
      setChatFileLoaded(true);

      const newAtt: HandoverAttachment = {
        id: `att-chat-${Date.now()}`,
        type: 'chat',
        title: `WhatsApp Chat Export (${file.name})`,
        content: content.slice(0, 5000), // attach preview
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        createdAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, newAtt]);
    };
    reader.readAsText(file);
  };

  const handleAddPastedChat = () => {
    if (!chatExportText.trim()) return;
    const newAtt: HandoverAttachment = {
      id: `att-chat-${Date.now()}`,
      type: 'chat',
      title: 'WhatsApp Conversation Log',
      content: chatExportText.trim(),
      createdAt: new Date().toISOString(),
    };
    setAttachments((prev) => [...prev, newAtt]);
    setChatExportText('');
    setChatFileLoaded(true);
  };

  // Screenshots upload
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      const newAtt: HandoverAttachment = {
        id: `att-screen-${Date.now()}-${index}`,
        type: 'screenshot',
        title: file.name || `Screenshot ${index + 1}`,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        url: URL.createObjectURL(file),
        createdAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, newAtt]);
    });
  };

  // Video upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newAtt: HandoverAttachment = {
      id: `att-vid-${Date.now()}`,
      type: 'video',
      title: file.name || 'Client Screen/Video Note',
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      url: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
    };
    setAttachments((prev) => [...prev, newAtt]);
  };

  // Document upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      const newAtt: HandoverAttachment = {
        id: `att-doc-${Date.now()}-${index}`,
        type: 'document',
        title: file.name || `Document ${index + 1}`,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        url: URL.createObjectURL(file),
        createdAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, newAtt]);
    });
  };

  // Link addition
  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const newAtt: HandoverAttachment = {
      id: `att-link-${Date.now()}`,
      type: 'url',
      title: `${linkCategory}: ${linkUrl.replace(/^https?:\/\//, '')}`,
      url,
      createdAt: new Date().toISOString(),
    };
    setAttachments((prev) => [...prev, newAtt]);
    setLinkUrl('');
  };

  // Voice recording
  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const durationStr = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60)
            .toString()
            .padStart(2, '0')}`;

          const newAtt: HandoverAttachment = {
            id: `att-voice-${Date.now()}`,
            type: 'voice_note',
            title: `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
            url: audioUrl,
            duration: durationStr || '0:15',
            createdAt: new Date().toISOString(),
          };
          setAttachments((prev) => [...prev, newAtt]);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingSeconds(0);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } else {
        simulateVoice();
      }
    } catch {
      simulateVoice();
    }
  };

  const simulateVoice = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      const durationStr = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60)
        .toString()
        .padStart(2, '0')}`;
      const newAtt: HandoverAttachment = {
        id: `att-voice-${Date.now()}`,
        type: 'voice_note',
        title: `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        url: '',
        duration: durationStr || '0:25',
        content: 'Intern voice memo explaining client conversation details.',
        createdAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, newAtt]);
    }
    setRecordingSeconds(0);
  };

  const togglePlayAudio = (att: HandoverAttachment) => {
    if (playingAudioId === att.id) {
      if (activeAudioRef.current) activeAudioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (activeAudioRef.current) activeAudioRef.current.pause();
      if (att.url) {
        const audio = new Audio(att.url);
        activeAudioRef.current = audio;
        audio.play();
        setPlayingAudioId(att.id);
        audio.onended = () => setPlayingAudioId(null);
      } else {
        setPlayingAudioId(att.id);
        setTimeout(() => setPlayingAudioId(null), 3000);
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Submit Handover
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedReason = reason === 'Other' ? customReason || 'Other' : reason;

    createHandoverRequest(lead.id, selectedReason, {
      handoverTo,
      summary: internSummary.trim(),
      attachments,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-6 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Handover Lead</h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  {lead.businessName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transfer complete lead context to CEO or CTO for closing.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Section 11: Handover To: CEO or CTO */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Handover To:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHandoverTo('CEO')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                  handoverTo === 'CEO'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    handoverTo === 'CEO' ? 'border-amber-600' : 'border-slate-400'
                  }`}
                >
                  {handoverTo === 'CEO' && <div className="h-2 w-2 rounded-full bg-amber-600" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">CEO (Mehdi Raza)</span>
                  <span className="text-[10px] text-slate-500 block">
                    Pricing, deal negotiation, contract closing
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setHandoverTo('CTO')}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                  handoverTo === 'CTO'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    handoverTo === 'CTO' ? 'border-indigo-600' : 'border-slate-400'
                  }`}
                >
                  {handoverTo === 'CTO' && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">CTO (Nawaz Sharif)</span>
                  <span className="text-[10px] text-slate-500 block">
                    Technical feasibility, architecture, custom tech
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 11: Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-amber-600 focus:outline-hidden"
            >
              {HANDOVER_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {reason === 'Other' && (
              <input
                type="text"
                placeholder="Specify reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 p-2 text-xs focus:outline-hidden"
              />
            )}
          </div>

          {/* Section 11: Handover Information (Automatically includes existing info) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1.5">
            <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wide">
              Included Lead Information (Automatic):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block">Business:</span>
                <span className="font-bold text-slate-900">{lead.businessName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact:</span>
                <span className="font-bold text-slate-900">{lead.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone / WhatsApp:</span>
                <span className="font-mono text-slate-900">{lead.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Service:</span>
                <span className="font-medium text-slate-900 truncate block">
                  {lead.interestedService}
                </span>
              </div>
            </div>
          </div>

          {/* Section 11: My Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              My Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Client owns a dental clinic in Dubai. They need a new website with appointment booking. They are interested and asked for pricing. They also asked whether WhatsApp integration is possible."
              value={internSummary}
              onChange={(e) => setInternSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          {/* Section 12: Attach Complete Conversation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  Attach Complete Conversation Context
                </span>
                <p className="text-[11px] text-slate-500">
                  Upload chats, screenshots, voice notes, video, or documents
                </p>
              </div>
              {attachments.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {attachments.length} attached
                </span>
              )}
            </div>

            {/* Attachment Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveAttachTab('chat')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  activeAttachTab === 'chat'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                WhatsApp Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('screenshot')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  activeAttachTab === 'screenshot'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Screenshots
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('video')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  activeAttachTab === 'video'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Videos
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('voice')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  activeAttachTab === 'voice'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Voice Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('doc')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  activeAttachTab === 'doc'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Documents
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('link')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  activeAttachTab === 'link'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Links
              </button>
            </div>

            {/* Tab Contents */}
            {activeAttachTab === 'chat' && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">
                    Upload WhatsApp Chat Export (.txt) or Paste:
                  </span>
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload .txt export
                  </button>
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    accept=".txt"
                    onChange={handleChatFileUpload}
                    className="hidden"
                  />
                </div>

                <textarea
                  rows={3}
                  placeholder="Paste WhatsApp conversation transcript here..."
                  value={chatExportText}
                  onChange={(e) => setChatExportText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs focus:outline-hidden font-mono"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPastedChat}
                    disabled={!chatExportText.trim()}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Attach Conversation Log
                  </button>
                </div>
              </div>
            )}

            {activeAttachTab === 'screenshot' && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Upload Screenshots (multiple):</span>
                  <button
                    type="button"
                    onClick={() => screenshotInputRef.current?.click()}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <Image className="h-3.5 w-3.5" /> Choose Images
                  </button>
                  <input
                    type="file"
                    ref={screenshotInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleScreenshotUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Attach WhatsApp message screenshots, reference designs, or quotation screenshots.
                </p>
              </div>
            )}

            {activeAttachTab === 'video' && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Upload Video Note:</span>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <Video className="h-3.5 w-3.5" /> Choose Video
                  </button>
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Attach client video demo, loom walkthrough, or screen recording.
                </p>
              </div>
            )}

            {activeAttachTab === 'voice' && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Record Voice Message:</span>
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="rounded-lg bg-rose-600 px-3 py-1 text-white font-bold hover:bg-rose-700 flex items-center gap-1 animate-pulse"
                    >
                      <MicOff className="h-3.5 w-3.5" /> Stop ({recordingSeconds}s)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <Mic className="h-3.5 w-3.5" /> Start Recording
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Record a brief voice explanation of what the client wants.
                </p>
              </div>
            )}

            {activeAttachTab === 'doc' && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Upload Documents (PDF, Word, Excel):</span>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <FileText className="h-3.5 w-3.5" /> Choose Documents
                  </button>
                  <input
                    type="file"
                    ref={docInputRef}
                    multiple
                    onChange={handleDocUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {activeAttachTab === 'link' && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={linkCategory}
                    onChange={(e) => setLinkCategory(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                  >
                    <option value="Client Website">Client Website</option>
                    <option value="Reference Website">Reference Website</option>
                    <option value="Google Drive">Google Drive</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Other Link">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="sm:col-span-2 rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!linkUrl.trim()}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Attach Link
                  </button>
                </div>
              </div>
            )}

            {/* List of Attached Materials */}
            {attachments.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-40 overflow-y-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Attached Package Items ({attachments.length}):
                </span>
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold text-slate-800 truncate">{att.title}</span>
                      <span className="text-[10px] text-slate-400">({att.type})</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {att.type === 'voice_note' && (
                        <button
                          type="button"
                          onClick={() => togglePlayAudio(att)}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          {playingAudioId === att.id ? 'Pause' : 'Play'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Submit */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Handing over to: <strong className="text-slate-900">{handoverTo}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 flex items-center gap-1.5"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Submit Handover to {handoverTo}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
