'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { CheckCircle2, ShieldCheck, Sparkles, Coins, ArrowRight, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export function CaseSolvedCinematic() {
  const { caseSolvedModalOpen, solvedCaseData, closeCaseSolvedModal } = useGameStore();

  useEffect(() => {
    if (caseSolvedModalOpen) {
      try {
        // Multi-stage celebratory gold & crimson confetti
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#A88952', '#C8A668', '#E7E1D5', '#9E2A2B'],
        });

        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#A88952', '#E7E1D5'],
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#9E2A2B', '#C8A668'],
          });
        }, 400);
      } catch {
        // Fallback gracefully if canvas is unavailable
      }
    }
  }, [caseSolvedModalOpen]);

  if (!caseSolvedModalOpen || !solvedCaseData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/95 backdrop-blur-2xl p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="relative max-w-xl w-full bg-[#141210] border-2 border-gold rounded-sm p-6 sm:p-10 text-center shadow-gold overflow-hidden"
        >
          {/* Ambient Lighting */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gold/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-crimson/20 rounded-full blur-3xl pointer-events-none" />

          {/* Golden Seal Emblem */}
          <div className="mx-auto w-24 h-24 bg-noir border-4 border-gold rounded-full flex items-center justify-center text-gold shadow-gold mb-5 relative">
            <ShieldCheck className="w-12 h-12 text-gold animate-pulse" />
            <div className="absolute -bottom-2 bg-crimson text-parchment text-[10px] font-cinematic font-black px-2.5 py-0.5 rounded border border-gold uppercase tracking-wider shadow-crimson">
              VERDICT VERIFIED
            </div>
          </div>

          <div className="text-xs font-cinematic font-bold tracking-[0.25em] text-gold-bright uppercase mb-1">
            METROPOLITAN INVESTIGATION BUREAU • SPECIAL COMMENDATION
          </div>

          <h1 className="text-3xl sm:text-5xl font-cinematic font-black text-parchment tracking-wide mb-2">
            CASE SOLVED
          </h1>

          <div className="text-base sm:text-lg font-cinematic font-bold text-parchment-dim uppercase tracking-wider mb-6">
            {solvedCaseData.title}
          </div>

          {/* Feedback or summary */}
          <div className="bg-noir/80 border border-gold/30 rounded p-4 mb-6 text-xs typewriter-text text-parchment leading-relaxed text-left">
            <span className="text-gold font-bold block mb-1 font-cinematic tracking-wider">
              TRIBUNAL RULING:
            </span>
            {solvedCaseData.feedback}
          </div>

          {/* Rewards Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-noir/90 border border-gold/40 rounded p-3 flex items-center gap-3 text-left">
              <Sparkles className="w-6 h-6 text-gold shrink-0" />
              <div>
                <div className="text-[10px] text-parchment-dim typewriter-text">COMMENDATION XP</div>
                <div className="text-lg font-cinematic font-black text-gold">
                  +{solvedCaseData.rewardXp} XP
                </div>
              </div>
            </div>

            <div className="bg-noir/90 border border-gold/40 rounded p-3 flex items-center gap-3 text-left">
              <Coins className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-parchment-dim typewriter-text">BOUNTY REWARD</div>
                <div className="text-lg font-cinematic font-black text-amber-400">
                  +{solvedCaseData.rewardGold} GOLD
                </div>
              </div>
            </div>
          </div>

          {/* Return Action */}
          <button
            onClick={closeCaseSolvedModal}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold via-gold-bright to-gold hover:opacity-95 text-noir font-cinematic font-black py-4 px-6 rounded-sm shadow-gold transition active:scale-95 tracking-widest text-sm uppercase cursor-pointer"
          >
            <span>RETURN TO DETECTIVE&apos;S DESK</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
