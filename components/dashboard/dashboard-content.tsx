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
  Store,
} from 'lucide-react';
import { DashboardLayout } from './dashboard-layout';
import { StatsCard } from './stats-card';
import { LeadTypeToggle } from './lead-type-toggle';
import { LeadFeed } from './lead-feed';
import { GroupsManager } from './groups-manager';
import { MarketplaceManager } from './marketplace-manager';
import { AnalyticsSection } from './analytics-section';
import { MessageHistory } from './message-history';
import { SettingsPanel } from './settings-panel';
import type { LeadType } from '@/lib/supabase/types';

interface Stats {
  total: number;
  new: number;
  responded: number;
  skipped: number;
  interested: number;
  agent: number;
}

type ScrapeStatus = 'idle' | 'loading' | 'success' | 'error';

export function DashboardContent() {
  const [leadType, setLeadType] = useState<LeadType>('OWNER');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupsStatus, setGroupsStatus] = useState<ScrapeStatus>('idle');
  const [groupsMessage, setGroupsMessage] = useState<string>('');
  const [marketplaceStatus, setMarketplaceStatus] = useState<ScrapeStatus>('idle');
  const [marketplaceMessage, setMarketplaceMessage] = useState<string>('');

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

  const handleTriggerGroupsScrape = async () => {
    if (groupsStatus === 'loading') return;
    setGroupsStatus('loading');
    setGroupsMessage('');

    try {
      const res = await fetch('/api/scraper/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPosts: parseInt(process.env.NEXT_PUBLIC_SCRAPER_MAX_POSTS || '10') }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setGroupsStatus('success');
        setGroupsMessage(`Groups scan started! (${data.groupsScraped} group${data.groupsScraped !== 1 ? 's' : ''})`);
      } else {
        setGroupsStatus('error');
        setGroupsMessage(data.error || 'Failed to start groups scraper');
      }
    } catch {
      setGroupsStatus('error');
      setGroupsMessage('Network error');
    } finally {
      setTimeout(() => {
        setGroupsStatus('idle');
        setGroupsMessage('');
      }, 6000);
    }
  };

  const handleTriggerMarketplaceScrape = async () => {
    if (marketplaceStatus === 'loading') return;
    setMarketplaceStatus('loading');
    setMarketplaceMessage('');

    try {
      const res = await fetch('/api/scraper/trigger-marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMarketplaceStatus('success');
        setMarketplaceMessage(`Marketplace scan started! (${data.searchesScraped} search${data.searchesScraped !== 1 ? 'es' : ''})`);
      } else {
        setMarketplaceStatus('error');
        setMarketplaceMessage(data.error || 'Failed to start marketplace scraper');
      }
    } catch {
      setMarketplaceStatus('error');
      setMarketplaceMessage('Network error');
    } finally {
      setTimeout(() => {
        setMarketplaceStatus('idle');
        setMarketplaceMessage('');
      }, 6000);
    }
  };

  return (
    <DashboardLayout>
      {(activeTab) => activeTab === 'messages' ? (
        <MessageHistory />
      ) : activeTab === 'settings' ? (
        <SettingsPanel />
      ) : (
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
            {/* Manual Scrape Triggers */}
            <div className="flex items-center gap-3">
              {/* Scan Groups Button */}
              <div className="flex flex-col items-end gap-1">
                <motion.button
                  whileHover={{ scale: groupsStatus === 'loading' ? 1 : 1.03 }}
                  whileTap={{ scale: groupsStatus === 'loading' ? 1 : 0.97 }}
                  onClick={handleTriggerGroupsScrape}
                  disabled={groupsStatus === 'loading'}
                  className={[
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                    groupsStatus === 'idle'
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30'
                      : groupsStatus === 'loading'
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : groupsStatus === 'success'
                      ? 'bg-purple-900/40 text-purple-400 border border-purple-600/30'
                      : 'bg-red-900/40 text-red-400 border border-red-600/30',
                  ].join(' ')}
                >
                  {groupsStatus === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : groupsStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : groupsStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  {groupsStatus === 'loading'
                    ? 'Scanning…'
                    : groupsStatus === 'success'
                    ? 'Started!'
                    : groupsStatus === 'error'
                    ? 'Failed'
                    : 'Scan Groups'}
                </motion.button>
                {groupsMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs max-w-[140px] text-right ${
                      groupsStatus === 'error' ? 'text-red-400' : 'text-purple-400'
                    }`}
                  >
                    {groupsMessage}
                  </motion.p>
                )}
              </div>

              {/* Scan Marketplace Button */}
              <div className="flex flex-col items-end gap-1">
                <motion.button
                  whileHover={{ scale: marketplaceStatus === 'loading' ? 1 : 1.03 }}
                  whileTap={{ scale: marketplaceStatus === 'loading' ? 1 : 0.97 }}
                  onClick={handleTriggerMarketplaceScrape}
                  disabled={marketplaceStatus === 'loading'}
                  className={[
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                    marketplaceStatus === 'idle'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
                      : marketplaceStatus === 'loading'
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : marketplaceStatus === 'success'
                      ? 'bg-blue-900/40 text-blue-400 border border-blue-600/30'
                      : 'bg-red-900/40 text-red-400 border border-red-600/30',
                  ].join(' ')}
                >
                  {marketplaceStatus === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : marketplaceStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : marketplaceStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Store className="w-4 h-4" />
                  )}
                  {marketplaceStatus === 'loading'
                    ? 'Scanning…'
                    : marketplaceStatus === 'success'
                    ? 'Started!'
                    : marketplaceStatus === 'error'
                    ? 'Failed'
                    : 'Scan Marketplace'}
                </motion.button>
                {marketplaceMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs max-w-[140px] text-right ${
                      marketplaceStatus === 'error' ? 'text-red-400' : 'text-blue-400'
                    }`}
                  >
                    {marketplaceMessage}
                  </motion.p>
                )}
              </div>
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
            <StatsCard
              title="Agents"
              value={stats?.agent || 0}
              icon={AlertCircle}
              trend=""
              trendUp={false}
              gradient="from-amber-500 to-red-500"
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

        {/* Facebook Marketplace Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <MarketplaceManager />
        </motion.div>
      </div>
      )}
    </DashboardLayout>
  );
}
