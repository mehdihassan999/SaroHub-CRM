import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Code2,
  ShieldCheck,
  Server,
  Smartphone,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const KnowledgeBaseView: React.FC = () => {
  const { knowledgeBase } = useCRM();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Tech Stack', 'Integrations', 'Pricing & Process', 'Services', 'Architecture'];

  const filtered = knowledgeBase.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            SaroHub Engineering Knowledge Base & Sales Guide
          </h2>
          <p className="text-xs text-slate-500">
            Authoritative technical capabilities, approved architectures, and client FAQ verified by CTO Nawaz.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search specs, tech, databases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs focus:border-indigo-600 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700">
                  {item.category}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">CTO Verified</span>
              </div>

              <h3 className="mt-2 text-sm font-bold text-slate-900">{item.title}</h3>

              <div className="mt-2 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {item.content}
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium pt-2 border-t border-slate-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved answer for client outreach discussions
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
