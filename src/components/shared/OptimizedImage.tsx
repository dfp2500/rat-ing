'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  aspectRatio?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback,
  aspectRatio = '2/3',
  priority = false,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted',
          className
        )}
        style={{ aspectRatio }}
      >
        {fallback || (
          <div className="text-muted-foreground text-xs text-center p-4">
            Sin imagen
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ aspectRatio }}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}