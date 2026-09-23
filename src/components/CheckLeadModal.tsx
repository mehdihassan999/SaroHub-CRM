import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  X,
  User,
  Calendar,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  Clock,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { normalizePhoneNumber } from '../utils/phoneNormalizer';

interface CheckLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateWithNumber?: (phone: string) => void;
}

export const CheckLeadModal: React.FC<CheckLeadModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateWithNumber,
}) => {
  const { checkDuplicate, users, setSelectedLeadId, timeline, currentUser, createHandoverRequest } = useCRM();

  const [inputVal, setInputVal] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof checkDuplicate> | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;

    // Check across phone, whatsapp, email, and business name
    const checkRes = checkDuplicate({
      phone: query,
      whatsapp: query,
      email: query.includes('@') ? query : undefined,
      businessName: query.length > 2 && !query.match(/^[+\d\s()-]+$/) ? query : undefined,
    });

    setResult(checkRes);
    setHasSearched(true);
  };

  const matched = result?.matchedLead;
  const ownerUser = matched ? users.find((u) => u.id === matched.assignedInternId) : null;
  const lastTimelineMsg = matched
    ? timeline
        .filter((t) => t.leadId === matched.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Check Lead Before Contact
              </h3>
              <p className="text-xs text-slate-500">
                Strict Duplicate Prevention Protocol — Check phone, email, or business name before outreach.
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

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Phone Number, WhatsApp, or Business Name
            </label>
            <div className="relative mt-1.5 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. +971 50 123 4567, 03001234567, or ABC Clinic"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    setHasSearched(false);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <Search className="h-4 w-4" />
                Check CRM
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Tip: Supports international formats (+971, +92, local 0300..., or 050...).
            </p>
          </div>
        </form>

        {/* Results Box */}
        {hasSearched && result && (
          <div className="mt-5 animate-in fade-in duration-200">
            {result.hasDuplicate && matched ? (
              <div className="rounded-xl border-2 border-rose-200 bg-rose-50/40 p-4">
                {/* Warning Header */}
                <div className="flex items-center gap-2 text-rose-700">
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    LEAD ALREADY EXISTS IN SAROHUB CRM
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-900 font-medium">
                  {result.message}
                </p>

                {/* Lead Summary Card */}
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {matched.businessName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {matched.contactPerson} • {matched.city}, {matched.country}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {matched.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-400 block text-[10px] uppercase">
                        Current Owner
                      </span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {ownerUser?.name || 'Unassigned'} ({ownerUser?.role || 'intern'})
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 block text-[10px] uppercase">
                        Temperature
                      </span>
                      <span className={`font-bold ${
                        matched.temperature === 'Hot' ? 'text-rose-600' : matched.temperature === 'Warm' ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {matched.temperature} — {matched.temperatureReason}
                      </span>
                    </div>
                  </div>

                  {/* Last Contact & Message */}
                  <div className="rounded-md bg-slate-50 p-2.5 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Contact: {matched.lastContactDate ? new Date(matched.lastContactDate).toLocaleDateString() : 'None'}
                      </span>
                      <span>Next Action: {matched.nextFollowUpDate || 'None scheduled'}</span>
                    </div>
                    <p className="text-slate-700 text-xs italic">
                      "{lastTimelineMsg ? lastTimelineMsg.content : matched.notes || 'No notes logged yet.'}"
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedLeadId(matched.id);
                      onClose();
                    }}
                    className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Existing Lead
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenCreateWithNumber) {
                        onOpenCreateWithNumber(inputVal);
                      }
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                  >
                    Add as New Lead Anyway
                  </button>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span>
                    Note: A record already exists with this contact information.
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h4 className="mt-2 text-sm font-bold text-emerald-900">
                  NO DUPLICATE FOUND
                </h4>
                <p className="mt-1 text-xs text-emerald-700">
                  "{inputVal}" is clean in our CRM database. It has NOT been contacted by any other intern.
                </p>

                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenCreateWithNumber) {
                        onOpenCreateWithNumber(inputVal);
                      }
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Create New Lead With This Number
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
