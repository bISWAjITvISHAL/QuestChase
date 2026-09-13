'use client';

import React from 'react';
import { GameShell } from '@/components/layout/GameShell';
import { useGameStore } from '@/lib/store';
import { AchievementCardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import {
  Award,
  CheckCircle,
  Briefcase,
  Eye,
  Flame,
  Share2,
  Brain,
  Cpu,
  Moon,
  Shield,
  Package,
  Users,
  Lock,
  Zap,
  Crown,
  Sparkles,
  Coins,
} from 'lucide-react';

const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  CheckCircle,
  Briefcase,
  Eye,
  Flame,
  Share2,
  Brain,
  Award,
  Cpu,
  Moon,
  Shield,
  Package,
  Users,
  Lock,
  Zap,
  Crown,
};

export default function AchievementsPage() {
  const { achievements, isLoading, isInitialized } = useGameStore();

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const progressPercent = Math.round((unlockedCount / (achievements.length || 1)) * 100);

  return (
    <GameShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-steel/30 pb-4">
          <div>
            <div className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase">
              BUREAU COMMENDATIONS & MEDALS
            </div>
            <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wide">
              INVESTIGATIVE HONORS
            </h1>
            <p className="text-xs text-parchment-dim typewriter-text mt-1">
              Distinguished medals awarded for exemplary deduction, productivity consistency, and forensic mastery.
            </p>
          </div>

          {/* Master Progress */}
          <div className="bg-charcoal border border-gold/40 rounded px-4 py-2 self-start sm:self-auto shadow-noir">
            <div className="flex items-center justify-between gap-4 text-xs font-cinematic">
              <span className="text-gold font-bold">MEDALS UNLOCKED:</span>
              <span className="text-parchment font-bold">
                {unlockedCount} / {achievements.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-36 h-1.5 bg-noir rounded-full overflow-hidden mt-1.5 border border-steel/40">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-bright transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        {isLoading || !isInitialized ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <AchievementCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const Icon = ACHIEVEMENT_ICONS[ach.icon] || Award;
            const percent = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));
            const gold = ach.rewardGold || 50;

            return (
              <div
                key={ach.id}
                className={`parchment-card rounded-sm p-4 flex flex-col justify-between transition-all duration-300 ${
                  ach.isUnlocked
                    ? 'border-gold/60 bg-charcoal/90 shadow-gold'
                    : 'border-steel/30 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div
                      className={`p-2 rounded border ${
                        ach.isUnlocked
                          ? 'bg-noir border-gold text-gold shadow-gold'
                          : 'bg-noir/40 border-steel/30 text-steel'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <span
                      className={`text-[9px] font-cinematic font-bold px-2 py-0.5 rounded border ${
                        ach.isUnlocked
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40'
                          : 'text-parchment-dim bg-noir border-steel/40'
                      }`}
                    >
                      {ach.isUnlocked ? 'DECORATION AWARDED' : `${ach.category}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-cinematic font-bold text-parchment mb-1">
                    {ach.title}
                  </h3>

                  <p className="text-[11px] text-parchment-dim typewriter-text mb-3">
                    {ach.description}
                  </p>
                </div>

                <div>
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[9px] text-parchment-dim typewriter-text mb-0.5">
                      <span>PROGRESS</span>
                      <span>
                        {ach.progress} / {ach.maxProgress}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-noir rounded-full overflow-hidden border border-steel/30">
                      <div
                        className={`h-full transition-all duration-500 ${
                          ach.isUnlocked ? 'bg-gold' : 'bg-steel'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Rewards Footer */}
                  <div className="flex items-center justify-between text-[10px] typewriter-text text-parchment-dim border-t border-steel/20 pt-2">
                    <span>COMMENDATION:</span>
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-gold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" /> +{ach.rewardXp} XP
                      </span>
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Coins className="w-3 h-3" /> +{gold} GOLD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </GameShell>
  );
}
