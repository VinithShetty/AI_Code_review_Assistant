'use client';

import { Repository } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GitBranch,
  Star,
  GitPullRequest,
  Lock,
  Globe,
  Unplug,
  Link2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface RepoCardProps {
  repo: Repository;
  isConnected?: boolean;
  onConnect?: (id: string) => void;
  onDisconnect?: (id: string) => void;
  index?: number;
}

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-400',
  JavaScript: 'bg-yellow-400',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-400',
  Python: 'bg-green-400',
  Java: 'bg-red-400',
};

export default function RepoCard({
  repo,
  isConnected = true,
  onConnect,
  onDisconnect,
  index = 0,
}: RepoCardProps) {
  const langDot = languageColors[repo.language || ''] || 'bg-gray-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur hover:bg-card/90 hover:border-emerald-500/30 transition-all group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {repo.isPrivate ? (
                  <Lock className="h-3.5 w-3.5 text-yellow-400" />
                ) : (
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <h4 className="font-semibold text-sm truncate group-hover:text-emerald-400 transition-colors">
                  {repo.fullName}
                </h4>
              </div>
              {repo.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {repo.description}
                </p>
              )}
            </div>

            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-400 flex-shrink-0"
                onClick={() => onDisconnect?.(repo.id)}
              >
                <Unplug className="h-3 w-3 mr-1" />
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
                onClick={() => onConnect?.(repo.id)}
              >
                <Link2 className="h-3 w-3 mr-1" />
                Connect
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {repo.language && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-2.5 w-2.5 rounded-full ${langDot}`} />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3" />
              {repo.stars >= 1000
                ? `${(repo.stars / 1000).toFixed(1)}k`
                : repo.stars}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <GitPullRequest className="h-3 w-3" />
              {repo.openPrs} PRs
            </span>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(repo.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
