'use client';

import { useAppStore } from '@/stores/appStore';
import { PageView } from '@/types';
import {
  LayoutDashboard,
  GitBranch,
  MessageSquare,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const navItems: { view: PageView; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { view: 'repositories', label: 'Repositories', icon: <GitBranch className="h-4 w-4" /> },
  { view: 'reviews', label: 'Reviews', icon: <MessageSquare className="h-4 w-4" /> },
  { view: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
];

type SidebarRepo = { id: string; fullName: string };

export default function Sidebar() {
  const { currentView, setView, sidebarOpen, setSidebarOpen } = useAppStore();

  const [repos, setRepos] = useState<SidebarRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRepos() {
      try {
        const res = await fetch('/api/github/repos');
        if (!res.ok) throw new Error('Failed to load repositories');
        const data: { repositories?: SidebarRepo[] } = await res.json();
        if (!cancelled) {
          setRepos(Array.isArray(data.repositories) ? data.repositories : []);
        }
      } catch {
        if (!cancelled) setRepos([]);
      } finally {
        if (!cancelled) setReposLoading(false);
      }
    }

    loadRepos();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 256 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex flex-col border-r border-border/50 bg-card/50 overflow-hidden flex-shrink-0"
    >
      <div className="flex items-center justify-between p-3">
        {sidebarOpen && (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                currentView === item.view
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              {item.icon}
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Separator className="my-4" />

            <div className="px-3 mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Shield className="h-3 w-3" />
                Connected Repos
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {reposLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                  >
                    <GitBranch className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40" />
                    <div className="h-3 w-full max-w-[140px] rounded bg-muted/50 animate-pulse" />
                  </div>
                ))
              ) : repos.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground/70">
                  No repositories yet
                </div>
              ) : (
                repos.slice(0, 5).map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => setView('repositories')}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <GitBranch className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate text-xs">{repo.fullName}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </ScrollArea>

      {!sidebarOpen && (
        <div className="p-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-9 text-muted-foreground hover:text-foreground"
            onClick={() => setView('repositories')}
            title="Repositories"
          >
            <GitBranch className="h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.aside>
  );
}
