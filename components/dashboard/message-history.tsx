'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, MessageCircle, MessageSquare, Send, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { MessageTemplateType } from '@/lib/supabase/types';

interface MessageRecord {
  id: string;
  template_type: MessageTemplateType;
  message_text: string;
  sent_at: string;
  leads: { title: string; author_name: string; lead_type: 'OWNER' | 'CLIENT'; post_url: string } | null;
}

const channelDetails: Record<MessageTemplateType, { label: string; className: string; icon: typeof MessageSquare }> = {
  WHATSAPP: { label: 'WhatsApp', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: MessageCircle },
  MESSENGER: { label: 'Messenger', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: MessageSquare },
  FACEBOOK_COMMENT: { label: 'Facebook comment', className: 'bg-sky-500/10 text-sky-400 border-sky-500/20', icon: MessageSquare },
};

export function MessageHistory() {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/messages')
      .then((response) => response.json())
      .then((data) => setMessages(data.success ? data.data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Send className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Sent messages</h1>
        </div>
        <p className="text-gray-400">Your outreach activity, ordered from newest to oldest.</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-blue-400 animate-spin" /></div>
      ) : messages.length === 0 ? (
        <div className="border border-dashed border-gray-700 bg-gray-900/30 px-6 py-20 text-center rounded-lg">
          <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-white font-medium">No messages sent yet</p>
          <p className="text-sm text-gray-500 mt-1">Messages appear here when you open WhatsApp, Messenger, or a Facebook comment from a lead.</p>
        </div>
      ) : (
        <div className="border border-gray-800 bg-gray-900/45 divide-y divide-gray-800 rounded-lg overflow-hidden">
          {messages.map((message, index) => {
            const channel = channelDetails[message.template_type];
            const ChannelIcon = channel.icon;
            return (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3) }}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-5 p-5 hover:bg-gray-800/30 transition-colors"
              >
                <div className="min-w-0">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-xs font-medium ${channel.className}`}>
                    <ChannelIcon className="w-3.5 h-3.5" />
                    {channel.label}
                  </div>
                  <p className="text-white font-medium mt-3 truncate">{message.leads?.author_name ?? 'Deleted lead'}</p>
                  <p className="text-xs text-gray-500 truncate mt-1">{message.leads?.title ?? 'Lead no longer available'}</p>
                </div>
                <p className="text-sm leading-6 text-gray-300 whitespace-pre-wrap line-clamp-3">{message.message_text}</p>
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 text-xs text-gray-500 whitespace-nowrap">
                  <span>{formatDate(message.sent_at)}</span>
                  {message.leads?.post_url && <a href={message.leads.post_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300" aria-label="Open lead post"><ExternalLink className="w-4 h-4" /></a>}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}