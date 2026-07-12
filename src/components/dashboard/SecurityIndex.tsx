'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SecurityIndexProps {
  score: number;
}

export default function SecurityIndex({ score }: SecurityIndexProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [score]);

  const getColor = (s: number) => {
    if (s >= 75) return { stroke: '#10b981', text: 'text-emerald-400', label: 'Good' };
    if (s >= 50) return { stroke: '#eab308', text: 'text-yellow-400', label: 'Fair' };
    return { stroke: '#ef4444', text: 'text-red-400', label: 'Poor' };
  };

  const colorInfo = getColor(score);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Security Index
            </h3>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="180" height="180" className="-rotate-90">
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-muted/30"
                />
                <motion.circle
                  cx="90"
                  cy="90"
                  r={radius}
                  stroke={colorInfo.stroke}
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${colorInfo.text}`}>
                  {animatedScore}
                </span>
                <span className="text-xs text-muted-foreground mt-1">{colorInfo.label}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-red-400">2</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-400">7</div>
              <div className="text-xs text-muted-foreground">High</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">14</div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
