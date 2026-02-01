'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  comment?: string;
  onCommentChange?: (comment: string) => void;
  disabled?: boolean;
  showComment?: boolean;
}

const RATING_LABELS = {
  1: 'Horrible',
  2: 'Muy mala',
  3: 'Mala',
  4: 'Regular',
  5: 'Pasable',
  6: 'Decente',
  7: 'Buena',
  8: 'Muy buena',
  9: 'Excelente',
  10: 'Obra maestra',
};

export function RatingInput({
  value,
  onChange,
  comment = '',
  onCommentChange,
  disabled = false,
  showComment = true,
}: RatingInputProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getRatingColor = (score: number) => {
    if (score <= 3) return 'text-destructive';
    if (score <= 5) return 'text-orange-500';
    if (score <= 7) return 'text-amber-500';
    if (score <= 8) return 'text-blue-500';
    return 'text-green-500';
  };

  const getRatingBgColor = (score: number) => {
    if (score <= 3) return 'bg-destructive/10';
    if (score <= 5) return 'bg-orange-500/10';
    if (score <= 7) return 'bg-amber-500/10';
    if (score <= 8) return 'bg-blue-500/10';
    return 'bg-green-500/10';
  };

  return (
    <div className="space-y-4">
      {/* Rating Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Puntuación</Label>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors",
            getRatingBgColor(value),
            getRatingColor(value)
          )}>
            <span className="text-lg">{value}</span>
            <span className="text-xs opacity-75">/ 10</span>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            disabled={disabled}
            className={cn(
              "w-full h-2 rounded-lg appearance-none cursor-pointer transition-all",
              "bg-gradient-to-r from-destructive via-amber-500 to-green-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:w-5",
              "[&::-webkit-slider-thumb]:h-5",
              "[&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:bg-background",
              "[&::-webkit-slider-thumb]:border-2",
              "[&::-webkit-slider-thumb]:border-primary",
              "[&::-webkit-slider-thumb]:cursor-pointer",
              "[&::-webkit-slider-thumb]:shadow-lg",
              "[&::-webkit-slider-thumb]:transition-transform",
              "[&::-webkit-slider-thumb]:hover:scale-110",
              "[&::-moz-range-thumb]:w-5",
              "[&::-moz-range-thumb]:h-5",
              "[&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:bg-background",
              "[&::-moz-range-thumb]:border-2",
              "[&::-moz-range-thumb]:border-primary",
              "[&::-moz-range-thumb]:cursor-pointer",
              "[&::-moz-range-thumb]:shadow-lg",
              "[&::-moz-range-thumb]:transition-transform",
              "[&::-moz-range-thumb]:hover:scale-110"
            )}
          />
          
          {/* Rating Label */}
          <p className={cn(
            "text-center text-sm font-medium transition-all",
            getRatingColor(value),
            isDragging && "scale-105"
          )}>
            {RATING_LABELS[value as keyof typeof RATING_LABELS]}
          </p>
        </div>

        {/* Number indicators */}
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              disabled={disabled}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                "hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
                value === num && cn(
                  "font-bold",
                  getRatingColor(num),
                  getRatingBgColor(num)
                )
              )}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Input */}
      {showComment && onCommentChange && (
        <div className="space-y-2">
          <Label htmlFor="comment">Comentario (opcional)</Label>
          <Input
            id="comment"
            placeholder="¿Qué te pareció?"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            disabled={disabled}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {comment.length} / 500
          </p>
        </div>
      )}
    </div>
  );
}