'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  gradient,
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative overflow-hidden rounded-xl bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-6"
    >
      {/* Gradient Background */}
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl',
          `bg-gradient-to-br ${gradient}`
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <div
            className={cn(
              'p-2 rounded-lg bg-gradient-to-br',
              gradient,
              'bg-opacity-10'
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-white">{value}</p>
            {trend && (
              <p
                className={cn(
                  'text-sm font-medium mt-1',
                  trendUp ? 'text-green-400' : 'text-red-400'
                )}
              >
                {trend} from last week
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
