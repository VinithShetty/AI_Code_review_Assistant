'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';

/**
 * Bridges the real NextAuth (GitHub OAuth) session into the app's Zustand
 * store, so the existing UI — which reads `isAuthenticated` / `user` from the
 * store — reflects the real signed-in GitHub user instead of the old mock.
 */
function SessionSync() {
  const { status, data: session } = useSession();

  useEffect(() => {
    const store = useAppStore.getState();
    if (status === 'authenticated' && session?.user && !store.isAuthenticated) {
      const u = session.user as {
        login?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      };
      store.login({
        login: u.login ?? u.name ?? u.email ?? 'GitHub User',
        avatarUrl: u.image ?? '',
      });
    } else if (status === 'unauthenticated' && store.isAuthenticated) {
      store.logout();
    }
  }, [status, session]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync />
      {children}
    </SessionProvider>
  );
}
