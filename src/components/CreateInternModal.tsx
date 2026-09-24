import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  UserPlus,
  X,
  Shield,
  CheckCircle2,
  Mail,
  Phone,
  User,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Role } from '../types/crm';

const AVATAR_PRESETS = [
  {
    label: 'Professional 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
  },
  {
    label: 'Professional 2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
  },
  {
    label: 'Professional 3',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&h=120&q=80',
  },
  {
    label: 'Professional 4',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
  },
  {
    label: 'Professional 5',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80',
  },
  {
    label: 'Professional 6',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&h=120&q=80',
  },
];

export const CreateInternModal: React.FC = () => {
  const {
    isCreateInternModalOpen,
    setIsCreateInternModalOpen,
    createUser,
    switchUser,
    currentUser,
  } = useCRM();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('intern');
  const [title, setTitle] = useState('Sales & Lead Generation Intern');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0].url);
  const [autoSwitch, setAutoSwitch] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isCreateInternModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      const newUser = createUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+92 300 0000000',
        role,
        title: title.trim(),
        avatar,
      });

      setSuccessMsg(`✓ Account created for ${newUser.name}!`);

      if (autoSwitch) {
        switchUser(newUser.id);
      }

      setTimeout(() => {
        setSuccessMsg(null);
        setIsCreateInternModalOpen(false);
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setTitle('Sales & Lead Generation Intern');
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to create user account');
    }
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === 'intern') {
      setTitle('Sales & Lead Generation Intern');
    } else if (newRole === 'cto') {
      setTitle('Technical Lead / Solutions Architect');
    } else if (newRole === 'ceo') {
      setTitle('Executive Leadership');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create New Intern Account
              </h2>
              <p className="text-xs text-slate-500">
                Authorized by {currentUser.name} ({currentUser.role.toUpperCase()})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateInternModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Permissions & Roles Notice */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Role Permissions & Ownership Architecture:</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            • <strong>Individual Intern Accounts</strong> have their own dedicated workspace. All leads collected and handed over stay <em>permanently saved with all details to that intern</em>.
          </p>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            • <strong>CEO and CTO</strong> have complete permissions to view all intern leads, manage pipeline, review handovers, and reassign deals.
          </p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500 p-2.5 text-xs font-bold text-white shadow-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Bilal Siddiqui"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. bilal.s@sarohub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Phone & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Phone / WhatsApp Number
              </label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Job Title / Specialty
              </label>
              <div className="relative">
                <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lead Generation Intern"
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Account Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange('intern')}
                className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                  role === 'intern'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Intern</span>
                  {role === 'intern' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  Individual workspace
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('cto')}
                className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                  role === 'cto'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>CTO</span>
                  {role === 'cto' && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  Full permissions
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('ceo')}
                className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                  role === 'ceo'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>CEO</span>
                  {role === 'ceo' && <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  Super Admin
                </p>
              </button>
            </div>
          </div>

          {/* Avatar Presets */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Select Profile Avatar:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {AVATAR_PRESETS.map((preset, index) => {
                const isSelected = avatar === preset.url;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAvatar(preset.url)}
                    className={`relative rounded-full transition p-0.5 cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-emerald-600 ring-offset-2'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    {isSelected && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-600 ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto switch toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoSwitch"
              checked={autoSwitch}
              onChange={(e) => setAutoSwitch(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="autoSwitch" className="text-slate-700 font-medium cursor-pointer">
              Switch to this new intern account immediately after creation
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateInternModalOpen(false)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition"
            >
              <UserPlus className="h-4 w-4" />
              Create Intern Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
