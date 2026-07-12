'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, GitBranch, Star, Link2, Loader2, AlertCircle, Lock } from 'lucide-react';
import type { Repository } from '@/types';

interface ConnectRepoModalProps {
  children: React.ReactNode;
  onConnect?: (id: string) => void;
}

export default function ConnectRepoModal({ children, onConnect }: ConnectRepoModalProps) {
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the signed-in user's real GitHub repos when the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/github/repos');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.hint || data.error || `Request failed (${res.status})`);
        }
        if (!cancelled) setRepos(data.repositories ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load repositories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = repos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = (repo: Repository) => {
    setConnecting(repo.id);
    onConnect?.(repo.id);
    setConnecting(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-emerald-400" />
            Connect Repository
          </DialogTitle>
          <DialogDescription>
            Search your GitHub repositories and connect one to enable AI code reviews.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your repositories..."
              className="pl-9 bg-muted/30 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading your repositories…
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 text-center py-8 text-sm text-red-400">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {repos.length === 0
                  ? 'No repositories found on your GitHub account.'
                  : `No repositories match "${search}"`}
              </div>
            ) : (
              filtered.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {repo.isPrivate && <Lock className="h-3 w-3 text-yellow-400 flex-shrink-0" />}
                      <span className="text-sm font-medium truncate">{repo.fullName}</span>
                      {repo.language && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3" />
                        {repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs ml-3 flex-shrink-0"
                    disabled={connecting === repo.id}
                    onClick={() => handleConnect(repo)}
                  >
                    {connecting === repo.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Link2 className="h-3 w-3 mr-1" />
                    )}
                    Connect
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
