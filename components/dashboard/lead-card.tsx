'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Euro,
} from 'lucide-react';
import { cn, formatDate, formatPhoneNumber, formatPrice } from '@/lib/utils';
import { LeadDetailModal } from '@/components/lead-detail/lead-detail-modal';
import type { Lead } from '@/lib/supabase/types';

interface LeadCardProps {
  lead: Lead;
  index: number;
  onUpdate: () => void;
}

export function LeadCard({ lead, index, onUpdate }: LeadCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isOwner = lead.lead_type === 'OWNER';

  const statusColors = {
    NEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    RESPONDED: 'bg-green-500/10 text-green-400 border-green-500/20',
    SKIPPED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    INTERESTED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  const getIntentColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -4 }}
        onClick={() => setIsModalOpen(true)}
        className="group relative overflow-hidden rounded-xl bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-6 hover:border-gray-700 transition-all cursor-pointer"
      >
        {/* Gradient Overlay */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate mb-1">
                {lead.title}
              </h3>
              <p className="text-sm text-gray-400">{lead.author_name}</p>
              {/* Price Badge */}
              {lead.price && (
                <div className="flex items-center gap-1 mt-2">
                  <Euro className="w-4 h-4 text-green-400" />
                  <span className="text-lg font-bold text-green-400">
                    {formatPrice(lead.price)}
                  </span>
                  {lead.lead_type === 'CLIENT' && (
                    <span className="text-xs text-gray-500 ml-1">max budget</span>
                  )}
                </div>
              )}
            </div>

            {/* Status Badge */}
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border',
                statusColors[lead.status]
              )}
            >
              {lead.status}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 line-clamp-2">
            {lead.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {lead.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{lead.location}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{formatPhoneNumber(lead.phone)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(lead.created_at)}</span>
            </div>
          </div>

          {/* OWNER Specific: Intent Score & Agent Flag */}
          {isOwner && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
              {lead.intent_score && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">Intent:</span>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      getIntentColor(lead.intent_score)
                    )}
                  >
                    {lead.intent_score}/10
                  </span>
                </div>
              )}
              {lead.is_agent && (
                <div className="flex items-center gap-1 text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">Agent</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3">
            <a
              href={lead.post_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View Post
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              Details
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <LeadDetailModal
        leadId={lead.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate}
      />
    </>
  );
}

