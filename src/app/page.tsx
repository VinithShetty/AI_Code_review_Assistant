'use client';

import { useAppStore } from '@/stores/appStore';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import HeroSection from '@/components/landing/HeroSection';
import DashboardView from '@/components/views/DashboardView';
import RepositoriesView from '@/components/views/RepositoriesView';
import ReviewsView from '@/components/views/ReviewsView';
import ReviewDetailView from '@/components/views/ReviewDetailView';
import AnalyticsView from '@/components/views/AnalyticsView';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const { currentView, isAuthenticated } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {!isAuthenticated ? (
          <HeroSection />
        ) : (
          <div className="flex h-[calc(100vh-4rem)]">
            <Sidebar />
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentView}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentView === 'dashboard' && <DashboardView />}
                    {currentView === 'repositories' && <RepositoriesView />}
                    {currentView === 'reviews' && <ReviewsView />}
                    {currentView === 'review-detail' && <ReviewDetailView />}
                    {currentView === 'analytics' && <AnalyticsView />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </main>
      {!isAuthenticated && (
        <footer className="border-t border-border/50 py-4 text-center text-sm text-muted-foreground mt-auto">
          © 2024 CodeReview AI — AI-Powered Code Review Assistant
        </footer>
      )}
    </div>
  );
}
