'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RepoCard from '@/components/repositories/RepoCard';
import ConnectRepoModal from '@/components/repositories/ConnectRepoModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitBranch, Plus, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { Repository } from '@/types';

export default function RepositoriesView() {
  const [search, setSearch] = useState('');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/github/repos');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.hint || data.error || `Request failed (${res.status})`);
      }
      const list: Repository[] = data.repositories ?? [];
      setRepos(list);
      setConnectedIds(new Set(list.map((r) => r.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  const filteredRepos = repos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.language?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDisconnect = (id: string) => {
    setConnectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleConnect = (id: string) => {
    setConnectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const connected = filteredRepos.filter((r) => connectedIds.has(r.id));
  const available = filteredRepos.filter((r) => !connectedIds.has(r.id));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Repositories</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your GitHub repositories, pulled live from your account
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 border-border/50"
              onClick={loadRepos}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <ConnectRepoModal
              onConnect={(fullName) => handleConnect(fullName)}
            >
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Plus className="h-4 w-4" />
                Connect Repository
              </Button>
            </ConnectRepoModal>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your repositories..."
          className="pl-9 bg-muted/30 border-border/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading your GitHub repositories…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium mb-1">
            Couldn&apos;t load your repositories
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="border-border/50"
            onClick={loadRepos}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && repos.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No repositories found on your GitHub account.
          </p>
        </div>
      )}

      {/* Connected repos */}
      {!loading && !error && connected.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-emerald-400" />
            Connected ({connected.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {connected.map((repo, idx) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                isConnected={true}
                onDisconnect={handleDisconnect}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available repos */}
      {!loading && !error && available.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Available to Connect ({available.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {available.map((repo, idx) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                isConnected={false}
                onConnect={handleConnect}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* No search matches */}
      {!loading && !error && repos.length > 0 && filteredRepos.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No repositories match &quot;{search}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
