'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MetricsCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' };
  color?: string;
  index?: number;
}

export default function MetricsCard({
  title,
  value,
  suffix = '',
  icon: Icon,
  trend,
  color = 'emerald',
  index = 0,
}: MetricsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    orange: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/20',
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20',
    },
    teal: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
      border: 'border-teal-500/20',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/20',
    },
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className={`border ${colors.border} bg-card/80 backdrop-blur hover:bg-card/90 transition-colors`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">
                  {displayValue.toLocaleString()}
                </span>
                {suffix && (
                  <span className="text-lg text-muted-foreground">{suffix}</span>
                )}
              </div>
              {trend && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-medium ${
                      trend.direction === 'up'
                        ? trend.value > 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                        : trend.value > 0
                          ? 'text-red-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              )}
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.bg}`}>
              <Icon className={`h-5 w-5 ${colors.text}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
