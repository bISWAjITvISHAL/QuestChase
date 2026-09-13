'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/lib/store';
import { DetectiveHUD } from './DetectiveHUD';
import { CommandBar } from './CommandBar';
import { LevelUpCinematic } from './LevelUpCinematic';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CaseSolvedCinematic } from '@/components/ui/CaseSolvedCinematic';
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
      <div className="min-h-screen bg-[#07080a] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-vignette pointer-events-none" />
        <div className="max-w-md w-full bg-[#111215] border-2 border-gold/40 p-8 rounded shadow-2xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />
          
          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-gold/60 flex items-center justify-center bg-noir text-gold shadow-gold">
            <Image
              src="/logo.png"
              alt="QuestChase Bureau Emblem"
              width={64}
              height={64}
              className="w-full h-full object-cover animate-pulse"
              priority
            />
          </div>

          <div>
            <div className="text-[10px] font-cinematic font-bold tracking-[0.3em] text-gold uppercase mb-1">
              METROPOLITAN INVESTIGATION BUREAU
            </div>
            <h2 className="text-xl font-cinematic font-black text-parchment tracking-wide">
              CLEARANCE AUTHENTICATION
            </h2>
            <p className="text-xs text-parchment-dim typewriter-text mt-2 leading-relaxed">
              Synchronizing encrypted detective dossier, casework ledgers, and ballistic logs with central archives...
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="w-full h-2 bg-[#1b1d22] rounded-full overflow-hidden border border-steel/40 skeleton-shimmer">
              <div className="h-full bg-gradient-to-r from-gold/40 via-gold to-gold/40 animate-pulse" style={{ width: '75%' }} />
            </div>
            <div className="flex justify-between items-center text-[9px] text-steel font-mono tracking-widest uppercase">
              <span>CIPHER: AES-256</span>
              <span className="text-gold animate-pulse">DECRYPTING ARCHIVES</span>
            </div>
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
      <CaseSolvedCinematic />
      <ToastContainer />
    </div>
  );
}
