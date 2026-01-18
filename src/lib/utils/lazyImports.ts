import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';

// Al usar 'function' en lugar de 'const = () =>', 
// TypeScript no confunde el genérico <T> con una etiqueta JSX.
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent?: ComponentType
) {
  return dynamic(importFn, {
    loading: LoadingComponent 
      ? () => React.createElement(LoadingComponent) // Forma más segura de renderizar dinámicamente
      : undefined,
    ssr: true,
  });
}

// Ejemplo de uso
export const LazyCharts = {
  DistributionChart: lazyLoad(
    () => import('@/components/stats/DistributionChart').then(mod => ({ default: mod.DistributionChart }))
  ),
  AgreementChart: lazyLoad(
    () => import('@/components/stats/AgreementChart').then(mod => ({ default: mod.AgreementChart }))
  ),
  EvolutionChart: lazyLoad(
    () => import('@/components/stats/EvolutionChart').then(mod => ({ default: mod.EvolutionChart }))
  ),
};