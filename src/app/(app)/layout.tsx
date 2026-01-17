import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}