export type Role = 'intern' | 'cto' | 'ceo' | 'admin';
export type UserRole = Role;

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone: string;
  avatar: string;
  title: string;
  active: boolean;
  joinedDate: string;
  stats: {
    leadsCollected: number;
    leadsContacted: number;
    messagesSent: number;
    responsesReceived: number;
    followUpsCompleted: number;
    overdueFollowUps: number;
    qualifiedLeads: number;
    wonDeals: number;
  };
}

export type LeadStatus =
  | 'New'
  | 'Message Sent'
  | 'Responded'
  | 'Follow-Up'
  | 'Interested'
  | 'Not Interested'
  | 'Handover Requested'
  | 'Won'
  | 'Lost'
  | 'Researching'
  | 'Contact Ready'
  | 'Contacted'
  | 'Awaiting Response'
  | 'Qualified'
  | 'Requirements Collected'
  | 'Technical Review'
  | 'Proposal Required'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Follow Up Later'
  | 'Do Not Contact';

export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';
export type Priority = 'High' | 'Medium' | 'Low';

export type LeadSource =
  | 'Google Maps'
  | 'Facebook'
  | 'Instagram'
  | 'LinkedIn'
  | 'Website'
  | 'Referral'
  | 'Cold Outreach'
  | 'Advertisement'
  | 'Other';

export interface ScoreSignal {
  reason: string;
  points: number;
}

export interface ClientRequirements {
  serviceNeeded?: string;
  coreProblem?: string;
  existingTechOrUrl?: string;
  keyFeatures?: string[];
  desiredFeatures?: string[];
  targetUsers?: string;
  preferredPlatform?: string;
  estimatedBudget?: string;
  timeline?: string;
  integrations?: string[];
  specialConstraints?: string;
  aiSummary?: string;
  updatedAt?: string;

  // 10-Point Client Requirement Builder fields
  businessGoals?: string;
  targetAudience?: string;
  featureRequirements?: string[];
  platform?: string[];
  designPreferences?: string;
  existingSystems?: string;
  budgetExpectation?: string;
  targetDeadline?: string;
  decisionMaker?: string;
  collectedAt?: string;
}

export interface Lead {
  id: string;
  // Basic info
  businessName: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  country: string;
  city: string;
  industry: string;
  businessType: string;
  socialMedia?: string;
  googleMapsUrl?: string;

  // Source & business profile
  source: LeadSource;
  existingWebsite: boolean;
  websiteQuality?: 'None' | 'Outdated' | 'Average' | 'Modern';
  socialMediaPresence?: 'None' | 'Inactive' | 'Active';
  businessSize?: '1-10' | '11-50' | '51-200' | '200+';
  estimatedOpportunity?: string;
  notes?: string;

  // Sales information
  interestedService: string;
  estimatedBudget?: string;
  expectedTimeline?: string;
  temperature: LeadTemperature;
  temperatureReason: string;
  priority: Priority;
  assignedInternId: string;
  supportingMemberIds: string[];

  // Pipeline status & scoring
  status: LeadStatus;
  leadScore: number;
  scoreSignals: ScoreSignal[];

  // Follow-up & activity tracking
  nextAction?: string;
  nextFollowUpDate?: string; // YYYY-MM-DD
  nextFollowUpTime?: string; // HH:MM
  lastContactDate?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];

  // Handover & technical state
  isHandedOverToCeo?: boolean;
  handedOverTo?: 'CEO' | 'CTO';
  handoverStatus?: 'Pending' | 'Accepted' | 'Returned';
  handoverId?: string;
  originalInternId?: string;
  originalInternName?: string;
  hasPendingTechnicalRequest?: boolean;
  clientRequirements?: ClientRequirements;
  proposalDraft?: string;
}

export type TimelineItemType =
  | 'whatsapp_sent'
  | 'whatsapp_received'
  | 'phone_call'
  | 'email_sent'
  | 'internal_note'
  | 'status_change'
  | 'technical_qa'
  | 'handover_event'
  | 'voice_note'
  | 'proposal_created'
  | 'WhatsApp Message'
  | 'Call'
  | 'Internal Note'
  | 'Voice Note'
  | 'CTO Escalation'
  | 'CTO Response'
  | 'Proposal Sent'
  | 'Status Change'
  | 'Requirement Collected'
  | string;

