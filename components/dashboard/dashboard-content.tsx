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
  UserCheck
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

export function DashboardContent() {
  const [leadType, setLeadType] = useState<LeadType>('OWNER');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

          <LeadTypeToggle value={leadType} onChange={setLeadType} />
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
