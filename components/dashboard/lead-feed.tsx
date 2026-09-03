'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { LeadCard } from './lead-card';
import { LeadCardSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import type { Lead, LeadType, LeadStatus } from '@/lib/supabase/types';

const PAGE_SIZE = 12;

interface LeadFeedProps {
  leadType: LeadType;
}

export function LeadFeed({ leadType }: LeadFeedProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('NEW');
  const { error: toastError } = useToast();

  const fetchLeads = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset;
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          type: leadType,
          limit: String(PAGE_SIZE),
          offset: String(currentOffset),
        });

        if (statusFilter !== 'ALL') {
          params.set('status', statusFilter);
        }

        const res = await fetch(`/api/leads?${params}`);
        if (!res.ok) throw new Error('Failed to fetch leads');
        const data = await res.json();
        if (data.success) {
          const newLeads: Lead[] = data.data;
          if (reset) {
            setLeads(newLeads);
            setOffset(newLeads.length);
          } else {
            setLeads((prev) => [...prev, ...newLeads]);
            setOffset((prev) => prev + newLeads.length);
          }
          setHasMore(newLeads.length === PAGE_SIZE);
        }
      } catch {
        toastError('Failed to load leads', 'Please check your connection and try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [leadType, statusFilter]
  );

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchLeads(true);
  }, [fetchLeads, leadType, statusFilter]);

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      lead.title.toLowerCase().includes(q) ||
      lead.description.toLowerCase().includes(q) ||
      lead.author_name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">
            {leadType === 'OWNER' ? 'Property Owners' : 'Looking to Rent'}
          </h2>
          {!loading && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-800 text-gray-400">
              {filteredLeads.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            onClick={() => fetchLeads(true)}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors disabled:opacity-50"
            title="Refresh leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-52"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'ALL')}
            className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="ALL">All Status</option>
            <option value="NEW">New</option>
            <option value="RESPONDED">Responded</option>
            <option value="SKIPPED">Skipped</option>
            <option value="INTERESTED">Interested</option>
          </select>
        </div>
      </div>

      {/* Lead Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 border border-gray-800/50 rounded-xl"
        >
          <p className="text-gray-400 text-lg">No leads found</p>
          <p className="text-gray-600 text-sm mt-1">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Trigger a scrape to find new leads'}
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredLeads.map((lead, index) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  index={index}
                  onUpdate={() => fetchLeads(true)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Load More */}
          {hasMore && !searchQuery && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchLeads(false)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800 hover:border-gray-700 rounded-xl text-gray-300 hover:text-white transition-all disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load More Leads
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
