import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const COLLAPSED_HEIGHT = 112; 

  useEffect(() => {
    const timer = setTimeout(() => {
      if (contentRef.current) {
        const realHeight = contentRef.current.scrollHeight;
        setContentHeight(realHeight);
        setShouldShowButton(realHeight > COLLAPSED_HEIGHT);
        setIsMeasuring(false);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [text]);

  // Definimos el estilo con el tipo correcto para TypeScript
  const containerStyle: React.CSSProperties = isMeasuring 
    ? { visibility: 'hidden', position: 'absolute', opacity: 0 } 
    : { maxHeight: isExpanded ? `${contentHeight}px` : `${COLLAPSED_HEIGHT}px` };

  return (
    <div className="space-y-1">
      <div className="relative overflow-hidden">
        <p 
          ref={contentRef}
          style={containerStyle}
          className={`text-muted-foreground whitespace-pre-line transition-[max-height] duration-500 ease-in-out ${
            !isExpanded && !isMeasuring ? 'overflow-hidden' : ''
          }`}
        >
          {text}
        </p>

        {shouldShowButton && !isExpanded && !isMeasuring && (
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none transition-opacity duration-500" />
        )}
      </div>
      
      {shouldShowButton && !isMeasuring && (
        <div className="flex justify-center pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            {isExpanded ? (
              <>
                Mostrar menos <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                Leer descripción completa <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}