'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/lib/store';
import { Shield, Sparkles, Coins, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export function LevelUpCinematic() {
  const { levelUpModalOpen, levelUpData, closeLevelUpModal } = useGameStore();

  useEffect(() => {
    if (levelUpModalOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#A88952', '#C8A668', '#E7E1D5', '#7F2525'],
        });
      } catch {
        // Fallback
      }
    }
  }, [levelUpModalOpen]);

  if (!levelUpModalOpen || !levelUpData) return null;

  const gold = levelUpData.bonusGold || 200;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative max-w-lg w-full bg-charcoal border-2 border-gold rounded-sm p-6 sm:p-8 text-center shadow-gold">
        {/* Glow & Vignette */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gold/30 rounded-full blur-2xl pointer-events-none" />

        {/* Level Up Emblem */}
        <div className="mx-auto w-24 h-24 bg-noir border-2 border-gold rounded-full overflow-hidden flex items-center justify-center text-gold shadow-gold mb-4">
          <Image
            src="/logo.png"
            alt="QuestChase Bureau Emblem"
            width={96}
            height={96}
            className="w-full h-full object-cover animate-pulse"
            priority
          />
        </div>

        <div className="text-xs font-cinematic font-bold tracking-widest text-crimson-bright uppercase mb-1">
          BUREAU COMMENDATION & ADVANCEMENT
        </div>

        <h2 className="text-3xl sm:text-4xl font-cinematic font-black text-parchment tracking-wider mb-2">
          LEVEL {levelUpData.newLevel} ATTAINED
        </h2>

        <div className="inline-block bg-gold/15 border border-gold text-gold font-cinematic font-bold text-sm px-4 py-1 rounded mb-6 tracking-widest">
          {levelUpData.unlockedTitle}
        </div>

        {/* Progression Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-noir/80 border border-steel/30 p-3 rounded text-left">
            <div className="text-[10px] text-parchment-dim typewriter-text">PREVIOUS CLEARANCE</div>
            <div className="text-sm font-cinematic text-steel-light font-bold">
              LEVEL {levelUpData.oldLevel} • {levelUpData.oldRank}
            </div>
          </div>
          <div className="bg-noir/80 border border-gold/40 p-3 rounded text-left">
            <div className="text-[10px] text-gold typewriter-text">NEW AUTHORIZATION</div>
            <div className="text-sm font-cinematic text-parchment font-bold">
              LEVEL {levelUpData.newLevel} • {levelUpData.newRank}
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-noir/90 border border-gold/30 rounded p-4 mb-6 flex items-center justify-around">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-gold" />
            <div className="text-left">
              <div className="text-[9px] text-parchment-dim typewriter-text">BONUS GOLD</div>
              <div className="text-base font-bold text-gold font-cinematic">
                +{gold} GOLD
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div className="text-left">
              <div className="text-[9px] text-parchment-dim typewriter-text">ALL ATTRIBUTES</div>
              <div className="text-base font-bold text-parchment font-cinematic">+1 PER STAT</div>
            </div>
          </div>
        </div>

        <button
          onClick={closeLevelUpModal}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-bright text-noir font-cinematic font-bold py-3.5 px-6 rounded-sm shadow-gold hover:opacity-95 transition tracking-widest text-sm uppercase"
        >
          <span>RETURN TO ACTIVE INVESTIGATION</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
