'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import RepoCard from '@/components/repositories/RepoCard';
import ConnectRepoModal from '@/components/repositories/ConnectRepoModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitBranch, Plus, Search } from 'lucide-react';
import { mockRepos } from '@/data/mockData';

export default function RepositoriesView() {
  const [search, setSearch] = useState('');
  const [connectedIds, setConnectedIds] = useState<Set<string>>(
    new Set(mockRepos.map((r) => r.id))
  );

  const filteredRepos = mockRepos.filter(
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
              Manage connected repositories and monitor PR activity
            </p>
          </div>
          <ConnectRepoModal
            onConnect={(fullName) => {
              // In a real app, this would call the API
              console.log('Connecting repo:', fullName);
            }}
          >
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Connect Repository
            </Button>
          </ConnectRepoModal>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          className="pl-9 bg-muted/30 border-border/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Connected repos */}
      {filteredRepos.filter((r) => connectedIds.has(r.id)).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-emerald-400" />
            Connected ({filteredRepos.filter((r) => connectedIds.has(r.id)).length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRepos
              .filter((r) => connectedIds.has(r.id))
              .map((repo, idx) => (
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

      {/* Disconnected repos */}
      {filteredRepos.filter((r) => !connectedIds.has(r.id)).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Available to Connect ({filteredRepos.filter((r) => !connectedIds.has(r.id)).length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRepos
              .filter((r) => !connectedIds.has(r.id))
              .map((repo, idx) => (
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

      {filteredRepos.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No repositories found matching &quot;{search}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
