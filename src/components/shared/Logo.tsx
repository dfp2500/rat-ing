'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 44, text: 'text-lg' },
    md: { icon: 52, text: 'text-xl' },
    lg: { icon: 380, text: 'text-2xl' },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo para Modo Claro (se oculta en dark) */}
      <Image
        src="/Rat-Ing-Logo-light.png" 
        alt="Rat-Ing Logo"
        width={currentSize.icon}
        height={currentSize.icon}
        className="object-contain dark:hidden"
      />

      {/* Logo para Modo Oscuro (oculto por defecto, se muestra en dark) */}
      <Image
        src="/Rat-Ing-Logo-dark.png" 
        alt="Rat-Ing Logo"
        width={currentSize.icon}
        height={currentSize.icon}
        className="hidden object-contain dark:block"
      />
      
      {showText && (
        <span className={`font-bold ${currentSize.text}`}>
          Rat-Ing
        </span>
      )}
    </div>
  );
}