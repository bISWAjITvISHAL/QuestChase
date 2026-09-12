'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { DetectiveHUD } from './DetectiveHUD';
import { CommandBar } from './CommandBar';
import { LevelUpCinematic } from './LevelUpCinematic';
import { soundEngine } from '@/lib/soundEngine';

export function GameShell({ children }: { children: React.ReactNode }) {
  const { initGame } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initGame();
    setMounted(true);

    const handleFirstUserGesture = () => {
      soundEngine.init();
      window.removeEventListener('click', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
    };

    window.addEventListener('click', handleFirstUserGesture);
    window.addEventListener('keydown', handleFirstUserGesture);

    return () => {
      window.removeEventListener('click', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
    };
  }, [initGame]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-noir flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-xs font-cinematic text-gold tracking-widest uppercase mb-2 animate-pulse">
            INITIALIZING CASEFILE...
          </div>
          <div className="w-48 h-1 bg-charcoal mx-auto rounded overflow-hidden">
            <div className="w-full h-full bg-gold animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir text-parchment relative selection:bg-gold selection:text-noir">
      <DetectiveHUD />
      <main className="pt-20 pb-24 md:pb-20 px-3 sm:px-6 max-w-7xl mx-auto min-h-[calc(100vh-5rem)] flex flex-col">
        {children}
      </main>
      <CommandBar />
      <LevelUpCinematic />
    </div>
  );
}
