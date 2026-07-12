import { create } from 'zustand';
import { PageView } from '@/types';

interface AppState {
  currentView: PageView;
  selectedReviewId: string | null;
  selectedRepoId: string | null;
  sidebarOpen: boolean;
  isAuthenticated: boolean;
  user: { login: string; avatarUrl: string } | null;

  setView: (view: PageView) => void;
  selectReview: (id: string) => void;
  selectRepo: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  login: (user: { login: string; avatarUrl: string }) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedReviewId: null,
  selectedRepoId: null,
  sidebarOpen: true,
  isAuthenticated: false,
  user: null,

  setView: (view) => set({ currentView: view, selectedReviewId: null, selectedRepoId: null }),
  selectReview: (id) => set({ currentView: 'review-detail', selectedReviewId: id }),
  selectRepo: (id) => set({ selectedRepoId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  login: (user) => set({ isAuthenticated: true, user, currentView: 'dashboard' }),
  logout: () => set({ isAuthenticated: false, user: null, currentView: 'landing', sidebarOpen: true }),
}));
