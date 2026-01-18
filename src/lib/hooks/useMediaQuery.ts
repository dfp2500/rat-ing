'use client';

import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  // Definimos la suscripción fuera del render para evitar recrearla
  const subscribe = (callback: () => void) => {
    const matchMedia = window.matchMedia(query);
    matchMedia.addEventListener('change', callback);
    return () => matchMedia.removeEventListener('change', callback);
  };

  // Leemos el valor del cliente
  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  // Valor para el servidor (SSR) para evitar errores de hidratación
  const getServerSnapshot = () => {
    return false; // O el valor por defecto que prefieras para móvil/escritorio
  };

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

// Breakpoints helpers
export function useIsMobile() {
  return useMediaQuery('(max-width: 640px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1025px)');
}