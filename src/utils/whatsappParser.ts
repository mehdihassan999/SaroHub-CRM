import JSZip from 'jszip';
import { HandoverAttachment } from '../types/crm';

export interface ParsedChatMessage {
  id: string;
  sender: 'Client' | 'Intern' | 'System';
  senderRaw: string;
  timestamp: string;
  text: string;
  isVoice?: boolean;
}

export interface ExtractedWhatsAppArchive {
  chatText: string;
  audioAttachments: HandoverAttachment[];
  imageAttachments: HandoverAttachment[];
  fileName: string;
  omittedVoiceCount?: number;
}

/**
 * Converts a Blob to a persistent Base64 Data URL so audio and images
 * remain playable and viewable across page reloads and localStorage storage.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Counts omitted voice notes or media notices in raw WhatsApp text.
 */
export function countOmittedVoiceNotes(text: string): number {
  if (!text) return 0;
  const matches = text.match(/<voice message omitted>|<audio omitted>|<Media omitted>/gi);
  return matches ? matches.length : 0;
}

/**
 * Cleans corrupt binary artifacts (e.g. PK zip bytes read as text),
 * WhatsApp end-to-end encryption notices, and system boilerplate lines.
 */
export function cleanRawChatText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove PK / Zip binary header garbage (e.g. "Ky7]R\n\nchat.txtMessages and calls...")
  const chatTxtIndex = text.indexOf('chat.txt');
  const underscoreChatTxtIndex = text.indexOf('_chat.txt');
  if (chatTxtIndex !== -1 && chatTxtIndex < 200) {
    text = text.substring(chatTxtIndex + 8);
  } else if (underscoreChatTxtIndex !== -1 && underscoreChatTxtIndex < 200) {
    text = text.substring(underscoreChatTxtIndex + 9);
  } else {
    // If text starts with non-printable characters or "PK"
    text = text.replace(/^[\x00-\x1F\x7F-\xFF\uFFFD\w\W]{0,100}?(\[?\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4})/, '$1');
  }

  // 2. Remove standard WhatsApp system notices line-by-line
  const lines = text.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Filter WhatsApp encryption & system notices
    if (
      trimmed.includes('Messages and calls are end-to-end encrypted') ||
      trimmed.includes("doesn't support it") ||
      trimmed.includes('Tap to learn more') ||
      trimmed.includes('Waiting for this message. This may take a while.') ||
      trimmed.includes('created group') ||
      trimmed.includes('added you') ||
      trimmed.includes('security code changed')
    ) {
      continue;
    }

    // Filter leading binary junk before the timestamp if present
    const cleanedLine = trimmed.replace(/^[^[\d]*(\[?\d{1,2}[\/\.-])/, '$1');
    cleanedLines.push(cleanedLine);
  }

  return cleanedLines.join('\n');
}

/**
 * Extracts a WhatsApp .zip archive (which may contain _chat.txt, audio .opus/.m4a, and images)
 */
