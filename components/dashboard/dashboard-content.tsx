'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  XCircle,
  Loader2,
  Building2,
  UserCheck,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from './dashboard-layout';
import { StatsCard } from './stats-card';
import { LeadTypeToggle } from './lead-type-toggle';
import { LeadFeed } from './lead-feed';
import { GroupsManager } from './groups-manager';
import { AnalyticsSection } from './analytics-section';
import type { LeadType } from '@/lib/supabase/types';

interface Stats {
  total: number;
  new: number;
  responded: number;
  skipped: number;
  interested: number;
}

type ScrapeStatus = 'idle' | 'loading' | 'success' | 'error';

export function DashboardContent() {
  const [leadType, setLeadType] = useState<LeadType>('OWNER');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus>('idle');
  const [scrapeMessage, setScrapeMessage] = useState<string>('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?type=${leadType}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [leadType]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTriggerScrape = async () => {
    if (scrapeStatus === 'loading') return;
    setScrapeStatus('loading');
    setScrapeMessage('');

    try {
      const res = await fetch('/api/scraper/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPosts: parseInt(process.env.NEXT_PUBLIC_SCRAPER_MAX_POSTS || '10') }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setScrapeStatus('success');
        setScrapeMessage(
          `Scraper started! Scanning ${data.groupsScraped} group${data.groupsScraped !== 1 ? 's' : ''}. Results arrive via webhook.`
        );
      } else {
        setScrapeStatus('error');
        setScrapeMessage(data.error || 'Failed to start scraper');
      }
    } catch {
      setScrapeStatus('error');
      setScrapeMessage('Network error — could not reach scraper API');
    } finally {
      // Reset to idle after 6 seconds so user can re-trigger
      setTimeout(() => {
        setScrapeStatus('idle');
        setScrapeMessage('');
      }, 6000);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Lead Dashboard
            </h1>
            <p className="text-gray-400">
              Track and manage your real estate leads
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Manual Scrape Trigger */}
            <div className="flex flex-col items-end gap-1">
              <motion.button
                whileHover={{ scale: scrapeStatus === 'loading' ? 1 : 1.03 }}
                whileTap={{ scale: scrapeStatus === 'loading' ? 1 : 0.97 }}
                onClick={handleTriggerScrape}
                disabled={scrapeStatus === 'loading'}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  scrapeStatus === 'idle'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                    : scrapeStatus === 'loading'
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : scrapeStatus === 'success'
                    ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-600/30'
                    : 'bg-red-900/40 text-red-400 border border-red-600/30',
                ].join(' ')}
              >
                {scrapeStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : scrapeStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : scrapeStatus === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {scrapeStatus === 'loading'
                  ? 'Starting scraper…'
                  : scrapeStatus === 'success'
                  ? 'Scraper started!'
                  : scrapeStatus === 'error'
                  ? 'Failed — retry'
                  : 'Scan Now'}
              </motion.button>

              {/* Status message */}
              {scrapeMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs max-w-xs text-right ${
                    scrapeStatus === 'error' ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {scrapeMessage}
                </motion.p>
              )}
            </div>

            <LeadTypeToggle value={leadType} onChange={setLeadType} />
          </div>
        </motion.div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <StatsCard
              title="Total Leads"
              value={stats?.total || 0}
              icon={leadType === 'OWNER' ? Building2 : UserCheck}
              trend="+12%"
              trendUp={true}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatsCard
              title="New Leads"
              value={stats?.new || 0}
              icon={TrendingUp}
              trend="+8%"
              trendUp={true}
              gradient="from-green-500 to-emerald-500"
            />
            <StatsCard
              title="Responded"
              value={stats?.responded || 0}
              icon={MessageSquare}
              trend="+5%"
              trendUp={true}
              gradient="from-purple-500 to-pink-500"
            />
            <StatsCard
              title="Skipped"
              value={stats?.skipped || 0}
              icon={XCircle}
              trend="-3%"
              trendUp={false}
              gradient="from-orange-500 to-red-500"
            />
          </motion.div>
        )}

        {/* Lead Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <LeadFeed leadType={leadType} />
        </motion.div>

        {/* Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <AnalyticsSection leadType={leadType} />
        </motion.div>

        {/* Phase 7: Facebook Groups Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GroupsManager />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
