import { useQuery } from '@tanstack/react-query';
import { PieChart, TrendingUp, Users, Mail, Target, Search, Calendar, PhoneCall, Globe, AlertCircle } from 'lucide-react';
import { getAnalyticsStats } from '../api/analytics';

export const AnalyticsPage = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analyticsStats'],
    queryFn: getAnalyticsStats
  });

  const stats = analyticsData?.data?.summary || {};
  const industryBreakdown = analyticsData?.data?.industryBreakdown || [];
  const statusBreakdown = analyticsData?.data?.statusBreakdown || [];

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="text-slate-500">Loading analytics & report metrics...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <PieChart className="text-primary-600 h-7 w-7" /> Real-time Analytics & Intelligence
        </h1>
        <p className="text-slate-500 text-sm mt-1">Deep metrics on lead discovery, contact conversion rates, and industry distribution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads Discovered</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalLeads || 0}</div>
          <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Across {stats.totalSearches || 0} AI searches
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacted Leads</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats.contactedLeads || 0}</div>
          <div className="text-xs text-primary-600 font-medium mt-1">
            {stats.conversionRate || 0}% pipeline conversion
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Campaigns</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalCampaigns || 0}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.totalFollowUps || 0} follow-ups set</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Positive Responses</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats.positiveReplies || 0}</div>
          <div className="text-xs text-green-600 font-medium mt-1">
            {stats.replyRate || 0}% response rate
          </div>
        </div>
      </div>

      {/* Data Quality & Enrichment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Public Email Availability</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.leadsWithEmail || 0} leads</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Mail className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Phone Numbers Found</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.leadsWithPhone || 0} leads</div>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <PhoneCall className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Without Website (Sales Target)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.leadsWithoutWebsite || 0} leads</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Globe className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Top Target Industries</h3>
          {industryBreakdown.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center">No industry breakdown data available.</div>
          ) : (
            <div className="space-y-3">
              {industryBreakdown.map((item, idx) => {
                const percentage = stats.totalLeads > 0 ? ((item.count / stats.totalLeads) * 100).toFixed(1) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{item.industry}</span>
                      <span>{item.count} leads ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary-600 h-full rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lead Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Lead Status Pipeline</h3>
          {statusBreakdown.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center">No lead status data available.</div>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((item, idx) => {
                const percentage = stats.totalLeads > 0 ? ((item.count / stats.totalLeads) * 100).toFixed(1) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span className="capitalize">{item.status.replace(/_/g, ' ')}</span>
                      <span>{item.count} leads ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
