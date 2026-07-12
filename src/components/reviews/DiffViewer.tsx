'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode, MessageSquare } from 'lucide-react';
import { ReviewComment } from '@/types';
import { motion } from 'framer-motion';

interface DiffLine {
  type: 'context' | 'added' | 'removed';
  lineNumber: number;
  content: string;
}

interface DiffViewerProps {
  filePath: string;
  diffLines: DiffLine[];
  comments: ReviewComment[];
}

export default function DiffViewer({ filePath, diffLines, comments }: DiffViewerProps) {
  const commentLines = new Set(comments.filter((c) => c.lineNumber).map((c) => c.lineNumber!));
  const getCommentsForLine = (line: number) =>
    comments.filter((c) => c.lineNumber === line);

  const severityBadge: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    error: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    info: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
        {/* File header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border/50">
          <FileCode className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-mono text-foreground">{filePath}</span>
          <Badge variant="outline" className="ml-auto text-xs text-muted-foreground border-border/50">
            {diffLines.length} lines
          </Badge>
        </div>

        {/* Diff content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <pre className="text-xs font-mono leading-6">
              {diffLines.map((line, idx) => (
                <div key={idx}>
                  <div
                    className={`flex ${
                      line.type === 'added'
                        ? 'bg-emerald-500/10'
                        : line.type === 'removed'
                          ? 'bg-red-500/10'
                          : ''
                    }`}
                  >
                    <span className="w-12 flex-shrink-0 text-right pr-3 text-muted-foreground/50 select-none border-r border-border/30">
                      {line.lineNumber}
                    </span>
                    <span className="w-6 flex-shrink-0 text-center select-none">
                      {line.type === 'added' ? (
                        <span className="text-emerald-400">+</span>
                      ) : line.type === 'removed' ? (
                        <span className="text-red-400">-</span>
                      ) : (
                        <span className="text-muted-foreground/30"> </span>
                      )}
                    </span>
                    <span
                      className={`flex-1 px-2 ${
                        line.type === 'added'
                          ? 'text-emerald-300'
                          : line.type === 'removed'
                            ? 'text-red-300'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {line.content}
                    </span>
                    {commentLines.has(line.lineNumber) && (
                      <span className="flex-shrink-0 pr-2 text-emerald-400">
                        <MessageSquare className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  {/* Inline comments */}
                  {commentLines.has(line.lineNumber) &&
                    getCommentsForLine(line.lineNumber).map((comment) => (
                      <div
                        key={comment.id}
                        className="flex bg-muted/20 border-l-2 border-emerald-500/50 ml-12"
                      >
                        <div className="flex-1 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${severityBadge[comment.severity]} text-[10px] px-1.5 py-0`}
                            >
                              {comment.severity}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 bg-muted/50 text-muted-foreground border-border/50"
                            >
                              {comment.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-foreground/90">{comment.message}</p>
                          {comment.suggestion && (
                            <div className="bg-muted/30 rounded-md p-2 mt-1">
                              <p className="text-[10px] text-emerald-400 font-medium mb-1">
                                Suggestion:
                              </p>
                              <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap">
                                {comment.suggestion}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </pre>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
