'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { signOut } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bienvenido, {user?.email}
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Cerrar sesión
          </Button>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">
            🎉 Autenticación funcionando
          </h2>
          <div className="space-y-2 text-sm">
            <p>✓ Usuario autenticado: {user?.email}</p>
            <p>✓ UID: {user?.uid}</p>
            <p>✓ Acceso autorizado</p>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-6">
          <p className="text-sm text-muted-foreground">
            Esta es una página protegida. Solo usuarios autenticados y
            autorizados pueden verla.
          </p>
        </div>
      </div>
    </div>
  );
}