export interface TimelineItem {
  id: string;
  leadId: string;
  type: TimelineItemType;
  authorId?: string;
  authorName?: string;
  authorRole?: Role;
  userId?: string;
  content: string;
  timestamp: string;
  isInternalOnly?: boolean; // Client MUST NEVER see this!
  isInternal?: boolean;
  direction?: 'inbound' | 'outbound' | 'Received' | 'Sent' | string;
  metadata?: {
    audioUrl?: string;
    audioDuration?: string;
    transcript?: string;
    aiSummary?: string;
    oldStatus?: LeadStatus;
    newStatus?: LeadStatus;
    technicalRequestId?: string;
    handoverId?: string;
    callOutcome?: 'Answered' | 'No Answer' | 'Busy' | 'Follow-up Requested';
    fileName?: string;
    fileSize?: string;
    fileUrl?: string;
  };
}

export interface TechnicalRequest {
  id: string;
  leadId: string;
  businessName: string;
  internId: string;
  internName: string;
  question: string;
  context: string;
  clientRequirement: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Awaiting Technical Response' | 'In Review' | 'Answered' | 'Closed';
  ctoAnswer?: string;
  ctoAnsweredAt?: string;
  ctoVoiceNoteUrl?: string;
  createdAt: string;
  attachments?: { name: string; url: string }[];
}

export interface HandoverBrief {
  business: string;
  contact: string;
  service: string;
  status: string;
  budget: string;
  timeline: string;
  requirementsSummary: string;
  previousCommunicationSummary: string;
  technicalNotes: string;
  nextAction: string;
  coreProblem?: string;
  keyObjections?: string;
}

export interface HandoverAttachment {
  id: string;
  type: 'chat' | 'voice_note' | 'url' | 'file' | 'screenshot' | 'video' | 'document';
  title: string;
  content?: string;
  url?: string;
  fileName?: string;
  fileSize?: string;
  duration?: string;
  transcript?: string;
  caption?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface HandoverClientProfile {
  businessName: string;
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  country?: string;
  industry?: string;
  businessType?: string;
  website?: string;
  source?: string;
}

export interface HandoverWhatClientWants {
  coreNeed: string;
  interestedService: string;
  budget: string;
  timeline: string;
  urgency: 'Normal' | 'High' | 'Critical';
  keyObjections?: string;
  deliverablesSummary?: string;
}

export interface AIChatIntelligence {
  clientNameOrPhone?: string;
  businessIdentified?: string;
  coreNeed?: string;
  productsOrMenu?: string;
  budgetDiscussed?: string;
  paymentMethod?: string;
  urgency?: 'Normal' | 'High' | 'Critical' | string;
  keyObjectionsOrQuestions?: string;
  voiceNotesSummary?: string;
  executiveSummary?: string;
  cleanedFormattedChat?: string;
}

export interface HandoverRequest {
  id: string;
  leadId: string;
  businessName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  handoverTo?: 'CEO' | 'CTO';
  internId?: string;
  internName?: string;
  reason: string;
  summary?: string;
  status: 'Pending' | 'Accepted' | 'Returned' | 'Completed' | 'Pending Review' | 'Declined' | 'Rejected';
  brief?: HandoverBrief;
  clientProfile?: HandoverClientProfile;
  whatClientWants?: HandoverWhatClientWants;
  attachments?: HandoverAttachment[];
  previousChats?: string;
  aiChatIntelligence?: AIChatIntelligence;
  clientUrls?: string[];
  timelineSnapshot?: TimelineItem[];
  createdAt: string;
  reviewedAt?: string;
  ceoReviewNotes?: string;
  returnReason?: string;
}

export interface FollowUpItem {
  id: string;
  leadId: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  ownerId: string;
  ownerName: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // e.g. "10:30 AM"
  actionNote: string;
  status: 'pending' | 'completed' | 'overdue' | 'rescheduled';
  priority: Priority;
  completedAt?: string;
}

export type FollowUp = FollowUpItem;

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'lead_assigned'
    | 'lead_reassigned'
    | 'follow_up_due'
    | 'follow_up_overdue'
    | 'cto_question'
    | 'cto_answered'
    | 'handover_requested'
    | 'handover_accepted'
    | 'internal_mention';
  leadId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  leadId?: string;
  leadName?: string;
  details: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  category:
    | 'First Contact'
    | 'Follow-Up'
    | 'Website Services'
    | 'Mobile App'
    | 'SaaS & CRM'
    | 'AI Automation'
    | 'Digital Marketing'
    | 'Proposal Follow-Up'
    | 'Meeting Confirmation'
    | 'Payment Follow-Up'
    | 'Not Interested'
    | 'Re-engagement';
  body: string;
}

export interface KnowledgeArticle {
  id: string;
  category: 'Services' | 'Tech Stack' | 'Pricing Guidelines' | 'Process' | 'FAQ';
  title: string;
  content: string;
  tags: string[];
}
