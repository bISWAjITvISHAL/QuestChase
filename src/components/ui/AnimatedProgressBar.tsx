'use client';

import React from 'react';

interface AnimatedProgressBarProps {
  percentage: number;
  className?: string;
  barClassName?: string;
  height?: string;
  ariaLabel?: string;
}

export function AnimatedProgressBar({
  percentage,
  className = '',
  barClassName = 'bg-gradient-to-r from-gold via-gold-bright to-gold shadow-gold',
  height = 'h-1.5',
  ariaLabel = 'Progress Bar',
}: AnimatedProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full bg-[#0b0c0e] border border-steel/30 rounded-full overflow-hidden relative ${height} ${className}`}
    >
      <div
        className={`h-full transition-all duration-700 ease-out rounded-full ${barClassName}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
