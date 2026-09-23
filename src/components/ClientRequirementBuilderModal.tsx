import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  FileText,
  X,
  CheckCircle2,
  Sparkles,
  Layers,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Lead, ClientRequirements } from '../types/crm';

interface ClientRequirementBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

export const ClientRequirementBuilderModal: React.FC<ClientRequirementBuilderModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const { updateLead, addTimelineEvent, createTechRequest, currentUser } = useCRM();

  const existing = lead.clientRequirements || {};

  const [businessGoals, setBusinessGoals] = useState(
    existing.businessGoals || 'Modernize customer experience, automate online booking, and eliminate manual phone confirmations.'
  );
  const [targetAudience, setTargetAudience] = useState(
    existing.targetAudience || 'Clinic patients, working professionals in Dubai, clinic reception desk.'
  );
  const [featureRequirements, setFeatureRequirements] = useState(
    existing.featureRequirements?.join(', ') ||
      'Online appointment calendar, automated WhatsApp SMS notifications, doctor schedule management, Stripe payment deposit'
  );
  const [platform, setPlatform] = useState(
    existing.platform?.join(', ') || 'Responsive Web Application + Mobile-optimized portal'
  );
  const [designPreferences, setDesignPreferences] = useState(
    existing.designPreferences || 'Clean medical luxury, white & teal aesthetic, mobile-first booking speed.'
  );
  const [existingSystems, setExistingSystems] = useState(
    existing.existingSystems || 'Currently using pen & paper ledger and local Excel sheets.'
  );
  const [integrations, setIntegrations] = useState(
    existing.integrations?.join(', ') || 'WhatsApp Cloud API, Stripe / Network International payment gateway, Google Maps'
  );
  const [budgetExpectation, setBudgetExpectation] = useState(
    existing.budgetExpectation || lead.estimatedBudget || '$3,500 - $5,000 USD'
  );
  const [targetDeadline, setTargetDeadline] = useState(
    existing.targetDeadline || lead.expectedTimeline || '4 to 6 weeks'
  );
  const [decisionMaker, setDecisionMaker] = useState(
    existing.decisionMaker || `${lead.contactPerson} (Managing Partner / Medical Director)`
  );

  if (!isOpen) return null;

  const handleSave = (alsoEscalateToCto = false) => {
    const formattedReqs: ClientRequirements = {
      businessGoals,
      targetAudience,
      featureRequirements: featureRequirements.split(',').map((s: string) => s.trim()).filter(Boolean),
      platform: platform.split(',').map((s: string) => s.trim()).filter(Boolean),
      designPreferences,
      existingSystems,
      integrations: integrations.split(',').map((s: string) => s.trim()).filter(Boolean),
      budgetExpectation,
      targetDeadline,
      decisionMaker,
      collectedAt: new Date().toISOString(),
    };

    updateLead(lead.id, {
      clientRequirements: formattedReqs,
      status: 'Requirements Collected',
      estimatedBudget: budgetExpectation,
      expectedTimeline: targetDeadline,
    });

    addTimelineEvent({
      leadId: lead.id,
      userId: currentUser.id,
      type: 'Requirement Collected',
      content: `Completed 10-point structured client requirements form. Target budget: ${budgetExpectation}, timeline: ${targetDeadline}.`,
      isInternal: true,
    });

    if (alsoEscalateToCto) {
      createTechRequest({
        leadId: lead.id,
        question: `Please review architecture and feasibility for ${lead.businessName}. Systems required: ${integrations}, platforms: ${platform}.`,
        context: businessGoals,
        clientRequirement: featureRequirements,
        urgency: 'High',
      });
      alert('Requirements saved and sent to CTO Technical Queue for architecture sign-off!');
    } else {
      alert('Client requirements saved to lead record.');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-6 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                10-Point Client Requirements Questionnaire
              </h3>
              <p className="text-xs text-slate-500">
                SaroHub Engineering Standard • Collect these details before requesting CTO architecture or drafting a formal proposal.
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

        {/* Lead Banner */}
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 text-xs flex items-center justify-between">
          <span className="font-bold text-slate-800">
            Prospect: {lead.businessName} ({lead.contactPerson})
          </span>
          <span className="text-slate-500 font-medium">Industry: {lead.industry}</span>
        </div>

        {/* Form Fields */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. Business Goals & Core Problem
            </label>
            <textarea
              rows={2}
              value={businessGoals}
              onChange={(e) => setBusinessGoals(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. Target Audience & Users
            </label>
            <textarea
              rows={2}
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              3. Feature Requirements (Comma-separated)
            </label>
            <textarea
              rows={2}
              value={featureRequirements}
              onChange={(e) => setFeatureRequirements(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              4. Target Platform(s)
            </label>
            <input
              type="text"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              5. Design Style & Visual References
            </label>
            <input
              type="text"
              value={designPreferences}
              onChange={(e) => setDesignPreferences(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              6. Existing Systems / Data Migration
            </label>
            <input
              type="text"
              value={existingSystems}
              onChange={(e) => setExistingSystems(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              7. Third-Party Integrations Needed
            </label>
            <input
              type="text"
              value={integrations}
              onChange={(e) => setIntegrations(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              8. Budget Expectation
            </label>
            <input
              type="text"
              value={budgetExpectation}
              onChange={(e) => setBudgetExpectation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              9. Target Delivery Deadline
            </label>
            <input
              type="text"
              value={targetDeadline}
              onChange={(e) => setTargetDeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              10. Decision Maker Contact & Role
            </label>
            <input
              type="text"
              value={decisionMaker}
              onChange={(e) => setDecisionMaker(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Save Requirements
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Layers className="h-4 w-4" />
              Save & Send to CTO Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
