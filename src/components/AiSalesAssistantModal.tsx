import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Send,
  HelpCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { Lead } from '../types/crm';

interface AiSalesAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onApplyMessage?: (text: string) => void;
  onOpenTechEscalation?: () => void;
}

export const AiSalesAssistantModal: React.FC<AiSalesAssistantModalProps> = ({
  isOpen,
  onClose,
  lead,
  onApplyMessage,
  onOpenTechEscalation,
}) => {
  const { callAiAssistant } = useCRM();

  const [activeMode, setActiveMode] = useState<
    'generate_message' | 'reply_assistant' | 'tech_explanation' | 'simplify_tech' | 'improve_message' | 'follow_up'
  >('generate_message');

  const [userPrompt, setUserPrompt] = useState('');
  const [draftText, setDraftText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setResultText('');
    setCopied(false);

    const leadContext = lead
      ? {
          businessName: lead.businessName,
          contactPerson: lead.contactPerson,
          industry: lead.industry,
          serviceInterest: lead.interestedService,
          currentStatus: lead.status,
          city: lead.city,
          country: lead.country,
          notes: lead.notes,
          budget: lead.estimatedBudget,
          clientRequirements: lead.clientRequirements,
        }
      : null;

    const res = await callAiAssistant({
      action: activeMode,
      leadContext,
      userPrompt,
      draftText,
      technicalQuery: activeMode === 'tech_explanation' ? userPrompt : undefined,
    });

    setResultText(res.text);
    setIsFallback(res.fallback || false);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyMessage && resultText) {
      onApplyMessage(resultText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-6 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AI Sales & Technical Assistant
              </h3>
              <p className="text-xs text-slate-500">
                Powered by SaroHub Knowledge Base with strict guardrails against fabricated prices or promises.
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

        {/* Lead Context Bar */}
        {lead && (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 border border-slate-200/70 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase text-[10px]">Lead Context: </span>
              <strong className="text-slate-900">{lead.businessName}</strong> ({lead.industry}) •{' '}
              <span className="text-emerald-700 font-semibold">{lead.interestedService}</span>
            </div>
            <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
              {lead.status}
            </span>
          </div>
        )}

        {/* Action Mode Pills */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
          {[
            { id: 'generate_message', label: '1. Generate Message' },
            { id: 'reply_assistant', label: '2. Reply Assistant (3 Options)' },
            { id: 'tech_explanation', label: '3. Technical Explanation' },
            { id: 'simplify_tech', label: '4. Simplify Specs' },
            { id: 'improve_message', label: '5. Polish Intern Draft' },
            { id: 'follow_up', label: '6. Follow-Up Generator' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setActiveMode(mode.id as any);
                setResultText('');
              }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                activeMode === mode.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Input Prompts based on mode */}
        <div className="mt-4 space-y-3">
          {activeMode === 'generate_message' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Instruction or Tone (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Focus on automating patient appointments and reducing WhatsApp receptionist delays"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}

          {activeMode === 'reply_assistant' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paste What the Prospect Asked:
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 'How much does it cost to build this?' or 'Can you deliver this in 2 weeks?'"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}

          {activeMode === 'tech_explanation' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Technical Question from Client:
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 'Can you integrate our existing Dentrix database or Stripe payment gateway?'"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}

          {activeMode === 'simplify_tech' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paste Complex Technical Notes / Specs:
              </label>
              <textarea
                rows={3}
                placeholder="Paste CTO response or technical details to convert into simple client language..."
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}

          {activeMode === 'improve_message' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Rough Draft Message:
              </label>
              <textarea
                rows={3}
                placeholder="Paste your rough message here for AI grammar, tone, and persuasiveness polish..."
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}

          {activeMode === 'follow_up' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Follow-up Context / Goal:
              </label>
              <input
                type="text"
                placeholder="e.g. Prospect went silent after asking for pricing 3 days ago"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Response
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Output Result Box */}
        {resultText && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                AI Generated Output:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </button>
                {onApplyMessage && (
                  <button
                    onClick={handleApply}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" /> Insert in Composer
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-3.5 border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
              {resultText}
            </div>

            {/* Guardrail Escalation Fallback */}
            <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">SaroHub AI Guardrail:</span> Never guarantee fixed prices or unconfirmed custom features.
                  If the client asks for specific architecture confirmation, escalate to CTO Nawaz.
                </div>
              </div>

              {onOpenTechEscalation && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTechEscalation();
                  }}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shrink-0 flex items-center gap-1"
                >
                  <Layers className="h-3 w-3" />
                  Ask CTO
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
