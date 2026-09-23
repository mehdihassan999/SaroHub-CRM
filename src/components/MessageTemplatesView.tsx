import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  FileText,
  Copy,
  Check,
  Send,
  Sparkles,
  MessageCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { MessageTemplate } from '../types/crm';

export const MessageTemplatesView: React.FC = () => {
  const { templates, currentUser, leads } = useCRM();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  const categories = ['ALL', 'WhatsApp Initial', 'Follow-Up', 'Technical Hook', 'Closing'];

  const filteredTemplates = templates.filter((t) => {
    return activeCategory === 'ALL' || t.category === activeCategory;
  });

  const fillTemplate = (text: string) => {
    if (!selectedLead) return text;
    return text
      .replace(/{{businessName}}/g, selectedLead.businessName)
      .replace(/{{contactPerson}}/g, selectedLead.contactPerson)
      .replace(/{{service}}/g, selectedLead.interestedService)
      .replace(/{{city}}/g, selectedLead.city)
      .replace(/{{internName}}/g, currentUser.name.split(' ')[0]);
  };

  const handleCopy = (t: MessageTemplate) => {
    const filled = fillTemplate(t.body);
    navigator.clipboard.writeText(filled);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            SaroHub High-Converting Outreach Templates
          </h2>
          <p className="text-xs text-slate-500">
            Standardized company message scripts with dynamic personalization for WhatsApp and email outreach.
          </p>
        </div>

        {/* Lead Context Selector */}
        {leads.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Preview with lead:</span>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-bold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.businessName} ({l.contactPerson})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((t: MessageTemplate) => {
          const filled = fillTemplate(t.body);

          return (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{t.title}</h3>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {t.category}
                    </span>
                  </div>

                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    SaroHub Script
                  </span>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {filled}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">
                  Ready to send to {selectedLead?.contactPerson || 'prospect'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(t)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    {copiedId === t.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Personalized
                      </>
                    )}
                  </button>

                  {selectedLead && (
                    <a
                      href={`https://wa.me/${selectedLead.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                        filled
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 flex items-center gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Send on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
