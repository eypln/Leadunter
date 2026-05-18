'use client';

import { motion } from 'framer-motion';
import { Building2, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeadType } from '@/lib/supabase/types';

interface LeadTypeToggleProps {
  value: LeadType;
  onChange: (value: LeadType) => void;
}

export function LeadTypeToggle({ value, onChange }: LeadTypeToggleProps) {
  const options: { value: LeadType; label: string; icon: typeof Building2 }[] = [
    { value: 'OWNER', label: 'Property Owners', icon: Building2 },
    { value: 'CLIENT', label: 'Looking to Rent', icon: UserCheck },
  ];

  return (
    <div className="inline-flex items-center gap-2 p-1 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-lg">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative px-4 py-2 rounded-md text-sm font-medium transition-all',
              isActive
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
