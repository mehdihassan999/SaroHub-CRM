import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Lead,
  TimelineItem,
  TechnicalRequest,
  HandoverRequest,
  HandoverAttachment,
  HandoverClientProfile,
  HandoverWhatClientWants,
  AIChatIntelligence,
  FollowUpItem,
  NotificationItem,
  AuditLogItem,
  MessageTemplate,
  KnowledgeArticle,
  LeadStatus,
  Priority,
  LeadTemperature,
  UserRole,
} from '../types/crm';
import {
  INITIAL_USERS,
  INITIAL_LEADS,
  INITIAL_TIMELINE,
  INITIAL_TECHNICAL_REQUESTS,
  INITIAL_HANDOVER_REQUESTS,
  INITIAL_FOLLOW_UPS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_MESSAGE_TEMPLATES,
  INITIAL_KNOWLEDGE_ARTICLES,
  DEMO_USERS,
  DEMO_LEADS,
  DEMO_TIMELINE,
  DEMO_TECHNICAL_REQUESTS,
  DEMO_HANDOVER_REQUESTS,
  DEMO_FOLLOW_UPS,
  DEMO_NOTIFICATIONS,
  DEMO_AUDIT_LOGS,
} from '../data/mockData';
import { checkLeadDuplicates, DuplicateCheckResult } from '../utils/phoneNormalizer';

/**
 * Checks if a lead belongs to or should be visible to a given user.
 * - CEO, CTO, and Admin have complete company-wide permission to all leads.
 * - Interns see leads that they are assigned to, leads they originally created/collected,
 *   leads they are supporting, and leads they have handed over to CEO/CTO.
 *   This ensures after handover the leads stay completely saved with all details to that intern.
 */
export function isUserAssociatedWithLead(
  lead: Lead,
  user: User,
  handovers: HandoverRequest[] = []
): boolean {
  if (user.role === 'ceo' || user.role === 'cto' || user.role === 'admin') {
    return true;
  }
  if (lead.assignedInternId === user.id) return true;
  if (lead.originalInternId === user.id) return true;
  if (lead.supportingMemberIds && lead.supportingMemberIds.includes(user.id)) return true;
  if (handovers.some((h) => h.leadId === lead.id && h.fromUserId === user.id)) return true;
  return false;
}

interface CRMContextType {
  currentUser: User;
  users: User[];
  switchUser: (userId: string) => void;
  createUser: (userData: {
    name: string;
    email: string;
    phone?: string;
    role?: UserRole;
    title?: string;
    avatar?: string;
  }) => User;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => boolean;

  isCreateInternModalOpen: boolean;
  setIsCreateInternModalOpen: (open: boolean) => void;

