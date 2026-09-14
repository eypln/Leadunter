'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketplaceSearchConfig } from '@/lib/supabase/types';

export function MarketplaceManager() {
  const [configs, setConfigs] = useState<MarketplaceSearchConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newQuery, setNewQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setError(null);
      const res = await fetch('/api/marketplace-configs');
      if (!res.ok) throw new Error('Failed to load marketplace searches');
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace searches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const toggleConfig = async (id: string, currentState: boolean) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentState } : c));
    try {
      const res = await fetch(`/api/marketplace-configs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      });
      if (!res.ok) throw new Error('Update failed');
    } catch {
      setConfigs(prev => prev.map(c => c.id === id ? { ...c, is_active: currentState } : c));
    }
  };

  const updateMinimumScore = async (config: MarketplaceSearchConfig, value: number) => {
    const previousScore = config.minimum_intent_score;
    setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, minimum_intent_score: value } : c));
    try {
      const res = await fetch(`/api/marketplace-configs/${config.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minimum_intent_score: value }),
      });
      if (!res.ok) throw new Error('Update failed');
    } catch {
      setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, minimum_intent_score: previousScore } : c));
    }
  };

  const deleteConfig = async (id: string) => {
    if (!confirm('Remove this Marketplace search from monitoring?')) return;
    setConfigs(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`/api/marketplace-configs/${id}`, { method: 'DELETE' });
    } catch {
      fetchConfigs();
    }
  };

  const addConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      const location = newLocation.trim().toLowerCase().replace(/\s+/g, '');
      const base = `https://www.facebook.com/marketplace/${location}/propertyrentals`;
      const url = newQuery.trim()
        ? `${base}?${new URLSearchParams({ query: newQuery.trim() }).toString()}`
        : base;

      const res = await fetch('/api/marketplace-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add marketplace search');
        return;
      }
      setConfigs(prev => [data.config, ...prev]);
      setNewName('');
      setNewLocation('');
      setNewQuery('');
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add marketplace search');
    } finally {
      setAdding(false);
    }
  };

  const activeCount = configs.filter(c => c.is_active).length;

  return (
    <div className="rounded-xl bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Store className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Facebook Marketplace</h2>
            <p className="text-sm text-gray-500">
              {activeCount} active / {configs.length} total
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            showAddForm
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
          )}
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Cancel' : 'Add Search'}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addConfig}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3">
              <p className="text-xs text-gray-400">
                Always uses Facebook&apos;s <span className="text-blue-400 font-medium">Property Rentals</span> category
                so cars, furniture, and other unrelated items never show up — only add a query to bias
                toward direct-owner language (e.g. &quot;owner&quot;, &quot;direct&quot;).
              </p>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Malta Rentals"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Facebook Marketplace location slug</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="malta"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  From facebook.com/marketplace/&lt;location&gt;/ — e.g. &quot;malta&quot;, &quot;sanfrancisco&quot;.
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Query (optional)</label>
                <input
                  type="text"
                  value={newQuery}
                  onChange={e => setNewQuery(e.target.value)}
                  placeholder="owner"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {adding ? 'Adding...' : 'Add Search'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading marketplace searches...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400 py-4">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Store className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No Marketplace searches configured yet</p>
          <p className="text-xs mt-1">Add one to start monitoring property rental listings</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {configs.map((config) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-all',
                  config.is_active
                    ? 'bg-blue-500/5 border-blue-500/20'
                    : 'bg-gray-800/30 border-gray-700/50 opacity-60'
                )}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{config.name}</span>
                    {config.is_active && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{config.url}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
                    {config.exclude_agents && <span className="text-amber-400">Agents excluded</span>}
                    <label className="flex items-center gap-1">
                      <span>Min score</span>
                      <select
                        value={config.minimum_intent_score ?? 7}
                        onChange={event => updateMinimumScore(config, Number(event.target.value))}
                        className="bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-gray-300"
                        aria-label={`Minimum owner score for ${config.name}`}
                      >
                        {Array.from({ length: 11 }, (_, score) => (
                          <option key={score} value={score}>{score === 0 ? 'off' : score}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={config.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                    title="Open search in Facebook"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => toggleConfig(config.id, config.is_active)}
                    className={cn(
                      'p-1.5 transition-colors',
                      config.is_active ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-gray-400'
                    )}
                    title={config.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {config.is_active
                      ? <ToggleRight className="w-5 h-5" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button
                    onClick={() => deleteConfig(config.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    title="Remove search"
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
