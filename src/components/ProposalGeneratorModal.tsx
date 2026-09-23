import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  FileText,
  X,
  Sparkles,
  Download,
  Send,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Lead } from '../types/crm';

interface ProposalGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

export const ProposalGeneratorModal: React.FC<ProposalGeneratorModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const { updateLead, addTimelineEvent, createHandoverRequest, currentUser } = useCRM();

  const [proposalTitle, setProposalTitle] = useState(
    `Digital Modernization & Custom Web App Proposal for ${lead.businessName}`
  );
  const [estimatedInvestment, setEstimatedInvestment] = useState(
    lead.estimatedBudget || '$4,500 USD'
  );
  const [timelineWeeks, setTimelineWeeks] = useState(
    lead.expectedTimeline || '4 to 6 weeks'
  );

  const initialDraft = `# PROPOSAL: ${proposalTitle}
Prepared by: SaroHub Technologies (Pvt) Ltd.
Client: ${lead.businessName} (Attn: ${lead.contactPerson})
Date: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}

---

## 1. Executive Summary
${lead.businessName} is modernizing their digital operations to automate online bookings, deliver an upscale patient/client experience, and eliminate lost revenue from manual messaging delays. SaroHub Technologies proposes a custom-engineered web platform tailored directly to your workflow.

## 2. Problem Statement
- High reception friction and lost appointments during peak hours.
- Outdated or lack of automated confirmation and calendar syncing.
- Fragmented records across local spreadsheets without mobile management.

## 3. SaroHub Proposed Solution
- **Custom Patient/Client Web Portal**: Fast, mobile-responsive booking flow with zero login friction.
- **Admin & Staff Operating Dashboard**: Real-time calendar schedule, staff duty allocation, and client records.
- **Automated Messaging Bridge**: Instant WhatsApp and SMS appointment confirmation and 24h reminders.
- **Secure Payment Processing**: Integrated deposit processing via Stripe / local merchant gateway.

## 4. Engineering Tech Stack
- Frontend: Next.js / React 18 with Tailwind CSS (sub-second loading speeds).
- Backend & Database: Cloud Run / Node.js with PostgreSQL & Redis cache.
- Security: End-to-end SSL encryption, role-based access control, automated backups.

## 5. Timeline & Milestones
- Phase 1 (Week 1–2): UI/UX Architecture, Wireframes & Interactive Prototype
- Phase 2 (Week 3–4): Core System Development & Database Architecture
- Phase 3 (Week 5): WhatsApp & Payment Gateway Integration + Staff Training
- Phase 4 (Week 6): Production Deployment, Quality Assurance & Go-Live

## 6. Commercial Investment & Payment Terms
- **Total Project Fee**: ${estimatedInvestment}
- **Milestone Structure**:
  - 40% Advance on project kickoff
  - 40% On completion of core demo & staging deployment
  - 20% Upon final production launch & domain handover
- **Warranty**: Includes 60 days of post-launch engineering support and bug warranty.

---
*Notice: This proposal is prepared by SaroHub Technologies and requires managerial executive authorization before signing.*`;

  const [proposalContent, setProposalContent] = useState(initialDraft);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(proposalContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([proposalContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `SaroHub_Proposal_${lead.businessName.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveAndSubmitToCeo = () => {
    updateLead(lead.id, {
      status: 'Proposal Required',
      estimatedBudget: estimatedInvestment,
      expectedTimeline: timelineWeeks,
    });

    addTimelineEvent({
      leadId: lead.id,
      userId: currentUser.id,
      type: 'Proposal Sent',
      content: `Drafted official commercial proposal for ${estimatedInvestment} (${timelineWeeks}). Submitted to CEO for executive approval.`,
      isInternal: true,
    });

    createHandoverRequest(
      lead.id,
      `Proposal draft prepared for ${lead.businessName}. Total commercial value: ${estimatedInvestment}. Ready for CEO closing call.`
    );

    alert('Proposal saved! Handover request submitted to CEO Handover Desk.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-6 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                SaroHub Commercial Proposal Drafter
              </h3>
              <p className="text-xs text-slate-500">
                Standardized client quotation adhering to SaroHub engineering delivery standards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Guardrail Disclaimer */}
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Executive Approval Required:</strong> All generated commercial proposals must be approved by CEO or CTO before sending directly to client.
            </span>
          </div>
          <span className="rounded bg-amber-200/60 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 shrink-0">
            Policy #27
          </span>
        </div>

        {/* Quick parameters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proposal Title
            </label>
            <input
              type="text"
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Investment Quotation
            </label>
            <input
              type="text"
              value={estimatedInvestment}
              onChange={(e) => setEstimatedInvestment(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery Timeline
            </label>
            <input
              type="text"
              value={timelineWeeks}
              onChange={(e) => setTimelineWeeks(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-amber-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Proposal Markdown Preview / Editor */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Proposal Content Draft
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"
              >
                {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Download .MD
              </button>
            </div>
          </div>

          <textarea
            rows={14}
            value={proposalContent}
            onChange={(e) => setProposalContent(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-4 font-mono text-xs text-slate-800 focus:border-amber-600 focus:bg-white focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAndSubmitToCeo}
            className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" />
            Save Proposal & Send to CEO For Closing
          </button>
        </div>
      </div>
    </div>
  );
};