  leads: Lead[];
  addLead: (leadInput: Partial<Lead>, allowDuplicate?: boolean) => { success: boolean; lead?: Lead; duplicateResult?: DuplicateCheckResult };
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  reassignLead: (leadId: string, newOwnerId: string, reason?: string) => boolean;
  deleteLead: (leadId: string) => boolean;
  checkDuplicate: (input: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    businessName?: string;
    website?: string;
    excludeLeadId?: string;
  }) => DuplicateCheckResult;

  timeline: TimelineItem[];
  addTimelineItem: (item: {
    leadId: string;
    type: TimelineItem['type'];
    content: string;
    isInternalOnly?: boolean;
    metadata?: TimelineItem['metadata'];
  }) => void;
  addTimelineEvent: (event: {
    leadId: string;
    userId?: string;
    type: string;
    content: string;
    isInternal?: boolean;
    direction?: 'inbound' | 'outbound' | 'Received' | 'Sent' | string;
    metadata?: any;
  }) => void;

  techRequests: TechnicalRequest[];
  createTechRequest: (data: {
    leadId: string;
    question: string;
    context: string;
    clientRequirement: string;
    urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  }) => TechnicalRequest;
  answerTechRequest: (requestId: string, answer: string, voiceNoteUrl?: string) => void;

  handoverRequests: HandoverRequest[];
  createHandoverRequest: (
    leadId: string,
    reason?: string,
    extra?: {
      handoverTo?: 'CEO' | 'CTO';
      summary?: string;
      clientProfile?: HandoverClientProfile;
      whatClientWants?: HandoverWhatClientWants;
      attachments?: HandoverAttachment[];
      previousChats?: string;
      aiChatIntelligence?: AIChatIntelligence;
      clientUrls?: string[];
      timelineSnapshot?: TimelineItem[];
    }
  ) => HandoverRequest | null;
  reviewHandoverRequest: (requestId: string, status: HandoverRequest['status'], notes?: string) => void;

  followUps: FollowUpItem[];
  completeFollowUp: (followUpId: string) => void;
  rescheduleFollowUp: (followUpId: string, newDate: string, newTime: string, newNote?: string) => void;
  scheduleFollowUp: (
    leadIdOrObj:
      | string
      | {
          leadId: string;
          dueDate: string;
          dueTime?: string;
          actionNote: string;
          priority?: Priority;
        },
    dueDate?: string,
    dueTime?: string,
    actionNote?: string,
    priority?: Priority
  ) => void;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  auditLogs: AuditLogItem[];
  messageTemplates: MessageTemplate[];
  templates: MessageTemplate[];
  addMessageTemplate: (template: Omit<MessageTemplate, 'id'>) => void;
  knowledgeBase: KnowledgeArticle[];

  callAiAssistant: (payload: {
    action: string;
    leadContext?: any;
    userPrompt?: string;
    draftText?: string;
    technicalQuery?: string;
  }) => Promise<{ text: string; fallback?: boolean }>;

  clearAllData: () => void;
  resetToDemoData: () => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCheckLeadModalOpen: boolean;
  setIsCheckLeadModalOpen: (open: boolean) => void;
  isNewLeadModalOpen: boolean;
  setIsNewLeadModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (leadId: string | null) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'sarohub_crm_v1_';

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load users from storage or fallback
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}current_user_id`);
    const found = users.find((u) => u.id === savedId);
    return found || users[0]; // Ahmed Khan by default
  });

  // Leads state
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}leads`);
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  // Timeline items
  const [timeline, setTimeline] = useState<TimelineItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}timeline`);
    return saved ? JSON.parse(saved) : INITIAL_TIMELINE;
  });

  // Tech requests
  const [techRequests, setTechRequests] = useState<TechnicalRequest[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}tech_requests`);
    return saved ? JSON.parse(saved) : INITIAL_TECHNICAL_REQUESTS;
  });

  // Handover requests
  const [handoverRequests, setHandoverRequests] = useState<HandoverRequest[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}handover_requests`);
    return saved ? JSON.parse(saved) : INITIAL_HANDOVER_REQUESTS;
  });

  // Follow-ups
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}follow_ups`);
    return saved ? JSON.parse(saved) : INITIAL_FOLLOW_UPS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}notifications`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}audit_logs`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Message templates
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}templates`);
    return saved ? JSON.parse(saved) : INITIAL_MESSAGE_TEMPLATES;
  });

  // Knowledge base
  const [knowledgeBase] = useState<KnowledgeArticle[]>(INITIAL_KNOWLEDGE_ARTICLES);

  // Global UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckLeadModalOpen, setIsCheckLeadModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateInternModalOpen, setIsCreateInternModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}leads`, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}timeline`, JSON.stringify(timeline));
  }, [timeline]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}tech_requests`, JSON.stringify(techRequests));
  }, [techRequests]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}handover_requests`, JSON.stringify(handoverRequests));
  }, [handoverRequests]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}follow_ups`, JSON.stringify(followUps));
  }, [followUps]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}templates`, JSON.stringify(messageTemplates));
  }, [messageTemplates]);

  // Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}current_user_id`, target.id);
    }
  };

  const createUser = (userData: {
    name: string;
    email: string;
    phone?: string;
    role?: UserRole;
    title?: string;
    avatar?: string;
  }): User => {
    // Only CEO, CTO, or Admin can create intern accounts
    if (currentUser.role !== 'ceo' && currentUser.role !== 'cto' && currentUser.role !== 'admin') {
      alert('Permission Denied: Only CEO and CTO have permission to create intern accounts.');
      throw new Error('Permission denied: Only CEO and CTO can create accounts.');
    }

    const assignedRole = userData.role || 'intern';
    const cleanSlug = userData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newId = `user-${cleanSlug || 'intern'}-${Date.now().toString(36).slice(-4)}`;

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&h=120&q=80',
    ];
    const pickedAvatar = userData.avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newUser: User = {
      id: newId,
      name: userData.name.trim(),
      email: userData.email.trim(),
      phone: userData.phone?.trim() || '+92 300 1234567',
      role: assignedRole,
      title: userData.title?.trim() || (assignedRole === 'intern' ? 'Lead Generation Intern' : 'Technical Specialist'),
      avatar: pickedAvatar,
      active: true,
      joinedDate: new Date().toISOString().split('T')[0],
      stats: {
        leadsCollected: 0,
        leadsContacted: 0,
        messagesSent: 0,
        responsesReceived: 0,
        followUpsCompleted: 0,
        overdueFollowUps: 0,
        qualifiedLeads: 0,
        wonDeals: 0,
      },
    };

    setUsers((prev) => {
      const next = [...prev, newUser];
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}users`, JSON.stringify(next));
      return next;
    });

    logAudit(
      'Created Intern Account',
      newUser.id,
      newUser.name,
      `New individual account created by ${currentUser.name} (${currentUser.role.toUpperCase()}) for ${newUser.name} (${assignedRole})`
    );

    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}users`, JSON.stringify(next));
      return next;
    });
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
  };

  const deleteUser = (userId: string): boolean => {
    if (currentUser.role !== 'ceo' && currentUser.role !== 'cto' && currentUser.role !== 'admin') {
      alert('Permission Denied: Only CEO and CTO can manage intern accounts.');
      return false;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return false;
    if (target.role === 'ceo' || target.role === 'cto') {
      alert('Cannot remove primary Executive accounts.');
      return false;
    }

    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== userId);
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}users`, JSON.stringify(next));
      return next;
    });

    logAudit(
      'Archived Intern Account',
      userId,
      target.name,
      `Intern account safely removed/archived by ${currentUser.name}`
    );
    return true;
  };

  const logAudit = (action: string, leadId?: string, leadName?: string, details?: string) => {
    const newEntry: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      leadId,
      leadName,
      details: details || `${currentUser.name} performed ${action}`,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const calculateLeadScore = (lead: Partial<Lead>): { score: number; signals: { reason: string; points: number }[] } => {
    const signals: { reason: string; points: number }[] = [];
    let score = 20; // baseline

    if (lead.status === 'Won') return { score: 100, signals: [{ reason: 'Deal won and closed', points: 100 }] };
    if (lead.status === 'Lost' || lead.status === 'Do Not Contact') return { score: 10, signals: [{ reason: 'Lead marked inactive/lost', points: 10 }] };

    if (lead.phone || lead.whatsapp) {
      signals.push({ reason: 'Direct contact phone/WhatsApp verified', points: 15 });
      score += 15;
    }
    if (lead.status === 'Responded' || lead.status === 'Qualified' || lead.status === 'Requirements Collected') {
      signals.push({ reason: 'Prospect actively engaged in conversation', points: 25 });
      score += 25;
    }
    if (lead.estimatedBudget && lead.estimatedBudget.trim() !== '') {
      signals.push({ reason: 'Budget range specified', points: 15 });
      score += 15;
    }
    if (lead.clientRequirements?.keyFeatures?.length) {
      signals.push({ reason: 'Functional requirements documented', points: 15 });
      score += 15;
    }
    if (lead.temperature === 'Hot') {
      signals.push({ reason: 'Hot temperature rating', points: 10 });
      score += 10;
    } else if (lead.temperature === 'Warm') {
      signals.push({ reason: 'Warm interest level', points: 5 });
      score += 5;
    }

    return { score: Math.min(score, 99), signals };
  };

  const checkDuplicate = (input: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    businessName?: string;
    website?: string;
    excludeLeadId?: string;
  }) => {
    return checkLeadDuplicates(input, leads);
  };

  const addLead = (leadInput: Partial<Lead>, allowDuplicate: boolean = true) => {
    // Duplicate check for awareness
    const dupResult = checkDuplicate({
      phone: leadInput.phone,
      whatsapp: leadInput.whatsapp || leadInput.phone,
      email: leadInput.email,
      businessName: leadInput.businessName,
      website: leadInput.website,
    });

    if (!allowDuplicate && dupResult.hasDuplicate && dupResult.confidence === 'Exact') {
      return { success: false, duplicateResult: dupResult };
    }

    const { score, signals } = calculateLeadScore(leadInput);
    const newId = `lead-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const newLead: Lead = {
      id: newId,
      businessName: leadInput.businessName?.trim() || (leadInput.phone?.trim() ? `Lead (${leadInput.phone.trim()})` : 'New Lead'),
      contactPerson: leadInput.contactPerson?.trim() || 'Contact Person',
      phone: leadInput.phone || '',
      whatsapp: leadInput.whatsapp || leadInput.phone || '',
      email: leadInput.email || '',
      website: leadInput.website || '',
      country: leadInput.country || 'Pakistan',
      city: leadInput.city || 'Karachi',
      industry: leadInput.industry || 'Technology & Services',
      businessType: leadInput.businessType || 'SMB',
      socialMedia: leadInput.socialMedia || '',
      googleMapsUrl: leadInput.googleMapsUrl || '',
      source: leadInput.source || 'Cold Outreach',
      existingWebsite: leadInput.existingWebsite ?? false,
      websiteQuality: leadInput.websiteQuality || 'None',
      socialMediaPresence: leadInput.socialMediaPresence || 'Inactive',
      businessSize: leadInput.businessSize || '1-10',
      estimatedOpportunity: leadInput.estimatedOpportunity || '',
      notes: leadInput.notes || '',
      interestedService: leadInput.interestedService || 'Custom Software Development',
      estimatedBudget: leadInput.estimatedBudget || '',
      expectedTimeline: leadInput.expectedTimeline || '1-2 months',
      temperature: leadInput.temperature || 'Warm',
      temperatureReason: leadInput.temperatureReason || 'Newly captured prospect',
      priority: leadInput.priority || 'Medium',
      assignedInternId: leadInput.assignedInternId || currentUser.id,
      supportingMemberIds: [],
      status: leadInput.status || 'New',
      leadScore: score,
      scoreSignals: signals,
      nextAction: leadInput.nextAction || 'Initiate first-contact outreach message on WhatsApp',
      nextFollowUpDate: leadInput.nextFollowUpDate || new Date().toISOString().split('T')[0],
      nextFollowUpTime: leadInput.nextFollowUpTime || '11:00 AM',
      createdAt: nowIso,
      updatedAt: nowIso,
      tags: leadInput.tags || ['New Lead'],
    };

    setLeads((prev) => [newLead, ...prev]);

    // Update user stats
    setUsers((prev) =>
      prev.map((u) =>
        u.id === newLead.assignedInternId
          ? { ...u, stats: { ...u.stats, leadsCollected: u.stats.leadsCollected + 1 } }
          : u
      )
    );

    // Initial audit log
    logAudit('Created Lead', newLead.id, newLead.businessName, `Assigned to ${currentUser.name}`);

    // If follow-up date is set, schedule follow-up automatically
    if (newLead.nextFollowUpDate) {
      const fup: FollowUpItem = {
        id: `fup-${Date.now()}`,
        leadId: newLead.id,
        businessName: newLead.businessName,
        contactPerson: newLead.contactPerson,
        phone: newLead.phone,
        ownerId: newLead.assignedInternId,
        ownerName: currentUser.name,
        dueDate: newLead.nextFollowUpDate,
        dueTime: newLead.nextFollowUpTime || '10:00 AM',
        actionNote: newLead.nextAction || 'First follow-up',
        status: 'pending',
        priority: newLead.priority,
      };
      setFollowUps((prev) => [fup, ...prev]);
    }

    return { success: true, lead: newLead, duplicateResult: dupResult };
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          const merged = { ...lead, ...updates, updatedAt: new Date().toISOString() };
          const { score, signals } = calculateLeadScore(merged);
          return { ...merged, leadScore: score, scoreSignals: signals };
        }
        return lead;
      })
    );
  };

  const reassignLead = (leadId: string, newOwnerId: string, reason?: string) => {
    // Role check: Only CEO, CTO, or Admin can reassign, unless an intern hands over to CEO
    if (currentUser.role === 'intern' && newOwnerId !== 'user-mehdi') {
      alert('Interns can only request handover to CEO or CTO.');
      return false;
    }

    const targetLead = leads.find((l) => l.id === leadId);
    const newOwner = users.find((u) => u.id === newOwnerId);
    if (!targetLead || !newOwner) return false;

    // Preserve the original intern's ownership and history so after handover the lead remains saved to them
    const originalInternId = targetLead.originalInternId || targetLead.assignedInternId;
    const originalInternName =
      targetLead.originalInternName ||
      users.find((u) => u.id === targetLead.assignedInternId)?.name ||
      'Intern';
    const supporting = Array.from(
      new Set([
        ...(targetLead.supportingMemberIds || []),
        targetLead.assignedInternId,
        originalInternId,
      ])
    );

    updateLead(leadId, {
      assignedInternId: newOwnerId,
      originalInternId,
      originalInternName,
      supportingMemberIds: supporting,
    });

    logAudit(
      'Reassigned Lead',
      leadId,
      targetLead.businessName,
      `Reassigned from ${targetLead.assignedInternId} to ${newOwner.name}. Reason: ${reason || 'Operational handover'}`
    );

    // Notification for new owner
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: newOwnerId,
      title: 'Lead Reassigned to You',
      message: `Lead "${targetLead.businessName}" has been assigned to you by ${currentUser.name}.`,
      type: 'lead_reassigned',
      leadId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    return true;
  };

  const deleteLead = (leadId: string) => {
    // Only CEO or Admin can delete
    if (currentUser.role !== 'ceo' && currentUser.role !== 'admin') {
      alert('Permission Denied: Interns cannot delete leads. Every lead is company property of SaroHub Technologies.');
      return false;
    }
    const target = leads.find((l) => l.id === leadId);
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    logAudit('Deleted Lead', leadId, target?.businessName, 'Permanently removed by executive role.');
    return true;
  };

  const addTimelineItem = (item: {
    leadId: string;
    type: TimelineItem['type'];
    content: string;
    isInternalOnly?: boolean;
    metadata?: TimelineItem['metadata'];
  }) => {
    const newItem: TimelineItem = {
      id: `time-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId: item.leadId,
      type: item.type,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: item.content,
      timestamp: new Date().toISOString(),
      isInternalOnly: item.isInternalOnly ?? false,
      metadata: item.metadata,
    };

    setTimeline((prev) => [newItem, ...prev]);

    // Also update lead's lastContactDate if it was a client message or call
    if (['whatsapp_sent', 'whatsapp_received', 'phone_call', 'email_sent'].includes(item.type)) {
      updateLead(item.leadId, { lastContactDate: newItem.timestamp });
    }
  };

  const addTimelineEvent = (event: {
    leadId: string;
    userId?: string;
    type: string;
    content: string;
    isInternal?: boolean;
    direction?: 'inbound' | 'outbound' | 'Received' | 'Sent' | string;
    metadata?: any;
  }) => {
    const newItem: TimelineItem = {
      id: `time-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId: event.leadId,
      type: event.type,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: event.content,
      timestamp: new Date().toISOString(),
      isInternalOnly: event.isInternal ?? false,
      direction: event.direction,
      metadata: event.metadata,
    };
    setTimeline((prev) => [newItem, ...prev]);
  };

  const createTechRequest = (data: {
    leadId: string;
    question: string;
    context: string;
    clientRequirement: string;
    urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  }) => {
    const lead = leads.find((l) => l.id === data.leadId);
    const newReq: TechnicalRequest = {
      id: `tech-${Date.now()}`,
      leadId: data.leadId,
      businessName: lead?.businessName || 'Unknown Lead',
      internId: currentUser.id,
      internName: currentUser.name,
      question: data.question,
      context: data.context,
      clientRequirement: data.clientRequirement,
      urgency: data.urgency,
      status: 'Awaiting Technical Response',
      createdAt: new Date().toISOString(),
    };

    setTechRequests((prev) => [newReq, ...prev]);
    updateLead(data.leadId, { hasPendingTechnicalRequest: true, status: 'Technical Review' });

    // Timeline item
    addTimelineItem({
      leadId: data.leadId,
      type: 'technical_qa',
      content: `Technical Escalation to CTO: "${data.question}" [Urgency: ${data.urgency}]`,
      isInternalOnly: true,
      metadata: { technicalRequestId: newReq.id },
    });

    // Notify CTO Nawaz
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: 'user-nawaz', // CTO
      title: 'New Technical Question in Queue',
      message: `${currentUser.name} escalated question for ${lead?.businessName}: "${data.question}"`,
      type: 'cto_question',
      leadId: data.leadId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    logAudit('Created Technical Escalation', data.leadId, lead?.businessName, `Question: ${data.question}`);
    return newReq;
  };

  const answerTechRequest = (requestId: string, answer: string, voiceNoteUrl?: string) => {
    const req = techRequests.find((r) => r.id === requestId);
    if (!req) return;

    const nowIso = new Date().toISOString();
    setTechRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Answered',
              ctoAnswer: answer,
              ctoAnsweredAt: nowIso,
              ctoVoiceNoteUrl: voiceNoteUrl,
            }
          : r
      )
    );

    updateLead(req.leadId, { hasPendingTechnicalRequest: false });

    // Add CTO answer to communication timeline
    addTimelineItem({
      leadId: req.leadId,
      type: 'technical_qa',
      content: `CTO Nawaz answered: "${answer}"`,
      isInternalOnly: true,
      metadata: { technicalRequestId: requestId },
    });

    // Notify original intern
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: req.internId,
      title: 'CTO Answered Your Technical Query',
      message: `CTO Nawaz answered your technical question for ${req.businessName}. You can now continue with the prospect.`,
      type: 'cto_answered',
      leadId: req.leadId,
      isRead: false,
      createdAt: nowIso,
    };
    setNotifications((prev) => [notif, ...prev]);

    logAudit('Answered Technical Request', req.leadId, req.businessName, `Answer provided by ${currentUser.name}`);
  };

  const createHandoverRequest = (
    leadId: string,
    reason: string = 'Handover for executive deal closing',
    extra?: {
      handoverTo?: 'CEO' | 'CTO';
      summary?: string;
      clientProfile?: HandoverClientProfile;
      whatClientWants?: HandoverWhatClientWants;
      attachments?: HandoverAttachment[];
      previousChats?: string;
      aiChatIntelligence?: AIChatIntelligence;
      clientUrls?: string[];
      timelineSnapshot?: TimelineItem[];
    }
  ): HandoverRequest | null => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const targetTo = extra?.handoverTo === 'CTO' ? 'CTO' : 'CEO';
    const targetUserId = targetTo === 'CTO' ? 'user-nawaz' : 'user-mehdi';
    const targetUserName = targetTo === 'CTO' ? 'Nawaz Sharif (CTO)' : 'Mehdi Raza (CEO)';

    // Compile comprehensive handover brief from lead context
    const brief = {
      business: lead.businessName,
      contact: `${lead.contactPerson} (${lead.phone})`,
      service: lead.interestedService,
      status: lead.status,
      budget: extra?.whatClientWants?.budget || lead.estimatedBudget || 'Under Discussion',
      timeline: extra?.whatClientWants?.timeline || lead.expectedTimeline || 'Not specified',
      requirementsSummary:
        extra?.whatClientWants?.coreNeed ||
        extra?.summary ||
        lead.clientRequirements?.aiSummary ||
        lead.clientRequirements?.coreProblem ||
        lead.notes ||
        'Client qualified; high buying intent expressed.',
      previousCommunicationSummary: `Total ${timeline.filter((t) => t.leadId === leadId).length} communication logs. Last contact on ${lead.lastContactDate || 'recently'}.`,
      technicalNotes: lead.hasPendingTechnicalRequest
        ? 'Technical questions were reviewed.'
        : 'Architecture validated; ready for executive review.',
      nextAction: lead.nextAction || `${targetTo} meeting to review deal and negotiate schedule.`,
      coreProblem: extra?.whatClientWants?.coreNeed || lead.clientRequirements?.coreProblem,
      keyObjections: extra?.whatClientWants?.keyObjections || lead.temperatureReason,
    };

    const clientProfile: HandoverClientProfile = extra?.clientProfile || {
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
    };

    const whatClientWants: HandoverWhatClientWants = extra?.whatClientWants || {
      coreNeed: extra?.summary || lead.clientRequirements?.coreProblem || lead.notes || 'Client interested in digital transformation.',
      interestedService: lead.interestedService,
      budget: lead.estimatedBudget || 'Under Discussion',
      timeline: lead.expectedTimeline || 'Not specified',
      urgency: (lead.priority === 'High' ? 'High' : 'Normal') as 'Normal' | 'High' | 'Critical',
      keyObjections: lead.temperatureReason || '',
      deliverablesSummary: lead.clientRequirements?.desiredFeatures?.join(', ') || lead.clientRequirements?.keyFeatures?.join(', ') || '',
    };

    const leadTimelineHistory = timeline.filter((t) => t.leadId === leadId);

    const newHandover: HandoverRequest = {
      id: `handover-${Date.now()}`,
      leadId,
      businessName: lead.businessName,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserId: targetUserId,
      toUserName: targetUserName,
      handoverTo: targetTo,
      reason: reason || 'Client is interested',
      summary: extra?.summary || whatClientWants.coreNeed || '',
      status: 'Pending',
      brief,
      clientProfile,
      whatClientWants,
      attachments: extra?.attachments || [],
      previousChats: extra?.previousChats || '',
      aiChatIntelligence: extra?.aiChatIntelligence,
      clientUrls: extra?.clientUrls || [],
      timelineSnapshot: extra?.timelineSnapshot || leadTimelineHistory,
      createdAt: new Date().toISOString(),
    };

    const originalInternId = lead.originalInternId || lead.assignedInternId || currentUser.id;
    const originalInternName = lead.originalInternName || currentUser.name;
    const supporting = Array.from(
      new Set([
        ...(lead.supportingMemberIds || []),
        currentUser.id,
        lead.assignedInternId,
        originalInternId,
      ])
    );

    setHandoverRequests((prev) => [newHandover, ...prev]);
    updateLead(leadId, {
      isHandedOverToCeo: true,
      handedOverTo: targetTo,
      handoverStatus: 'Pending',
      handoverId: newHandover.id,
      originalInternId,
      originalInternName,
      status: 'Handover Requested',
      supportingMemberIds: supporting,
    });

    // Timeline event
    let attachmentsNote = '';
    if (extra?.attachments && extra.attachments.length > 0) {
      attachmentsNote = ` [${extra.attachments.length} attachment(s) included: ${extra.attachments.map((a) => a.title).join(', ')}]`;
    }
    addTimelineItem({
      leadId,
      type: 'handover_event',
      content: `Handover submitted to ${targetTo} (${targetUserName}) by ${currentUser.name}.${attachmentsNote} Reason: ${reason}. Summary: ${extra?.summary || 'N/A'}`,
      isInternalOnly: true,
      metadata: { handoverId: newHandover.id },
    });

    // Notify executive
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: targetUserId,
      title: `New Handover from ${currentUser.name}`,
      message: `${currentUser.name} handed over ${lead.businessName} to ${targetTo}. Reason: ${reason}.`,
      type: 'handover_requested',
      leadId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    logAudit(`Requested Handover to ${targetTo}`, leadId, lead.businessName, `Reason: ${reason}`);
    return newHandover;
  };

  const reviewHandoverRequest = (
    requestId: string,
    status: HandoverRequest['status'],
    notes?: string
  ) => {
    const handover = handoverRequests.find((h) => h.id === requestId);
    if (!handover) return;

    const nowIso = new Date().toISOString();
    setHandoverRequests((prev) =>
      prev.map((h) =>
        h.id === requestId
          ? {
              ...h,
              status,
              reviewedAt: nowIso,
              ceoReviewNotes: notes,
              returnReason: status === 'Returned' ? notes : h.returnReason,
            }
          : h
      )
    );

    if (status === 'Accepted') {
      const targetLead = leads.find((l) => l.id === handover.leadId);
      const originalInternId = targetLead?.originalInternId || handover.fromUserId;
      const originalInternName = targetLead?.originalInternName || handover.fromUserName;
      const supporting = Array.from(
        new Set([
          ...(targetLead?.supportingMemberIds || []),
          handover.fromUserId,
          originalInternId,
        ])
      );

      // Lead is handed over for Executive leadership closing,
      // but stays saved with ALL details and timeline to that intern's portfolio
      updateLead(handover.leadId, {
        status: 'Interested',
        isHandedOverToCeo: true,
        handedOverTo: handover.handoverTo,
        handoverStatus: 'Accepted',
        originalInternId,
        originalInternName,
        supportingMemberIds: supporting,
      });

      addTimelineItem({
        leadId: handover.leadId,
        type: 'handover_event',
        content: `Lead handover to ${handover.handoverTo || 'Executive'} accepted by ${currentUser.name}. Executive ownership active; lead preserved in ${originalInternName}'s workspace with full details.`,
        isInternalOnly: true,
      });
    } else if (status === 'Returned') {
      updateLead(handover.leadId, {
        isHandedOverToCeo: false,
        handoverStatus: 'Returned',
        status: 'Follow-Up',
      });

      addTimelineItem({
        leadId: handover.leadId,
        type: 'handover_event',
        content: `Handover returned to intern with notes: ${notes || 'Further qualification needed.'}`,
        isInternalOnly: true,
      });
    }

    // Notify intern
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: handover.fromUserId,
      title: `Handover ${status}: ${handover.businessName}`,
      message: `${currentUser.name} marked handover as ${status}. ${notes ? 'Notes: ' + notes : ''}`,
      type: status === 'Accepted' ? 'handover_accepted' : 'handover_requested',
      leadId: handover.leadId,
      isRead: false,
      createdAt: nowIso,
    };
    setNotifications((prev) => [notif, ...prev]);

    logAudit(`Handover ${status}`, handover.leadId, handover.businessName, `Reviewed by ${currentUser.name}`);
  };

  const completeFollowUp = (followUpId: string) => {
    setFollowUps((prev) =>
      prev.map((f) => (f.id === followUpId ? { ...f, status: 'completed', completedAt: new Date().toISOString() } : f))
    );

    const fup = followUps.find((f) => f.id === followUpId);
    if (fup) {
      logAudit('Completed Follow-Up', fup.leadId, fup.businessName, fup.actionNote);
    }
  };

  const rescheduleFollowUp = (followUpId: string, newDate: string, newTime: string, newNote?: string) => {
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === followUpId
          ? {
              ...f,
              dueDate: newDate,
              dueTime: newTime,
              actionNote: newNote || f.actionNote,
              status: 'rescheduled',
            }
          : f
      )
    );

    const fup = followUps.find((f) => f.id === followUpId);
    if (fup) {
      updateLead(fup.leadId, { nextFollowUpDate: newDate, nextFollowUpTime: newTime });
      logAudit('Rescheduled Follow-Up', fup.leadId, fup.businessName, `Moved to ${newDate} at ${newTime}`);
    }
  };

  const scheduleFollowUp = (
    leadIdOrObj:
      | string
      | {
          leadId: string;
          dueDate: string;
          dueTime?: string;
          actionNote: string;
          priority?: Priority;
        },
    dueDate?: string,
    dueTime: string = '10:00 AM',
    actionNote: string = 'Follow-up',
    priority: Priority = 'Medium'
  ) => {
    let leadId: string;
    let actualDueDate: string;
    let actualDueTime: string;
    let actualActionNote: string;
    let actualPriority: Priority;

    if (typeof leadIdOrObj === 'object') {
      leadId = leadIdOrObj.leadId;
      actualDueDate = leadIdOrObj.dueDate;
      actualDueTime = leadIdOrObj.dueTime || '10:00 AM';
      actualActionNote = leadIdOrObj.actionNote || 'Follow-up';
      actualPriority = leadIdOrObj.priority || 'Medium';
    } else {
      leadId = leadIdOrObj;
      actualDueDate = dueDate || new Date().toISOString().split('T')[0];
      actualDueTime = dueTime;
      actualActionNote = actionNote;
      actualPriority = priority;
    }

    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const newFup: FollowUpItem = {
      id: `fup-${Date.now()}`,
      leadId,
      businessName: lead.businessName,
      contactPerson: lead.contactPerson,
      phone: lead.phone,
      ownerId: lead.assignedInternId,
      ownerName: currentUser.name,
      dueDate: actualDueDate,
      dueTime: actualDueTime,
      actionNote: actualActionNote,
      status: 'pending',
      priority: actualPriority,
    };

    setFollowUps((prev) => [newFup, ...prev]);
    updateLead(leadId, { nextFollowUpDate: actualDueDate, nextFollowUpTime: actualDueTime, nextAction: actualActionNote });
    logAudit('Scheduled Follow-Up', leadId, lead.businessName, `Due ${actualDueDate} ${actualDueTime}: ${actualActionNote}`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const addMessageTemplate = (tpl: Omit<MessageTemplate, 'id'>) => {
    const newTpl: MessageTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
    };
    setMessageTemplates((prev) => [...prev, newTpl]);
  };

  const callAiAssistant = async (payload: {
    action: string;
    leadContext?: any;
    userPrompt?: string;
    draftText?: string;
    technicalQuery?: string;
  }) => {
    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('AI Assistant API call fallback:', err);
      return {
        text: 'This question requires confirmation from our technical team. Please click "Ask CTO" below to escalate to CTO Nawaz Sharif.',
        fallback: true,
      };
    }
  };

  const clearAllData = () => {
    // Reset all CRM operational data to clean state
    setLeads([]);
    setTimeline([]);
    setTechRequests([]);
    setHandoverRequests([]);
    setFollowUps([]);
    setNotifications([]);
    setAuditLogs([
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'Database Cleared',
        details: 'All leads, follow-ups, timeline logs, tech requests, and handover queues were cleared to start from scratch.',
      },
    ]);
    setSelectedLeadId(null);

    // Reset user statistics to 0 for a truly fresh start
    const resetUsers = users.map((u) => ({
      ...u,
      stats: {
        leadsCollected: 0,
        leadsContacted: 0,
        messagesSent: 0,
        responsesReceived: 0,
        followUpsCompleted: 0,
        overdueFollowUps: 0,
        qualifiedLeads: 0,
        wonDeals: 0,
      },
    }));
    setUsers(resetUsers);

    // Clear and write fresh state to localStorage
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}leads`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}timeline`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}tech_requests`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}handover_requests`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}follow_ups`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}notifications`, JSON.stringify([]));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}users`, JSON.stringify(resetUsers));
    localStorage.setItem(
      `${LOCAL_STORAGE_PREFIX}audit_logs`,
      JSON.stringify([
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'Database Cleared',
          details: 'All leads, follow-ups, timeline logs, tech requests, and handover queues were cleared to start from scratch.',
        },
      ])
    );
  };

  const resetToDemoData = () => {
    setUsers(DEMO_USERS);
    setLeads(DEMO_LEADS);
    setTimeline(DEMO_TIMELINE);
    setTechRequests(DEMO_TECHNICAL_REQUESTS);
    setHandoverRequests(DEMO_HANDOVER_REQUESTS);
    setFollowUps(DEMO_FOLLOW_UPS);
    setNotifications(DEMO_NOTIFICATIONS);
    setAuditLogs(DEMO_AUDIT_LOGS);
    setMessageTemplates(INITIAL_MESSAGE_TEMPLATES);
    setSelectedLeadId(null);

    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}users`, JSON.stringify(DEMO_USERS));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}leads`, JSON.stringify(DEMO_LEADS));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}timeline`, JSON.stringify(DEMO_TIMELINE));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}tech_requests`, JSON.stringify(DEMO_TECHNICAL_REQUESTS));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}handover_requests`, JSON.stringify(DEMO_HANDOVER_REQUESTS));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}follow_ups`, JSON.stringify(DEMO_FOLLOW_UPS));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}notifications`, JSON.stringify(DEMO_NOTIFICATIONS));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}audit_logs`, JSON.stringify(DEMO_AUDIT_LOGS));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}templates`, JSON.stringify(INITIAL_MESSAGE_TEMPLATES));
  };

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        users,
        switchUser,
        createUser,
        updateUser,
        deleteUser,
        isCreateInternModalOpen,
        setIsCreateInternModalOpen,
        leads,
        addLead,
        updateLead,
        reassignLead,
        deleteLead,
        checkDuplicate,
        timeline,
        addTimelineItem,
        addTimelineEvent,
        techRequests,
        createTechRequest,
        answerTechRequest,
        handoverRequests,
        createHandoverRequest,
        reviewHandoverRequest,
        followUps,
        completeFollowUp,
        rescheduleFollowUp,
        scheduleFollowUp,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        auditLogs,
        messageTemplates,
        templates: messageTemplates,
        addMessageTemplate,
        knowledgeBase,
        callAiAssistant,
        clearAllData,
        resetToDemoData,
        searchQuery,
        setSearchQuery,
        isCheckLeadModalOpen,
        setIsCheckLeadModalOpen,
        isNewLeadModalOpen,
        setIsNewLeadModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        selectedLeadId,
        setSelectedLeadId,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
