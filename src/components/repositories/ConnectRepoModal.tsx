'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, GitBranch, Star, Link2, Loader2 } from 'lucide-react';
import { Repository } from '@/types';

interface ConnectRepoModalProps {
  children: React.ReactNode;
  onConnect?: (fullName: string) => void;
}

const searchableRepos: Repository[] = [
  {
    id: 'search-1',
    fullName: 'microsoft/vscode',
    name: 'vscode',
    description: 'Visual Studio Code - Open Source IDE for developers worldwide.',
    language: 'TypeScript',
    isPrivate: false,
    stars: 165000,
    openPrs: 56,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-12-20T00:00:00Z',
  },
  {
    id: 'search-2',
    fullName: 'rust-lang/rust',
    name: 'rust',
    description: 'Empowering everyone to build reliable and efficient software.',
    language: 'Rust',
    isPrivate: false,
    stars: 97500,
    openPrs: 89,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-12-19T00:00:00Z',
  },
  {
    id: 'search-3',
    fullName: 'golang/go',
    name: 'go',
    description: 'The Go programming language. Simple, reliable, efficient.',
    language: 'Go',
    isPrivate: false,
    stars: 124000,
    openPrs: 42,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-12-20T00:00:00Z',
  },
  {
    id: 'search-4',
    fullName: 'python/cpython',
    name: 'cpython',
    description: 'The Python programming language. Official repository.',
    language: 'Python',
    isPrivate: false,
    stars: 63000,
    openPrs: 67,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-12-18T00:00:00Z',
  },
];

export default function ConnectRepoModal({ children, onConnect }: ConnectRepoModalProps) {
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = searchableRepos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = async (fullName: string) => {
    setConnecting(fullName);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onConnect?.(fullName);
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
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search GitHub repositories..."
              className="pl-9 bg-muted/30 border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No repositories found matching &quot;{search}&quot;
              </div>
            ) : (
              filtered.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {repo.fullName}
                      </span>
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
                        {(repo.stars / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs ml-3 flex-shrink-0"
                    disabled={connecting === repo.fullName}
                    onClick={() => handleConnect(repo.fullName)}
                  >
                    {connecting === repo.fullName ? (
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
