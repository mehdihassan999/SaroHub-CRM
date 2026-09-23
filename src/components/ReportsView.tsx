import React from 'react';
import { useCRM } from '../context/CRMContext';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  PieChart,
  Download,
  Target,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { leads, users, followUps } = useCRM();

  const totalLeads = leads.length;
  const wonCount = leads.filter((l) => l.status === 'Won').length;
  const contactedCount = leads.filter((l) => !['New', 'Researching'].includes(l.status)).length;
  const qualifiedCount = leads.filter((l) =>
    ['Qualified', 'Requirements Collected', 'Technical Review', 'Proposal Required', 'Proposal Sent', 'Negotiation', 'Won'].includes(l.status)
  ).length;

  // Stages count
  const stageStats: Record<string, number> = {};
  leads.forEach((l) => {
    stageStats[l.status] = (stageStats[l.status] || 0) + 1;
  });

  // Industry count
  const industryStats: Record<string, number> = {};
  leads.forEach((l) => {
    industryStats[l.industry] = (industryStats[l.industry] || 0) + 1;
  });

  // Country count
  const countryStats: Record<string, number> = {};
  leads.forEach((l) => {
    countryStats[l.country] = (countryStats[l.country] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            SaroHub Analytics & Outreach Reports
          </h2>
          <p className="text-xs text-slate-500">
            Conversion funnel analysis, industry distribution, and outbound efficiency metrics.
          </p>
        </div>
      </div>

      {/* Funnel Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-600" />
          Outreach Conversion Funnel
        </h3>

        <div className="space-y-3">
          {[
            { label: 'Total Sourced Leads', count: totalLeads, pct: 100, color: 'bg-slate-700' },
            {
              label: 'Outreach Initiated (Contacted)',
              count: contactedCount,
              pct: totalLeads > 0 ? Math.round((contactedCount / totalLeads) * 100) : 0,
              color: 'bg-blue-600',
            },
            {
              label: 'Qualified Prospects',
              count: qualifiedCount,
              pct: totalLeads > 0 ? Math.round((qualifiedCount / totalLeads) * 100) : 0,
              color: 'bg-indigo-600',
            },
            {
              label: 'Deals Closed (Won)',
              count: wonCount,
              pct: totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0,
              color: 'bg-emerald-600',
            },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">{item.label}</span>
                <span className="text-slate-500 font-mono">
                  {item.count} leads ({item.pct}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${Math.max(item.pct, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grids for breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Industry Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            Leads By Industry
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(industryStats).map(([ind, count]) => (
              <div key={ind} className="flex items-center justify-between">
                <span className="text-slate-700 font-medium">{ind}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{count}</span>
                  <span className="text-[10px] text-slate-400">
                    ({Math.round((count / totalLeads) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Territory / Country Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            Target Geography Distribution
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(countryStats).map(([cntry, count]) => (
              <div key={cntry} className="flex items-center justify-between">
                <span className="text-slate-700 font-medium">{cntry}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{count}</span>
                  <span className="text-[10px] text-slate-400">
                    ({Math.round((count / totalLeads) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
