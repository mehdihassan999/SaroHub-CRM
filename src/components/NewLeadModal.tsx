import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  X,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  User,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  FileText,
  Globe,
} from 'lucide-react';
import { LeadSource } from '../types/crm';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillPhone?: string;
  onOpenHandover?: (leadId: string) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  prefillPhone = '',
  onOpenHandover,
}) => {
  const { addLead, checkDuplicate, users, currentUser, setSelectedLeadId } = useCRM();

  // Required Fields per spec
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState(prefillPhone);
  const [contactPerson, setContactPerson] = useState('');
  const [industry, setIndustry] = useState('Healthcare & Clinics');
  const [website, setWebsite] = useState('');
  const [interestedService, setInterestedService] = useState('Custom Web App + Booking System');
  const [notes, setNotes] = useState('');

  // Optional Fields
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [source, setSource] = useState<LeadSource>('Google Maps');

  // Duplicate Check Result
  const [dupResult, setDupResult] = useState<ReturnType<typeof checkDuplicate> | null>(null);

  useEffect(() => {
    if (prefillPhone) {
      setPhone(prefillPhone);
    }
  }, [prefillPhone]);

  // Instant automatic duplicate check when phone or whatsapp changes
  useEffect(() => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 5) {
      setDupResult(null);
      return;
    }

    const res = checkDuplicate({
      phone: cleanPhone,
      whatsapp: cleanPhone,
    });

    setDupResult(res.hasDuplicate ? res : null);
  }, [phone, checkDuplicate]);

  if (!isOpen) return null;

  const matchedLead = dupResult?.matchedLead;
  const matchedOwner = matchedLead ? users.find((u) => u.id === matchedLead.assignedInternId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim() || !phone.trim()) {
      alert('Please provide at least the Business Name and Phone / WhatsApp Number.');
      return;
    }

    // Strict duplicate blocking: if exact duplicate exists, prevent duplicate entry
    if (dupResult && dupResult.hasDuplicate && dupResult.matchedLead) {
      alert('This lead already exists in SaroHub CRM. Duplicate outreach is prevented.');
      return;
    }

    const { success, lead } = addLead(
      {
        businessName: businessName.trim(),
        contactPerson: contactPerson.trim() || 'Contact Person',
        phone: phone.trim(),
        whatsapp: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        country: 'United Arab Emirates',
        city: city.trim() || 'Dubai',
        industry: industry || 'Services & Commerce',
        businessType: 'SMB',
        socialMedia: socialMedia.trim(),
        source,
        notes: notes.trim(),
        interestedService: interestedService || 'Custom Web App',
        status: 'New',
        assignedInternId: currentUser.id,
      },
      false // do not allow duplicate
    );

    if (success && lead) {
      setSelectedLeadId(lead.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="my-6 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add New Lead</h2>
              <p className="text-xs text-slate-500">Fast entry with automatic duplicate prevention.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MOST IMPORTANT: DUPLICATE CHECK WARNING PER SECTION 5 */}
        {matchedLead && (
          <div className="mt-4 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-xs shadow-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>This lead already exists in SaroHub CRM.</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 bg-white/80 rounded-lg p-2.5 border border-rose-200 text-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Business:</span>
                <span className="font-bold text-slate-900 text-xs">{matchedLead.businessName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned to:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {matchedOwner?.name || 'Assigned Intern'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status:</span>
                <span className="font-semibold text-rose-700 text-xs">{matchedLead.status}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Contact:</span>
                <span className="font-semibold text-slate-700 text-xs">
                  {matchedLead.lastContactDate
                    ? new Date(matchedLead.lastContactDate).toLocaleDateString()
                    : 'Not contacted yet'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-rose-200">
              <span className="text-[11px] text-rose-800 font-medium">
                Do not contact: another intern is already working with this client.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLeadId(matchedLead.id);
                    onClose();
                  }}
                  className="rounded-lg bg-white border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 flex items-center gap-1 transition"
                >
                  <ExternalLink className="h-3 w-3" /> View Lead
                </button>
                {onOpenHandover && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenHandover(matchedLead.id);
                    }}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 flex items-center gap-1 transition shadow-2xs"
                  >
                    <ArrowRightLeft className="h-3 w-3" /> Request Handover
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clean Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Business Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Business / Person Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ABC Clinic"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Phone / WhatsApp & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Phone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                {phone.length >= 6 && !matchedLead && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="h-3 w-3" /> No duplicate
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. +971 50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden ${
                  matchedLead
                    ? 'border-rose-400 bg-rose-50/50 focus:border-rose-600'
                    : 'border-slate-300 bg-white focus:border-emerald-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Ahmed Khan"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Business / Industry & Service Interested In */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business / Industry <span className="text-rose-500">*</span>
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="Healthcare & Clinics">Healthcare & Clinics</option>
                <option value="Dental & Medical">Dental & Medical</option>
                <option value="Real Estate & Property">Real Estate & Property</option>
                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                <option value="Restaurants & Cafes">Restaurants & Cafes</option>
                <option value="Legal & Financial">Legal & Financial</option>
                <option value="Automotive & Services">Automotive & Services</option>
                <option value="Education & Academies">Education & Academies</option>
                <option value="Travel & Tourism">Travel & Tourism</option>
                <option value="Other Industry">Other Industry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Interested In <span className="text-rose-500">*</span>
              </label>
              <select
                value={interestedService}
                onChange={(e) => setInterestedService(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="Custom Web App + Booking System">Custom Web App + Booking System</option>
                <option value="Corporate Website Redesign">Corporate Website Redesign</option>
                <option value="E-Commerce Store & Payment Gateway">E-Commerce Store & Payment Gateway</option>
                <option value="WhatsApp Automation & CRM">WhatsApp Automation & CRM</option>
                <option value="Mobile App (iOS & Android)">Mobile App (iOS & Android)</option>
                <option value="POS / Inventory Integration">POS / Inventory Integration</option>
                <option value="Custom Software Solution">Custom Software Solution</option>
              </select>
            </div>
          </div>

          {/* Website (optional per spec) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Website <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. www.abcclinic.com or none"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Notes (Required per spec) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Client needs online booking for 4 doctors and WhatsApp reminders..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Optional Details Collapsible Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {showOptionalFields ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{showOptionalFields ? 'Hide optional fields' : '+ Add optional info (Email, Location, Social, Source)'}</span>
            </button>

            {showOptionalFields && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="info@abcclinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Location / City</label>
                  <input
                    type="text"
                    placeholder="Dubai, UAE"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Social Media</label>
                  <input
                    type="text"
                    placeholder="Instagram / LinkedIn / Facebook link"
                    value={socialMedia}
                    onChange={(e) => setSocialMedia(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                  >
                    <option value="Google Maps">Google Maps</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Referral">Referral</option>
                    <option value="Website">Website</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(matchedLead)}
              className={`rounded-xl px-5 py-2 text-xs font-bold shadow-sm transition ${
                matchedLead
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {matchedLead ? 'Duplicate Blocked' : 'Save Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
