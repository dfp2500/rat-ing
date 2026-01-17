'use client';

import { auth, db } from '@/lib/firebase/config';

export default function Home() {
  // Verificar directamente si Firebase está inicializado
  const firebaseStatus = {
    auth: !!auth,
    firestore: !!db,
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Rat-Ing</h1>
        <p className="text-muted-foreground">Movie Rating Tracker</p>

        <div className="mt-8 space-y-2">
          <p className="text-sm font-semibold">Estado de Firebase:</p>
          <div className="flex gap-4 justify-center">
            <div
              className={`px-4 py-2 rounded ${
                firebaseStatus.auth
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : 'bg-red-500/20 text-red-700 dark:text-red-400'
              }`}
            >
              Auth: {firebaseStatus.auth ? '✓' : '✗'}
            </div>
            <div
              className={`px-4 py-2 rounded ${
                firebaseStatus.firestore
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : 'bg-red-500/20 text-red-700 dark:text-red-400'
              }`}
            >
              Firestore: {firebaseStatus.firestore ? '✓' : '✗'}
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          <p>✓ Fase 0.1 completada</p>
          <p>✓ Fase 0.2 completada</p>
        </div>
      </div>
    </main>
  );
}