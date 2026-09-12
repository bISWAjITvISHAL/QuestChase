'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { ToastNotification } from '@/lib/types';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Coins,
  X,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ToastContainer() {
  const { toasts, removeToast, achievementQueue, dequeueAchievement } = useGameStore();
  const [activeAchievement, setActiveAchievement] = useState<any>(null);

  // Sequential Achievement Queue processing
  useEffect(() => {
    if (!activeAchievement && achievementQueue.length > 0) {
      const nextAch = achievementQueue[0];
      dequeueAchievement();
      setActiveAchievement(nextAch);

      const timer = setTimeout(() => {
        setActiveAchievement(null);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [activeAchievement, achievementQueue, dequeueAchievement]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between p-4 sm:p-6 overflow-hidden"
    >
      {/* Top Right: Standard Toasts (Success, Error, Info, Reward) */}
      <div className="flex flex-col items-end gap-2.5 max-w-sm w-full ml-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`pointer-events-auto w-full p-3.5 rounded border shadow-dossier backdrop-blur-md flex items-start gap-3 select-none ${
                toast.type === 'success'
                  ? 'bg-[#0e1713]/95 border-emerald-500/60 text-parchment'
                  : toast.type === 'error'
                  ? 'bg-[#1a0e0e]/95 border-crimson/80 text-parchment'
                  : toast.type === 'reward'
                  ? 'bg-[#17140e]/95 border-gold/70 text-parchment'
                  : 'bg-[#121316]/95 border-steel/50 text-parchment'
              }`}
            >
              {/* Icon */}
              <div className="shrink-0 pt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-crimson-bright" />}
                {toast.type === 'reward' && <Sparkles className="w-4 h-4 text-gold-bright animate-pulse" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-cinematic font-bold tracking-wide uppercase truncate">
                    {toast.title}
                  </h4>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-steel hover:text-parchment p-0.5 transition"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {toast.message && (
                  <p className="text-[11px] typewriter-text text-parchment-dim mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                )}

                {/* Reward Yield pills */}
                {(toast.xpReward || toast.goldReward) && (
                  <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-steel/20 text-[10px] font-cinematic font-bold">
                    {toast.xpReward && (
                      <span className="text-gold flex items-center gap-0.5">
                        +{toast.xpReward} XP
                      </span>
                    )}
                    {toast.goldReward && (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        +{toast.goldReward} <Coins className="w-3 h-3 text-amber-400" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Right / Bottom Center: Queued Achievement Unlock Toast */}
      <div className="flex justify-end w-full">
        <AnimatePresence>
          {activeAchievement && (
            <motion.div
              key={activeAchievement.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="pointer-events-auto max-w-sm w-full bg-[#161310]/95 border-2 border-gold rounded-sm p-4 shadow-gold backdrop-blur-md relative overflow-hidden"
            >
              {/* Shimmer line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-noir border-2 border-gold flex items-center justify-center text-gold shadow-gold shrink-0">
                  <Award className="w-5 h-5 text-gold animate-bounce" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-cinematic font-black text-crimson-bright tracking-widest uppercase">
                      🏆 COMMENDATION UNLOCKED
                    </span>
                    <button
                      onClick={() => setActiveAchievement(null)}
                      className="text-steel hover:text-parchment p-0.5 transition"
                      aria-label="Dismiss achievement"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-cinematic font-black text-parchment tracking-wide mt-0.5 truncate">
                    {activeAchievement.title}
                  </h3>

                  <p className="text-[10px] typewriter-text text-parchment-dim mt-0.5 line-clamp-2 leading-relaxed">
                    {activeAchievement.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 pt-1.5 border-t border-gold/20 text-[10px] font-cinematic font-bold">
                    <span className="text-gold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-gold" /> +{activeAchievement.rewardXp} XP
                    </span>
                    {activeAchievement.rewardGold && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-400" /> +{activeAchievement.rewardGold} GOLD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