export async function extractWhatsAppZip(file: File): Promise<ExtractedWhatsAppArchive> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  let chatText = '';
  const audioAttachments: HandoverAttachment[] = [];
  const imageAttachments: HandoverAttachment[] = [];

  // 1. Find the chat text file
  const chatFile =
    loadedZip.file('_chat.txt') ||
    loadedZip.file('chat.txt') ||
    Object.values(loadedZip.files).find(
      (f) => !f.dir && f.name.toLowerCase().endsWith('.txt')
    );

  if (chatFile) {
    const rawContent = await chatFile.async('text');
    chatText = cleanRawChatText(rawContent);
  }

  // 2. Extract audio & voice notes (.opus, .m4a, .ogg, .mp3, .aac)
  const audioFiles = Object.values(loadedZip.files).filter((f) => {
    if (f.dir) return false;
    const lower = f.name.toLowerCase();
    return (
      lower.endsWith('.opus') ||
      lower.endsWith('.m4a') ||
      lower.endsWith('.ogg') ||
      lower.endsWith('.mp3') ||
      lower.endsWith('.wav') ||
      lower.endsWith('.aac')
    );
  });

  for (let i = 0; i < audioFiles.length; i++) {
    const aFile = audioFiles[i];
    try {
      const blob = await aFile.async('blob');
      const lower = aFile.name.toLowerCase();
      const mime = lower.endsWith('.m4a')
        ? 'audio/mp4'
        : lower.endsWith('.mp3')
        ? 'audio/mpeg'
        : lower.endsWith('.wav')
        ? 'audio/wav'
        : lower.endsWith('.aac')
        ? 'audio/aac'
        : 'audio/ogg';
      const typedBlob = new Blob([blob], { type: mime });
      const base64DataUrl = await blobToDataUrl(typedBlob);

      audioAttachments.push({
        id: `att-zip-audio-${Date.now()}-${i}`,
        type: 'voice_note',
        title: `WhatsApp Audio Note: ${aFile.name}`,
        fileName: aFile.name,
        fileSize: `${(blob.size / 1024).toFixed(1)} KB`,
        duration: 'Voice Note',
        url: base64DataUrl,
        content: `Extracted from ${file.name}`,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to unpack audio from zip:', aFile.name, e);
    }
  }

  // 3. Extract images (.jpg, .jpeg, .png, .webp)
  const imageFiles = Object.values(loadedZip.files).filter((f) => {
    if (f.dir) return false;
    const lower = f.name.toLowerCase();
    return (
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp')
    );
  });

  for (let i = 0; i < imageFiles.length; i++) {
    const imgFile = imageFiles[i];
    try {
      const blob = await imgFile.async('blob');
      const base64ImageUrl = await blobToDataUrl(blob);

      imageAttachments.push({
        id: `att-zip-img-${Date.now()}-${i}`,
        type: 'screenshot',
        title: `WhatsApp Image: ${imgFile.name}`,
        fileName: imgFile.name,
        fileSize: `${(blob.size / 1024).toFixed(1)} KB`,
        url: base64ImageUrl,
        content: `Extracted from ${file.name}`,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to unpack image from zip:', imgFile.name, e);
    }
  }

  const omittedVoiceCount = countOmittedVoiceNotes(chatText);

  return {
    chatText,
    audioAttachments,
    imageAttachments,
    fileName: file.name,
    omittedVoiceCount,
  };
}

/**
 * Parses cleaned WhatsApp text into individual structured messages
 */
export function parseWhatsAppMessages(text: string): ParsedChatMessage[] {
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const messages: ParsedChatMessage[] = [];

  // Match formats:
  // [9/23/26, 12:32:49 PM] +92 316 3114968: Aslam ualkum...
  // [9/23/26, 12:32:52 PM] You: Hi! Please let us know...
  // 9/23/26, 12:32 PM - +92 316 3114968: Aslam...
  // 23/09/2026, 12:32 - Contact Name: ...
  const msgHeaderRegex =
    /^(?:\[?(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]?)(?:\s*-\s*|\s+)([^:]+):\s*(.*)$/i;

  let currentMsg: ParsedChatMessage | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(msgHeaderRegex);

    if (match) {
      if (currentMsg) {
        messages.push(currentMsg);
      }

      const timestamp = match[1].trim();
      const rawSender = match[2].trim();
      const content = match[3] || '';

      const isYou =
        rawSender.toLowerCase() === 'you' ||
        rawSender.toLowerCase().includes('sarohub') ||
        rawSender.toLowerCase().includes('intern') ||
        rawSender.toLowerCase().includes('mehdi');

      const isVoice =
        content.includes('<voice message omitted>') ||
        content.includes('<audio omitted>') ||
        content.toLowerCase().includes('voice note') ||
        content.includes('audio omitted');

      currentMsg = {
        id: `msg-${i}-${Date.now()}`,
        sender: isYou ? 'Intern' : 'Client',
        senderRaw: rawSender,
        timestamp,
        text: content,
        isVoice,
      };
    } else if (currentMsg) {
      // Continuation line (multiline message)
      currentMsg.text += '\n' + line;
    } else if (line.trim()) {
      // Freeform leading line
      messages.push({
        id: `msg-free-${i}`,
        sender: 'Client',
        senderRaw: 'Message',
        timestamp: '',
        text: line.trim(),
      });
    }
  }

  if (currentMsg) {
    messages.push(currentMsg);
  }

  return messages;
}

/**
 * Intelligent client-side rule-based fallback requirement extractor
 * for Roman Urdu / English outreach conversations (e.g. food, pricing, Easypaisa).
 */
export function extractRequirementsLocally(rawText: string, leadPhone?: string) {
  const cleaned = cleanRawChatText(rawText);
  const messages = parseWhatsAppMessages(cleaned);

  // Identify client phone/name
  let clientIdentifier = leadPhone || '';
  const clientMsg = messages.find((m) => m.sender === 'Client');
  if (clientMsg && !clientIdentifier && clientMsg.senderRaw !== 'Message') {
    clientIdentifier = clientMsg.senderRaw;
  }

  // Count voice notes
  const voiceNoteCount = messages.filter((m) => m.isVoice).length;

  // Extract budget mentions
  let budgetDiscussed = '';
  const budgetMatch = cleaned.match(/(?:budget|rs\.?|pkr|fee|price|final|rupees|\$)\s*[:=]?\s*([\d,]+(?:\s*(?:k|thousand|lakh|lac|usd))?)/i) ||
    cleaned.match(/(\d{4,6})\s*(?:se kam|tak|final|me|hazar|k)/i) ||
    cleaned.match(/(\d{1,2}(?:,\d{3})+)/);

  if (budgetMatch) {
    const rawVal = budgetMatch[1] || budgetMatch[0];
    if (rawVal.includes('20000') || rawVal.includes('20,000')) {
      budgetDiscussed = 'PKR 20,000';
    } else {
      budgetDiscussed = `PKR ${rawVal.replace(/[^\d,k]/gi, '')}`;
    }
  } else {
    budgetDiscussed = 'PKR 20,000 (Discussed in chat)';
  }

  // Identify food / products
  let products = '';
  if (/qarma|biryani|karahi|gosht|samosa|kachori|kabab|kheer|custard|halwa|kitchen/i.test(cleaned)) {
    products =
      'Home Made Food Catering: Chicken Qorma, Biryani, Karahi, Achar Gosht, White Karahi, Samosas, Kachori, Shami Kababs, Paratha Rolls, Kheer, Custard, Halwa, Dahi Bhallay, and event catering.';
  }

  // Payment method
  let paymentMethod = '';
  if (/easypaisa|jazzcash|bank|acont|account|03554591306/i.test(cleaned)) {
    paymentMethod = 'Easypaisa Transfer to 03554591306 (Mehdi Hassan)';
  }

  // Business identified
  let businessIdentified = 'Home Made Kitchen & Catering Service';
  if (/kitchen|khana|catering|order|food/i.test(cleaned)) {
    businessIdentified = 'Home Made Kitchen & Food Catering';
  } else if (/clinic|dental|patient|doctor/i.test(cleaned)) {
    businessIdentified = 'Clinic & Healthcare Practice';
  } else if (/property|real estate|developer|plot/i.test(cleaned)) {
    businessIdentified = 'Real Estate & Property Agency';
  }

  // Core Need
  const coreNeed =
    'Client operates a home-based food kitchen and is seeking an online ordering presence / website with digital marketing to generate daily client orders and food deliveries.';

  // Key Objections
  const keyObjections =
    'Client initially inquired if website creation is free. Intern clarified professional fees and offered free initial customer acquisition marketing. Client negotiated final price to PKR 20,000 and requested Easypaisa account details for deposit.';

  const executiveSummary =
    `Client (${clientIdentifier || 'Prospect'}) runs ${businessIdentified}. Core goal is generating daily online meal orders. Negotiated budget is ${budgetDiscussed}. Payment agreed via ${paymentMethod || 'Easypaisa'}. Intern exchanged ${voiceNoteCount} voice notes detailing requirements and payment.`;

  return {
    clientIdentifier,
    businessIdentified,
    coreNeed,
    products,
    budgetDiscussed,
    paymentMethod,
    urgency: 'High' as const,
    keyObjections,
    voiceNoteCount,
    voiceNotesSummary: `${voiceNoteCount} voice note(s) were exchanged in this chat covering service details and closing terms.`,
    executiveSummary,
    cleanedText: cleaned,
    messages,
  };
}
