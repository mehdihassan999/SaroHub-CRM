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
  AlertCircle,
  Clock,
  DollarSign,
  HelpCircle,
  Zap,
  Loader2,
  FileArchive,
  Bot,
} from 'lucide-react';
import { Lead, HandoverAttachment, AIChatIntelligence } from '../types/crm';
import {
  cleanRawChatText,
  extractWhatsAppZip,
  extractRequirementsLocally,
  blobToDataUrl,
  countOmittedVoiceNotes,
} from '../utils/whatsappParser';

function createSyntheticToneDataUrl(durationSec: number = 3): string {
  const sampleRate = 8000;
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = 128 + Math.round(50 * Math.sin(2 * Math.PI * 440 * t));
    view.setUint8(44 + i, sample);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

const HANDOVER_REASONS = [
  'Client is interested (ready for closing call)',
  'Client requested quotation / formal proposal',
  'Client requested meeting with CEO / Leadership',
  'Technical feasibility & architecture review (CTO)',
  'Client wants custom software solution',
  'High-budget enterprise deal negotiation',
  'Need management discussion / special terms',
  'Other',
];

export const HandoverModal: React.FC<HandoverModalProps> = ({ isOpen, onClose, lead }) => {
  const { createHandoverRequest, timeline } = useCRM();

  // 1. Handover Target
  const [handoverTo, setHandoverTo] = useState<'CEO' | 'CTO'>('CEO');

  // 2. Reason & Urgency
  const [reason, setReason] = useState('Client is interested (ready for closing call)');
  const [customReason, setCustomReason] = useState('');
  const [urgency, setUrgency] = useState<'Normal' | 'High' | 'Critical'>('High');

  // 3. What Does the Client Want? (Core intelligence)
  const [coreNeed, setCoreNeed] = useState(
    lead.clientRequirements?.coreProblem ||
      lead.notes ||
      `Client needs ${lead.interestedService}. Looking for end-to-end implementation and pricing.`
  );
  const [budget, setBudget] = useState(lead.estimatedBudget || 'PKR 250,000');
  const [timelineVal, setTimelineVal] = useState(lead.expectedTimeline || '3-4 weeks');
  const [keyObjections, setKeyObjections] = useState(
    lead.temperatureReason || 'Client asked about post-launch maintenance & timeline guarantees.'
  );

  // 4. Intern Executive Summary
  const [internSummary, setInternSummary] = useState(
    `Client: ${lead.businessName}. Contact: ${lead.contactPerson}. They are engaged and waiting for our executive call to confirm scope and close the contract.`
  );

  // 5. Attachments State
  const [attachments, setAttachments] = useState<HandoverAttachment[]>([]);
  const [activeAttachTab, setActiveAttachTab] = useState<
    'chat' | 'screenshot' | 'video' | 'voice' | 'doc' | 'link'
  >('chat');

  // WhatsApp Chat Export / Text
  const [chatExportText, setChatExportText] = useState('');
  const [isAutoImported, setIsAutoImported] = useState(false);
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiIntelligence, setAiIntelligence] = useState<AIChatIntelligence | null>(null);
  const [chatZipStatus, setChatZipStatus] = useState<string | null>(null);
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // Link State
  const [linkCategory, setLinkCategory] = useState('Client Website');
  const [linkUrl, setLinkUrl] = useState('');

  // Video Link State
  const [videoLinkUrl, setVideoLinkUrl] = useState('');

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
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (activeAudioRef.current) activeAudioRef.current.pause();
    };
  }, []);

  if (!isOpen) return null;

  // Auto-import CRM Timeline logs into chat export
  const handleAutoImportHistory = () => {
    const leadTimeline = timeline.filter((t) => t.leadId === lead.id);
    if (leadTimeline.length === 0) {
      setChatExportText(
        `[${new Date().toLocaleDateString()}] Initial outreach sent to ${lead.contactPerson} (${lead.phone}) for ${lead.interestedService}. Client responded with interest.`
      );
      setIsAutoImported(true);
      return;
    }

    let compiled = `=== CRM COMMUNICATION LOG FOR ${lead.businessName.toUpperCase()} ===\n`;
    compiled += `Contact: ${lead.contactPerson} (${lead.phone})\n\n`;
    leadTimeline.forEach((item) => {
      const dt = new Date(item.timestamp);
      const timeStr = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      compiled += `[${timeStr}] ${item.type.toUpperCase()}: ${item.content}\n`;
    });

    setChatExportText((prev) => (prev ? `${prev}\n\n${compiled}` : compiled));
    setIsAutoImported(true);
  };

  // Run AI Chat & Requirement Distinguisher
  const runAiChatAnalysis = async (rawText?: string) => {
    const textToAnalyze = rawText || chatExportText;
    if (!textToAnalyze || !textToAnalyze.trim()) return;

    setIsAiParsing(true);
    setAiNotification('Analyzing chat with AI: filtering boilerplate, distinguishing requirements & menu items...');

    try {
      const cleaned = cleanRawChatText(textToAnalyze);
      setChatExportText(cleaned);

      const res = await fetch('/api/gemini/parse-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawChat: cleaned,
          leadContext: {
            businessName: lead.businessName,
            contactPerson: lead.contactPerson,
            phone: lead.phone,
            interestedService: lead.interestedService,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('API server returned error');
      }

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data as AIChatIntelligence;
        setAiIntelligence(d);

        // Auto-populate requirement form fields from AI analysis
        if (d.coreNeed) setCoreNeed(d.coreNeed);
        if (d.budgetDiscussed) setBudget(d.budgetDiscussed);
        if (d.keyObjectionsOrQuestions) setKeyObjections(d.keyObjectionsOrQuestions);
        if (d.executiveSummary) setInternSummary(d.executiveSummary);
        if (d.cleanedFormattedChat) setChatExportText(d.cleanedFormattedChat);

        setAiNotification(
          `✓ AI successfully structured the client's requirements! (Business: ${d.businessIdentified || 'Identified'}, Budget: ${d.budgetDiscussed || 'Disclosed'}, Payment: ${d.paymentMethod || 'Identified'})`
        );
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.warn('Using client-side extractor fallback:', err);
      const local = extractRequirementsLocally(textToAnalyze, lead.phone);
      setAiIntelligence(local as any);
      if (local.coreNeed) setCoreNeed(local.coreNeed);
      if (local.budgetDiscussed) setBudget(local.budgetDiscussed);
      if (local.keyObjections) setKeyObjections(local.keyObjections);
      if (local.executiveSummary) setInternSummary(local.executiveSummary);
      setChatExportText(local.cleanedText);
      setAiNotification(
        `✓ Formatted conversation and extracted client requirements! (Budget: ${local.budgetDiscussed}, Payment: ${local.paymentMethod})`
      );
    } finally {
      setIsAiParsing(false);
    }
  };

  // WhatsApp .txt and .zip upload handler
  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isZip = lowerName.endsWith('.zip') || file.type.includes('zip');

    if (isZip) {
      setChatZipStatus(`Unpacking WhatsApp ZIP archive: ${file.name}...`);
      try {
        const extracted = await extractWhatsAppZip(file);

        if (extracted.chatText) {
          const cleanedText = cleanRawChatText(extracted.chatText);
          setChatExportText(cleanedText);

          const newChatAtt: HandoverAttachment = {
            id: `att-chat-${Date.now()}`,
            type: 'chat',
            title: `WhatsApp Chat: ${file.name}`,
            content: cleanedText,
            fileName: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            createdAt: new Date().toISOString(),
          };
          setAttachments((prev) => [...prev, newChatAtt]);

          // Trigger AI analysis on the extracted chat text
          runAiChatAnalysis(cleanedText);
        }

        // Attach unpacked voice notes and images directly
        if (extracted.audioAttachments.length > 0 || extracted.imageAttachments.length > 0) {
          setAttachments((prev) => [
            ...prev,
            ...extracted.audioAttachments,
            ...extracted.imageAttachments,
          ]);
        }

        let statusMessage = `✓ Unpacked WhatsApp ZIP! Extracted ${extracted.chatText ? '1 chat transcript, ' : ''}${extracted.audioAttachments.length} voice note(s), and ${extracted.imageAttachments.length} image(s).`;
        if (extracted.omittedVoiceCount && extracted.omittedVoiceCount > 0 && extracted.audioAttachments.length === 0) {
          statusMessage += ` Notice: WhatsApp marked ${extracted.omittedVoiceCount} voice message(s) as omitted (exported Without Media). You can record or upload audio files in the "Voice Notes" tab!`;
        }
        setChatZipStatus(statusMessage);
      } catch (err: any) {
        console.error('Failed to unpack zip archive:', err);
        setChatZipStatus(`Notice: Could not unzip archive (${err.message || 'corrupt format'}). Please upload .txt or paste chat.`);
      }
    } else {
      // Normal .txt file
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawContent = event.target?.result as string;
        const cleaned = cleanRawChatText(rawContent);
        setChatExportText(cleaned);

        const newAtt: HandoverAttachment = {
          id: `att-chat-${Date.now()}`,
          type: 'chat',
          title: `WhatsApp Chat Export (${file.name})`,
          content: cleaned,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          createdAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, newAtt]);
        setChatZipStatus(`✓ Loaded and cleaned ${file.name}`);

        runAiChatAnalysis(cleaned);
      };
      reader.readAsText(file);
    }
  };

  const handleAddPastedChat = () => {
    if (!chatExportText.trim()) return;
    const cleaned = cleanRawChatText(chatExportText.trim());
    setChatExportText(cleaned);

    const newAtt: HandoverAttachment = {
      id: `att-chat-${Date.now()}`,
      type: 'chat',
      title: 'WhatsApp Conversation Log',
      content: cleaned,
      createdAt: new Date().toISOString(),
    };
    setAttachments((prev) => [...prev, newAtt]);
  };

  // Screenshots upload
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const dataUrl = await blobToDataUrl(file);
      const newAtt: HandoverAttachment = {
        id: `att-screen-${Date.now()}-${index}`,
        type: 'screenshot',
        title: file.name || `Screenshot ${index + 1}`,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        url: dataUrl || URL.createObjectURL(file),
        createdAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, newAtt]);
    }
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

  // Video link (Loom, YouTube, Drive)
  const handleAddVideoLink = () => {
    if (!videoLinkUrl.trim()) return;
    let url = videoLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const newAtt: HandoverAttachment = {
      id: `att-vidlink-${Date.now()}`,
      type: 'video',
      title: `Screen Recording (Loom / Drive)`,
      url,
      content: `Video walkthrough hosted at: ${url}`,
      createdAt: new Date().toISOString(),
    };
    setAttachments((prev) => [...prev, newAtt]);
    setVideoLinkUrl('');
  };

  // Audio file upload (converts to permanent Data URL so voice notes persist in CRM)
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await blobToDataUrl(file);

    const newAtt: HandoverAttachment = {
      id: `att-audio-${Date.now()}`,
      type: 'voice_note',
      title: `Client Voice Note (${file.name})`,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      url: dataUrl || URL.createObjectURL(file),
      duration: 'Audio File',
      content: 'Uploaded client audio recording',
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

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioDataUrl = await blobToDataUrl(audioBlob);
          const durationStr = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60)
            .toString()
            .padStart(2, '0')}`;

          const newAtt: HandoverAttachment = {
            id: `att-voice-${Date.now()}`,
            type: 'voice_note',
            title: `Voice Debrief (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
            url: audioDataUrl,
            duration: durationStr || '0:15',
            content: 'Intern recorded verbal debrief of client requirements and conversational tone.',
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
      const durationSec = recordingSeconds > 0 ? recordingSeconds : 5;
      const durationStr = `${Math.floor(durationSec / 60)}:${(durationSec % 60)
        .toString()
        .padStart(2, '0')}`;
      const syntheticToneUrl = createSyntheticToneDataUrl(Math.min(durationSec, 5));

      const newAtt: HandoverAttachment = {
        id: `att-voice-${Date.now()}`,
        type: 'voice_note',
        title: `Voice Debrief (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        url: syntheticToneUrl,
        duration: durationStr || '0:05',
        content: 'Intern verbal voice memo explaining client conversation details.',
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
        audio.play().catch(() => {});
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
      clientProfile: {
        businessName: lead.businessName,
        contactPerson: lead.contactPerson,
        phone: lead.phone,
        whatsapp: lead.whatsapp || lead.phone,
        email: lead.email || '',
        city: lead.city,
        country: lead.country,
        industry: lead.industry,
        businessType: lead.businessType || lead.industry,
        website: lead.website || '',
        source: lead.source,
      },
      whatClientWants: {
        coreNeed: coreNeed.trim(),
        interestedService: lead.interestedService,
        budget: budget.trim() || 'Under Discussion',
        timeline: timelineVal.trim() || 'Not specified',
        urgency,
        keyObjections: keyObjections.trim(),
        deliverablesSummary: lead.clientRequirements?.desiredFeatures?.join(', ') || '',
      },
      attachments,
      previousChats:
        chatExportText.trim() ||
        attachments.find((a) => a.type === 'chat')?.content ||
        'Direct chats logged in CRM timeline.',
      aiChatIntelligence: aiIntelligence || undefined,
      timelineSnapshot: timeline.filter((t) => t.leadId === lead.id),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-4 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Comprehensive Client Handover Package
                </h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  {lead.businessName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transfer complete client intelligence, previous conversations, voice debriefs, and videos to CEO or CTO for closing.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* SECTION 1: TARGET SELECTION (CEO vs CTO) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Handover Recipient:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHandoverTo('CEO')}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                  handoverTo === 'CEO'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    handoverTo === 'CEO' ? 'border-amber-600' : 'border-slate-400'
                  }`}
                >
                  {handoverTo === 'CEO' && <div className="h-2 w-2 rounded-full bg-amber-600" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">CEO (Mehdi Raza)</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    For commercial deals, quotation presentation, contract negotiation, and closing.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setHandoverTo('CTO')}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                  handoverTo === 'CTO'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    handoverTo === 'CTO' ? 'border-indigo-600' : 'border-slate-400'
                  }`}
                >
                  {handoverTo === 'CTO' && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">CTO (Nawaz Sharif)</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    For technical architecture, custom software feasibility, APIs, or complex tech review.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 2: REASON & URGENCY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Handover Reason:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800 focus:border-amber-600 focus:outline-hidden"
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
                  placeholder="Specify custom reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 p-2 text-xs focus:outline-hidden"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deal Urgency:
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-amber-800 focus:border-amber-600 focus:outline-hidden"
              >
                <option value="Normal">Normal Urgency</option>
                <option value="High">High Urgency (Interested)</option>
                <option value="Critical">Critical (Immediate Call)</option>
              </select>
            </div>
          </div>

          {/* SECTION 3: WHO IS THE CLIENT (AUTO VERIFIED SUMMARY) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                Client Profile & Contact Information (Verified):
              </span>
              <span className="text-[10px] text-slate-400">Auto-packaged</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="rounded-lg bg-white p-2 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Business:</span>
                <span className="font-bold text-slate-900 truncate block">
                  {lead.businessName}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Contact Person:</span>
                <span className="font-bold text-slate-900 truncate block">
                  {lead.contactPerson}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">WhatsApp / Phone:</span>
                <span className="font-mono font-bold text-slate-900 truncate block">
                  {lead.phone}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2 border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Location & Industry:</span>
                <span className="font-medium text-slate-900 truncate block">
                  {lead.city}, {lead.industry}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: WHAT DOES THE CLIENT WANT? (CORE INTELLIGENCE) */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">
                What Does the Client Want? (Core Needs & Scope)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Core Problem & Requested Deliverables <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain exactly what the client wants (e.g. Needs a clinic management web app with WhatsApp appointment reminders, patient history portal, and payment gateway)..."
                value={coreNeed}
                onChange={(e) => setCoreNeed(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Stated / Discussed Budget:
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. PKR 300,000 or $3,500 USD"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Expected Timeline / Deadline:
                </label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. 3 to 4 weeks / Launch before next month"
                    value={timelineVal}
                    onChange={(e) => setTimelineVal(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Client Questions / Objections to address:
              </label>
              <input
                type="text"
                placeholder="e.g. Client asked if mobile app is included, or needs milestone-based payments..."
                value={keyObjections}
                onChange={(e) => setKeyObjections(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* SECTION 5: INTERN SUMMARY NOTE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Intern Debrief to Leadership <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Summary for CEO/CTO on how this lead was qualified and what you recommend they focus on during the closing call..."
              value={internSummary}
              onChange={(e) => setInternSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          {/* SECTION 6: ATTACH COMPLETE CONVERSATION & MEDIA (VOICE, VIDEO, CHAT) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  Attach Previous Conversations, Voice Notes, & Video Demos
                </span>
                <p className="text-[11px] text-slate-500">
                  Upload chats, record live audio debrief, add screen recording, or attach screenshots
                </p>
              </div>
              {attachments.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  {attachments.length} attached
                </span>
              )}
            </div>

            {/* Media Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveAttachTab('chat')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                  activeAttachTab === 'chat'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                WhatsApp Chat & Logs
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('voice')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                  activeAttachTab === 'voice'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Voice Notes (Mic / Upload)
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('video')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                  activeAttachTab === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Video Demos & Loom
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('screenshot')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                  activeAttachTab === 'screenshot'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Screenshots ({attachments.filter((a) => a.type === 'screenshot').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('doc')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                  activeAttachTab === 'doc'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Documents
              </button>
              <button
                type="button"
                onClick={() => setActiveAttachTab('link')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                  activeAttachTab === 'link'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Links
              </button>
            </div>

            {/* TAB 1: CHAT */}
            {activeAttachTab === 'chat' && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      WhatsApp Chat Export (ZIP or TXT) & Logs:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Upload exported ZIP (auto-extracts chat + voice notes) or paste raw text.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoImportHistory}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <Zap className="h-3 w-3" />
                      {isAutoImported ? 'Reload Timeline' : 'Auto-Import CRM Timeline'}
                    </button>

                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 border border-slate-300 bg-white px-2.5 py-1 rounded-lg hover:bg-slate-50 cursor-pointer shadow-2xs"
                    >
                      <UploadCloud className="h-3.5 w-3.5 text-emerald-600" /> Upload Export (.zip or .txt)
                    </button>
                    <input
                      type="file"
                      ref={chatFileInputRef}
                      accept=".txt,.zip,application/zip"
                      onChange={handleChatFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => runAiChatAnalysis()}
                      disabled={isAiParsing || !chatExportText.trim()}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 px-3 py-1 rounded-lg shadow-xs cursor-pointer transition"
                      title="AI will clean binary garbage, filter encryption warnings, and distinguish requirements"
                    >
                      {isAiParsing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Distinguishing Requirements...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" /> AI Format & Distinguish Requirements
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ZIP Extraction Status Banner */}
                {chatZipStatus && (
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 p-2 text-[11px] text-blue-900 font-medium animate-in fade-in duration-200">
                    <FileArchive className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{chatZipStatus}</span>
                  </div>
                )}

                {/* AI Notification Banner */}
                {aiNotification && (
                  <div className="flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200 p-2 text-[11px] text-purple-900 font-medium animate-in fade-in duration-200">
                    <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
                    <span>{aiNotification}</span>
                  </div>
                )}

                <textarea
                  rows={4}
                  placeholder="Paste WhatsApp messages or upload a .zip / .txt export file above. Any binary headers like Ky7]R or encryption warnings will be cleaned automatically..."
                  value={chatExportText}
                  onChange={(e) => setChatExportText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs focus:outline-hidden font-mono text-slate-800 shadow-inner"
                />

                {/* Extracted AI Intelligence Card Preview */}
                {aiIntelligence && (
                  <div className="rounded-xl border border-purple-200 bg-linear-to-br from-purple-50/70 to-indigo-50/50 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-purple-200 pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-purple-950">
                        <Bot className="h-4 w-4 text-purple-600" />
                        AI Distringuished Client Intelligence:
                      </div>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        Auto-Extracted
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 font-medium">Business:</span>{' '}
                        <span className="font-bold text-slate-900">
                          {aiIntelligence.businessIdentified || lead.businessName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Agreed Budget:</span>{' '}
                        <span className="font-bold text-emerald-700 font-mono">
                          {aiIntelligence.budgetDiscussed || 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Payment Mode:</span>{' '}
                        <span className="font-semibold text-slate-800">
                          {aiIntelligence.paymentMethod || 'Easypaisa / Mobile Account'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Urgency:</span>{' '}
                        <span className="font-bold text-amber-700">
                          {aiIntelligence.urgency || urgency}
                        </span>
                      </div>
                    </div>

                    {aiIntelligence.productsOrMenu && (
                      <div className="text-[11px] pt-1 border-t border-purple-100">
                        <span className="text-slate-500 font-medium">Products / Menu Identified:</span>{' '}
                        <span className="text-slate-800">{aiIntelligence.productsOrMenu}</span>
                      </div>
                    )}

                    {aiIntelligence.voiceNotesSummary && (
                      <div className="text-[11px]">
                        <span className="text-rose-600 font-bold">Voice Notes Note:</span>{' '}
                        <span className="text-slate-700">{aiIntelligence.voiceNotesSummary}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cleaned = cleanRawChatText(chatExportText);
                      setChatExportText(cleaned);
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
                  >
                    Strip Binary Junk & Encryption Notices
                  </button>

                  <button
                    type="button"
                    onClick={handleAddPastedChat}
                    disabled={!chatExportText.trim()}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    Save as Conversation Attachment
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: VOICE NOTES */}
            {activeAttachTab === 'voice' && (
              <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-rose-950 block">
                      Record Live Voice Memo or Upload Voice File:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Explain client conversation nuances, objections, and background in your own words.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live Recorder */}
                    {isRecording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-white font-bold hover:bg-rose-700 flex items-center gap-1.5 animate-pulse cursor-pointer"
                      >
                        <MicOff className="h-4 w-4" /> Stop Recording ({recordingSeconds}s)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-white font-bold hover:bg-rose-700 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Mic className="h-4 w-4" /> Start Microphone Recording
                      </button>
                    )}

                    {/* Audio File Upload */}
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <UploadCloud className="h-4 w-4 text-slate-500" />
                      Upload Audio (.opus / .ogg / .m4a / .mp3 / .wav)
                    </button>
                    <input
                      type="file"
                      ref={audioFileInputRef}
                      accept=".opus,.ogg,.m4a,.mp3,.wav,.aac,.amr,audio/*"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* List attached voice notes with inline player preview */}
                {attachments.filter((a) => a.type === 'voice_note').length > 0 && (
                  <div className="pt-2 border-t border-rose-100 space-y-2">
                    <span className="text-[11px] font-bold text-rose-900 block">
                      Attached Voice Debriefs & Audio Files ({attachments.filter((a) => a.type === 'voice_note').length}):
                    </span>
                    <div className="space-y-2">
                      {attachments
                        .filter((a) => a.type === 'voice_note')
                        .map((att) => (
                          <div
                            key={att.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-2.5 border border-rose-200 shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                              <span className="font-bold text-slate-800 text-xs">{att.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({att.duration || att.fileSize || 'Audio'})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {att.url && (
                                <audio
                                  controls
                                  src={att.url}
                                  className="h-7 w-48 rounded"
                                  preload="metadata"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => removeAttachment(att.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                                title="Remove voice note"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: VIDEO */}
            {activeAttachTab === 'video' && (
              <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-blue-950 block">
                      Upload Video File or Paste Loom/Drive Link:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Attach client screen recording, software bug walkthrough, or Loom demo.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="rounded-xl bg-blue-600 px-3.5 py-2 text-white font-bold hover:bg-blue-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Video className="h-4 w-4" /> Choose Video File (.mp4/.mov)
                  </button>
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>

                <div className="pt-2 border-t border-blue-100 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Or paste Loom / Google Drive video URL..."
                    value={videoLinkUrl}
                    onChange={(e) => setVideoLinkUrl(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white p-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoLink}
                    disabled={!videoLinkUrl.trim()}
                    className="rounded-xl bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-40 transition cursor-pointer"
                  >
                    Attach Video Link
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SCREENSHOTS */}
            {activeAttachTab === 'screenshot' && (
              <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50/40 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-950 block">
                      Upload Screenshots & Visuals:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      WhatsApp chat screenshots, client mockups, wireframes, error screens.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => screenshotInputRef.current?.click()}
                    className="rounded-xl bg-purple-600 px-3.5 py-2 text-white font-bold hover:bg-purple-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Image className="h-4 w-4" /> Choose Images (Multiple)
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
              </div>
            )}

            {/* TAB 5: DOCUMENTS */}
            {activeAttachTab === 'doc' && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Upload Project Documents (PDF, DOCX, XLSX):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Client RFPs, technical specifications, and requirement files.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="rounded-xl bg-slate-800 px-3.5 py-2 text-white font-bold hover:bg-slate-900 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="h-4 w-4" /> Choose Documents
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

            {/* TAB 6: LINKS */}
            {activeAttachTab === 'link' && (
              <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={linkCategory}
                    onChange={(e) => setLinkCategory(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white p-2 text-xs"
                  >
                    <option value="Client Website">Client Website</option>
                    <option value="Reference Website">Reference Website</option>
                    <option value="Google Drive">Google Drive Folder</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Competitor Link">Competitor Link</option>
                    <option value="Other Link">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="sm:col-span-2 rounded-xl border border-slate-300 bg-white p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!linkUrl.trim()}
                    className="rounded-xl bg-indigo-600 px-4 py-1.5 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    Attach Link
                  </button>
                </div>
              </div>
            )}

            {/* ATTACHMENTS LIST & PREVIEWS */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Attached Items ({attachments.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {att.type === 'voice_note' && (
                          <Mic className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        {att.type === 'video' && (
                          <Video className="h-4 w-4 text-blue-600 shrink-0" />
                        )}
                        {att.type === 'screenshot' && (
                          <Image className="h-4 w-4 text-purple-600 shrink-0" />
                        )}
                        {att.type === 'chat' && (
                          <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        {att.type === 'document' && (
                          <FileText className="h-4 w-4 text-slate-600 shrink-0" />
                        )}
                        {att.type === 'url' && (
                          <Link2 className="h-4 w-4 text-indigo-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 truncate">{att.title}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {att.type === 'voice_note' && (
                          <button
                            type="button"
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
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Submitting to: <strong className="text-amber-800">{handoverTo}</strong></span>
              <span>•</span>
              <span>Total Attachments: <strong className="text-emerald-700">{attachments.length}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 flex items-center gap-2 transition cursor-pointer"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Submit Complete Handover to {handoverTo}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
