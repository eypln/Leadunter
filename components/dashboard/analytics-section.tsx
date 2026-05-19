'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  TrendingUp,
  MapPin,
  MessageSquare,
  Target,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { LeadType } from '@/lib/supabase/types';

interface AnalyticsData {
  total: number;
  responded: number;
  interested: number;
  skipped: number;
  responseRate: number;
  avgIntentScore: number | null;
  volumeData: { date: string; count: number }[];
  topLocations: { location: string; count: number }[];
}

interface AnalyticsSectionProps {
  leadType: LeadType;
}

export function AnalyticsSection({ leadType }: AnalyticsSectionProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/analytics?type=${leadType}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      // silently fail — analytics is non-critical
    } finally {
      setLoading(false);
    }
  }, [leadType]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Normalise volume data for the bar chart (last 14 days)
  const last14 = data?.volumeData.slice(-14) ?? [];
  const maxCount = Math.max(...last14.map((d) => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gray-900/40 border border-gray-800 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Analytics (Last 30 Days)</h3>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : !data ? (
        <p className="text-gray-500 text-center py-8">No analytics data available</p>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              icon={<Target className="w-4 h-4 text-blue-400" />}
              label="Response Rate"
              value={`${data.responseRate}%`}
              color="text-blue-400"
            />
            <KpiCard
              icon={<MessageSquare className="w-4 h-4 text-green-400" />}
              label="Responded"
              value={String(data.responded)}
              color="text-green-400"
            />
            <KpiCard
              icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
              label="Interested"
              value={String(data.interested)}
              color="text-purple-400"
            />
            {leadType === 'OWNER' && data.avgIntentScore != null && (
              <KpiCard
                icon={<TrendingUp className="w-4 h-4 text-yellow-400" />}
                label="Avg Intent Score"
                value={`${data.avgIntentScore}/10`}
                color="text-yellow-400"
              />
            )}
          </div>

          {/* Volume chart */}
          {last14.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-3">Lead Volume (last 14 days)</p>
              <div className="flex items-end gap-1 h-20">
                {last14.map((d) => {
                  const height = Math.max((d.count / maxCount) * 100, 4);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        className="w-full rounded-t-sm bg-blue-500/40 group-hover:bg-blue-500/70 transition-colors relative"
                        style={{ height: `${height}%` }}
                        title={`${d.date}: ${d.count} lead${d.count !== 1 ? 's' : ''}`}
                      >
                        {/* tooltip on hover */}
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs bg-gray-800 text-white rounded px-1.5 py-0.5 whitespace-nowrap">
                          {d.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{last14[0]?.date?.slice(5)}</span>
                <span>{last14[last14.length - 1]?.date?.slice(5)}</span>
              </div>
            </div>
          )}

          {/* Top locations */}
          {data.topLocations.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Top Locations
              </p>
              <div className="space-y-2">
                {data.topLocations.map(({ location, count }) => {
                  const pct = Math.round((count / data.total) * 100);
                  return (
                    <div key={location} className="flex items-center gap-3">
                      <span className="text-sm text-gray-300 w-28 truncate">{location}</span>
                      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                        <div
                          className="bg-blue-500/60 h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-gray-800/40 border border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
