'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Phone,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Download,
  Loader2,
  Copy,
  Check,
  Euro,
} from 'lucide-react';
import { cn, formatDate, formatPhoneNumber, formatPrice } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import type { Lead } from '@/lib/supabase/types';

interface LeadDetailModalProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetailModal({
  leadId,
  isOpen,
  onClose,
  onUpdate,
}: LeadDetailModalProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [downloadingImages, setDownloadingImages] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const fetchLeadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      if (data.success) {
        setLead(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch lead details:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
    }
  }, [isOpen, leadId, fetchLeadDetails]);

  const generateMessage = async () => {
    if (!lead) return;
    
    setGeneratingMessage(true);
    try {
      const res = await fetch('/api/messages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        toastSuccess('Message generated', 'AI message is ready to send.');
      } else {
        toastError('Failed to generate message', data.error);
      }
    } catch {
      toastError('Failed to generate message', 'Please try again.');
    } finally {
      setGeneratingMessage(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!lead) return;

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toastSuccess('Status updated', `Lead marked as ${status.toLowerCase()}.`);
        onUpdate();
        onClose();
      } else {
        toastError('Failed to update status');
      }
    } catch {
      toastError('Failed to update status', 'Please try again.');
    }
  };

  const downloadImages = async () => {
    if (!lead) return;
    if (lead.images_downloaded) {
      toastInfo('Already downloaded', 'Images are already saved.');
      return;
    }
    setDownloadingImages(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/images`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toastSuccess('Images downloaded', data.message);
        setLead((prev) => prev ? { ...prev, images_downloaded: true } : prev);
        onUpdate();
      } else {
        toastError('Download failed', data.error);
      }
    } catch {
      toastError('Download failed', 'Please try again.');
    } finally {
      setDownloadingImages(false);
    }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toastSuccess('Copied!', 'Message copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const trackMessageSent = (templateType: 'WHATSAPP' | 'MESSENGER' | 'FACEBOOK_COMMENT') => {
    if (!lead || !message) return;

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ leadId: lead.id, templateType, messageText: message }),
    }).catch(() => undefined);
  };

  const getIntentColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const statusColors = {
    NEW: 'bg-blue-500',
    RESPONDED: 'bg-green-500',
    SKIPPED: 'bg-gray-500',
    INTERESTED: 'bg-purple-500',
    AGENT: 'bg-orange-500',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/95 backdrop-blur-xl">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-white truncate">
                    {loading ? 'Loading...' : lead?.title}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {loading ? '' : lead?.author_name}
                  </p>
                  {/* Price Display */}
                  {!loading && lead?.price && (
                    <div className="flex items-center gap-2 mt-2">
                      <Euro className="w-5 h-5 text-green-400" />
                      <span className="text-2xl font-bold text-green-400">
                        {formatPrice(lead.price)}
                      </span>
                      {lead.lead_type === 'CLIENT' && (
                        <span className="text-sm text-gray-500 ml-1">
                          (max budget)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-240px)] p-6 space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : lead ? (
                  <>
                    {/* Meta Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {lead.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300">{lead.location}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300">
                            {formatPhoneNumber(lead.phone)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">
                          {formatDate(lead.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium text-white',
                            statusColors[lead.status]
                          )}
                        >
                          {lead.status}
                        </span>
                      </div>
                      {/* Phase 7: Source badge */}
                      {lead.scrape_source && lead.scrape_source !== 'UNKNOWN' && (
                        <div className="flex items-center gap-1 text-sm col-span-2">
                          <span className="text-gray-500">Source:</span>
                          <span className="text-purple-400 font-medium truncate">
                            {lead.scrape_source.startsWith('FACEBOOK_GROUP:')
                              ? lead.scrape_source.replace('FACEBOOK_GROUP:', '📍 ')
                              : lead.scrape_source === 'FACEBOOK_MARKETPLACE'
                              ? '🛒 Marketplace'
                              : lead.scrape_source}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* OWNER Specific Info */}
                    {lead.lead_type === 'OWNER' && (
                      <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                        {lead.intent_score && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-400">
                              Intent Score:
                            </span>
                            <span
                              className={cn(
                                'text-lg font-bold',
                                getIntentColor(lead.intent_score)
                              )}
                            >
                              {lead.intent_score}/10
                            </span>
                          </div>
                        )}
                        {lead.is_agent && (
                          <div className="flex items-center gap-2 text-orange-400">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-sm font-medium">
                              Flagged as Agent
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Description
                      </h3>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {lead.description}
                      </p>
                    </div>

                    {/* Images */}
                    {lead.image_urls && lead.image_urls.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">
                            Images ({lead.image_urls.length})
                          </h3>
                          {!lead.images_downloaded && (
                            <button
                              onClick={downloadImages}
                              disabled={downloadingImages}
                              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                            >
                              {downloadingImages ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  Save to Storage
                                </>
                              )}
                            </button>
                          )}
                          {lead.images_downloaded && (
                            <span className="flex items-center gap-1.5 text-xs text-green-400">
                              <Check className="w-3.5 h-3.5" />
                              Saved
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {lead.image_urls.map((url, index) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={index}
                              src={url}
                              alt={`Lead image ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Generation */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          Generated Message
                        </h3>
                        <button
                          onClick={generateMessage}
                          disabled={generatingMessage}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          {generatingMessage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4" />
                              Generate Message
                            </>
                          )}
                        </button>
                      </div>

                      {message && (
                        <div className="space-y-3">
                          <div className="relative">
                            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                              <p className="text-gray-300 whitespace-pre-wrap">
                                {message}
                              </p>
                            </div>
                            <button
                              onClick={copyMessage}
                              className="absolute top-2 right-2 p-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>

                          {/* 1-Click Send Buttons */}
                          {lead.lead_type === 'OWNER' && (
                            <div className="flex gap-2">
                              {lead.phone ? (
                                <a
                                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => trackMessageSent('WHATSAPP')}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                                >
                                  <MessageSquare className="w-5 h-5" />
                                  Send via WhatsApp
                                </a>
                              ) : (
                                <a
                                  href={`https://m.me/${lead.author_id}?text=${encodeURIComponent(message)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => trackMessageSent('MESSENGER')}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                >
                                  <MessageSquare className="w-5 h-5" />
                                  Send via Messenger
                                </a>
                              )}
                            </div>
                          )}

                          {lead.lead_type === 'CLIENT' && (
                            <a
                              href={lead.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => trackMessageSent('FACEBOOK_COMMENT')}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            >
                              <MessageSquare className="w-5 h-5" />
                              Comment on Facebook Post
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Lead not found</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {lead && (
                <div className="sticky bottom-0 flex items-center gap-3 p-6 border-t border-gray-800 bg-gray-900/95 backdrop-blur-xl">
                  <a
                    href={lead.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Post
                  </a>

                  <div className="flex-1" />

                  <button
                    onClick={() => updateStatus('SKIPPED')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => updateStatus('AGENT')}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Agent
                  </button>
                  <button
                    onClick={() => updateStatus('INTERESTED')}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Interested
                  </button>
                  <button
                    onClick={() => updateStatus('RESPONDED')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Mark Responded
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
