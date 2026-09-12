'use client';

import React, { useState, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface AnimatedButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: 'gold' | 'crimson' | 'charcoal' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  preventDoubleClick?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = 'gold',
      size = 'md',
      loading = false,
      loadingText,
      disabled = false,
      onClick,
      className = '',
      preventDoubleClick = true,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const [internalPending, setInternalPending] = useState(false);

    const isBusy = loading || internalPending;
    const isDisabled = disabled || isBusy;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        e.preventDefault();
        return;
      }

      if (preventDoubleClick && type !== 'submit') {
        setInternalPending(true);
      }

      try {
        if (onClick) {
          const result = onClick(e);
          if (result && typeof (result as Promise<unknown>).then === 'function') {
            await result;
          }
        }
      } finally {
        if (preventDoubleClick && type !== 'submit') {
          // Keep button locked briefly to prevent rapid duplicate clicks
          setTimeout(() => {
            setInternalPending(false);
          }, 350);
        }
      }
    };

    // Variant color mappings adhering to QuestChase detective noir theme
    const variantStyles = {
      gold: 'bg-gradient-to-r from-gold via-gold-bright to-gold text-noir font-cinematic font-black shadow-gold hover:opacity-95 active:scale-[0.97]',
      crimson:
        'bg-gradient-to-r from-crimson via-crimson-bright to-crimson text-parchment font-cinematic font-black shadow-crimson hover:opacity-95 active:scale-[0.97]',
      charcoal:
        'bg-[#18191c] hover:bg-[#222429] text-parchment border border-steel/40 hover:border-gold/60 active:scale-[0.97]',
      emerald:
        'bg-gradient-to-r from-emerald-700 to-emerald-600 text-parchment font-cinematic font-bold shadow-md hover:opacity-95 active:scale-[0.97]',
      ghost:
        'bg-transparent text-parchment-dim hover:text-parchment hover:bg-noir/60 active:scale-[0.97]',
    };

    // Size mappings ensuring >= 44px touch targets on mobile
    const sizeStyles = {
      sm: 'text-xs py-2 px-3.5 min-h-[38px] sm:min-h-[36px]',
      md: 'text-xs sm:text-sm py-2.5 px-4 min-h-[44px]',
      lg: 'text-sm sm:text-base py-3.5 px-6 min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isBusy}
        aria-disabled={isDisabled}
        onClick={handleClick}
        className={`
          relative inline-flex items-center justify-center gap-2 rounded-sm select-none
          uppercase tracking-wider transition-all duration-150 ease-out cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
