import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { AppHeader } from '@/components/shared/AppHeader';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
    </ProtectedRoute>
  );
}