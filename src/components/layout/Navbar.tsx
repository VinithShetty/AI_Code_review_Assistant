'use client';

import { useAppStore } from '@/stores/appStore';
import { PageView } from '@/types';
import {
  Code2,
  LayoutDashboard,
  GitBranch,
  MessageSquare,
  BarChart3,
  LogIn,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const navItems: { view: PageView; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { view: 'repositories', label: 'Repositories', icon: <GitBranch className="h-4 w-4" /> },
  { view: 'reviews', label: 'Reviews', icon: <MessageSquare className="h-4 w-4" /> },
  { view: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
];

export default function Navbar() {
  const { currentView, setView, isAuthenticated, user, logout, toggleSidebar } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20">
              <Code2 className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Code<span className="text-emerald-400">Review</span> AI
            </span>
          </button>
        </div>

        {/* Center navigation - desktop */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === item.view
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {currentView === item.view && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8 border border-emerald-500/30">
                    <AvatarImage src={user?.avatarUrl || undefined} alt={user?.login} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-sm">
                      {user?.login?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">{user?.login}</div>
                <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() =>
                useAppStore.getState().login({
                  login: 'developer',
                  avatarUrl: '',
                })
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in with GitHub</span>
              <span className="sm:hidden">Sign in</span>
            </Button>
          )}

          {/* Mobile menu toggle */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      <AnimatePresence>
        {isAuthenticated && mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border/50"
          >
            <nav className="flex flex-col p-2 gap-1">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => {
                    setView(item.view);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentView === item.view
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
