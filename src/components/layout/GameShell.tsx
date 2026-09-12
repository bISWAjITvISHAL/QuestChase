'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { DetectiveHUD } from './DetectiveHUD';
import { CommandBar } from './CommandBar';
import { LevelUpCinematic } from './LevelUpCinematic';
import { soundEngine } from '@/lib/soundEngine';

export function GameShell({ children }: { children: React.ReactNode }) {
  const { initGame, isInitialized, isLoading } = useGameStore();
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

  if (!mounted || (!isInitialized && isLoading)) {
    return (
      <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-[#111215] border border-gold/40 p-8 rounded shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />
          <div className="text-[10px] font-cinematic font-bold tracking-[0.3em] text-gold uppercase mb-2">
            METROPOLITAN INVESTIGATION BUREAU
          </div>
          <h2 className="text-xl font-cinematic font-black text-parchment tracking-wide mb-3">
            CLEARANCE AUTHENTICATION
          </h2>
          <p className="text-xs text-parchment-dim typewriter-text mb-6 leading-relaxed">
            Synchronizing encrypted detective dossier, casework ledgers, and ballistic logs with central archives...
          </p>
          <div className="w-56 h-1.5 bg-[#1b1d22] mx-auto rounded-full overflow-hidden border border-steel/40">
            <div className="w-full h-full bg-gradient-to-r from-gold/50 via-gold to-gold/50 animate-pulse" />
          </div>
          <div className="mt-4 text-[9px] text-steel font-mono tracking-widest uppercase">
            STATUS: RESTRICTED ACCESS • BADGE VERIFICATION
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
