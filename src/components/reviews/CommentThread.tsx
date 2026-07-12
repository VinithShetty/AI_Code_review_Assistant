'use client';

import { ReviewComment } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldAlert,
  ChevronDown,
  FileCode,
  Lightbulb,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface CommentThreadProps {
  comments: ReviewComment[];
}

const severityConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  critical: {
    icon: ShieldAlert,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  error: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  info: {
    icon: Info,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
  },
};

const categoryColors: Record<string, string> = {
  security: 'bg-red-500/20 text-red-400 border-red-500/30',
  performance: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  logic: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  style: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

export default function CommentThread({ comments }: CommentThreadProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    critical: true,
    error: true,
    warning: false,
    info: false,
  });

  const grouped = comments.reduce(
    (acc, comment) => {
      if (!acc[comment.severity]) acc[comment.severity] = [];
      acc[comment.severity].push(comment);
      return acc;
    },
    {} as Record<string, ReviewComment[]>
  );

  const severityOrder = ['critical', 'error', 'warning', 'info'];

  const toggleSection = (severity: string) => {
    setOpenSections((prev) => ({ ...prev, [severity]: !prev[severity] }));
  };

  return (
    <div className="space-y-2">
      {severityOrder.map((severity) => {
        const group = grouped[severity];
        if (!group || group.length === 0) return null;

        const config = severityConfig[severity];
        const SevIcon = config.icon;

        return (
          <motion.div
            key={severity}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Collapsible
              open={openSections[severity]}
              onOpenChange={() => toggleSection(severity)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-card/80 border border-border/50 hover:bg-card/90 transition-colors">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${config.bgColor}`}>
                  <SevIcon className={`h-4 w-4 ${config.color}`} />
                </div>
                <span className={`text-sm font-semibold ${config.color} capitalize`}>
                  {severity}
                </span>
                <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
                  {group.length}
                </Badge>
                <ChevronDown
                  className={`h-4 w-4 ml-auto text-muted-foreground transition-transform ${
                    openSections[severity] ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-2 pl-4">
                {group.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-mono text-foreground/80">
                        {comment.filePath}
                      </span>
                      {comment.lineNumber && (
                        <span className="text-xs text-muted-foreground">
                          :L{comment.lineNumber}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${categoryColors[comment.category]}`}
                      >
                        {comment.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {comment.message}
                    </p>
                    {comment.suggestion && (
                      <div className="mt-3 flex items-start gap-2 bg-muted/30 rounded-md p-3">
                        <Lightbulb className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-emerald-400 font-medium mb-1">
                            Suggested Fix
                          </p>
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                            {comment.suggestion}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        );
      })}
    </div>
  );
}
