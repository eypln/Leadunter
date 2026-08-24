'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cookie,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroupConfig } from '@/lib/supabase/types';

export function GroupsManager() {
  const [groups, setGroups] = useState<GroupConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [cookieConfigured, setCookieConfigured] = useState<boolean | null>(null);
  const [showCookieGuide, setShowCookieGuide] = useState(false);

  const fetchGroups = async () => {
    try {
      setError(null);
      const res = await fetch('/api/groups');
      if (!res.ok) throw new Error('Failed to load groups');
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  // Check if FB cookie is configured
  const fetchScraperStatus = async () => {
    try {
      const res = await fetch('/api/scraper/trigger');
      if (res.ok) {
        const data = await res.json();
        setCookieConfigured(!!data.cookieConfigured);
      }
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchScraperStatus();
  }, []);

  const toggleGroup = async (id: string, currentState: boolean) => {
    // Optimistic update
    setGroups(prev => prev.map(g => g.id === id ? { ...g, is_active: !currentState } : g));
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      });
      if (!res.ok) throw new Error('Update failed');
    } catch {
      // Revert on error
      setGroups(prev => prev.map(g => g.id === id ? { ...g, is_active: currentState } : g));
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Remove this Facebook group from monitoring?')) return;
    setGroups(prev => prev.filter(g => g.id !== id));
    try {
      await fetch(`/api/groups/${id}`, { method: 'DELETE' });
    } catch {
      // Refetch on error
      fetchGroups();
    }
  };

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), url: newUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add group');
        return;
      }
      setGroups(prev => [data.group, ...prev]);
      setNewName('');
      setNewUrl('');
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add group');
    } finally {
      setAdding(false);
    }
  };

  const activeCount = groups.filter(g => g.is_active).length;

  return (
    <div className="rounded-xl bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Facebook Groups</h2>
            <p className="text-sm text-gray-500">
              {activeCount} active / {groups.length} total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cookie status badge */}
          {cookieConfigured !== null && (
            <button
              onClick={() => setShowCookieGuide(!showCookieGuide)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                cookieConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
              )}
              title={cookieConfigured ? 'Private groups accessible' : 'Click to learn how to enable private group access'}
            >
              {cookieConfigured
                ? <ShieldCheck className="w-3.5 h-3.5" />
                : <ShieldAlert className="w-3.5 h-3.5" />
              }
              {cookieConfigured ? 'Auth: Active' : 'Auth: Not set'}
              {showCookieGuide
                ? <ChevronUp className="w-3 h-3" />
                : <ChevronDown className="w-3 h-3" />
              }
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              showAddForm
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400'
            )}
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Cancel' : 'Add Group'}
          </button>
        </div>
      </div>

      {/* Cookie Setup Guide */}
      <AnimatePresence>
        {showCookieGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className={cn(
              'p-4 rounded-lg border space-y-3',
              cookieConfigured
                ? 'bg-emerald-900/10 border-emerald-700/30'
                : 'bg-amber-900/10 border-amber-700/30'
            )}>
              <div className="flex items-center gap-2">
                <Cookie className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm font-medium text-white">
                  {cookieConfigured
                    ? 'Facebook session cookie is configured — private groups are accessible'
                    : 'No Facebook cookie set — only public groups can be scraped'}
                </p>
              </div>

              {!cookieConfigured && (
                <>
                  <p className="text-xs text-gray-400">
                    To scrape private or closed Facebook groups, you need to provide a session cookie
                    from a logged-in Facebook account. Use a <span className="text-amber-400 font-medium">dedicated account</span>, never your personal one.
                  </p>
                  <ol className="space-y-1.5 text-xs text-gray-300">
                    <li className="flex gap-2">
                      <span className="text-purple-400 font-bold flex-shrink-0">1.</span>
                      Log in to Facebook in Chrome or Firefox with your dedicated account
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400 font-bold flex-shrink-0">2.</span>
                      Open <span className="font-mono bg-gray-800 px-1 rounded text-gray-200">DevTools</span> (F12) → <span className="font-mono bg-gray-800 px-1 rounded text-gray-200">Application</span> → <span className="font-mono bg-gray-800 px-1 rounded text-gray-200">Cookies</span> → <span className="font-mono bg-gray-800 px-1 rounded text-gray-200">https://www.facebook.com</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400 font-bold flex-shrink-0">3.</span>
                      Copy the values of: <span className="font-mono bg-gray-800 px-1 rounded text-amber-300">c_user</span>, <span className="font-mono bg-gray-800 px-1 rounded text-amber-300">xs</span>, <span className="font-mono bg-gray-800 px-1 rounded text-amber-300">datr</span>, <span className="font-mono bg-gray-800 px-1 rounded text-amber-300">fr</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400 font-bold flex-shrink-0">4.</span>
                      Add to <span className="font-mono bg-gray-800 px-1 rounded text-gray-200">.env.local</span> and Vercel env vars:
                    </li>
                  </ol>
                  <div className="font-mono text-xs bg-gray-950 border border-gray-700 rounded p-3 text-green-400 break-all">
                    FACEBOOK_COOKIE_STRING=&quot;c_user=YOUR_ID; xs=YOUR_XS; datr=YOUR_DATR; fr=YOUR_FR&quot;
                  </div>
                  <p className="text-xs text-gray-500">
                    ⚠️ Cookies expire every 30–60 days. After updating, redeploy to Vercel.
                  </p>
                </>
              )}

              {cookieConfigured && (
                <p className="text-xs text-emerald-400/70">
                  ✓ Cookie is set in environment. Private and closed groups will be accessible during scraping. Remember to refresh it every 30–60 days.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addGroup}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Group Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Malta Property Rentals"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Facebook Group URL</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://www.facebook.com/groups/maltarealestate"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the direct group URL from your browser address bar.{' '}
                  <span className="text-amber-400">Share links (facebook.com/share/g/...) won&apos;t work.</span>
                </p>
              </div>
              {addError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{addError}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={adding}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {adding ? 'Adding...' : 'Add Group'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Groups List */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading groups...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400 py-4">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No Facebook groups configured yet</p>
          <p className="text-xs mt-1">Add groups to start monitoring them for leads</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-all',
                  group.is_active
                    ? 'bg-purple-500/5 border-purple-500/20'
                    : 'bg-gray-800/30 border-gray-700/50 opacity-60'
                )}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{group.name}</span>
                    {group.is_active && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{group.url}</p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={group.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                    title="Open group in Facebook"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => toggleGroup(group.id, group.is_active)}
                    className={cn(
                      'p-1.5 transition-colors',
                      group.is_active ? 'text-purple-400 hover:text-purple-300' : 'text-gray-500 hover:text-gray-400'
                    )}
                    title={group.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {group.is_active
                      ? <ToggleRight className="w-5 h-5" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    title="Remove group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
