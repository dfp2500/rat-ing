// src/app/(app)/layout.tsx
import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { AppHeader } from '@/components/shared/AppHeader';
import { WelcomeDialog } from '@/components/user/WelcomeDialog';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
        <WelcomeDialog />
      </div>
    </ProtectedRoute>
  );
}