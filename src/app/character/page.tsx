'use client';

import React from 'react';
import { GameShell } from '@/components/layout/GameShell';
import { useGameStore } from '@/lib/store';
import {
  Shield,
  Coins,
  Flame,
  Award,
  Brain,
  Eye,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck,
} from 'lucide-react';
import { RANKS } from '@/lib/initialData';

export default function CharacterProfilePage() {
  const { profile, cases, tasks } = useGameStore();

  const gold = profile.gold || 0;
  const currentRankInfo = RANKS.find((r) => r.rank === profile.rank) || RANKS[0];
  const nextRank = RANKS.find((r) => r.minLevel > profile.level);

  const attributes = [
    {
      name: 'INTELLIGENCE',
      level: profile.attributes.intelligence || 3,
      desc: 'Powers digital forensics, cipher breaking, and timeline data recovery.',
      icon: Brain,
      color: 'text-blue-400',
    },
    {
      name: 'PERCEPTION',
      level: profile.attributes.perception || 3,
      desc: 'Powers physical crime scene searches, micro-clues, and fingerprint discovery.',
      icon: Eye,
      color: 'text-amber-400',
    },
    {
      name: 'DISCIPLINE',
      level: profile.attributes.discipline || 2,
      desc: 'Powers rigorous casework habits, routine diligence, and structured analysis.',
      icon: Sparkles,
      color: 'text-emerald-400',
    },
    {
      name: 'RESILIENCE',
      level: profile.attributes.resilience || 2,
      desc: 'Powers high-pressure interrogation composure, mental fortitude, and undercover endurance.',
      icon: Shield,
      color: 'text-purple-400',
    },
  ];

  return (
    <GameShell>
      <div className="space-y-6">
        {/* Profile Header Dossier */}
        <div className="bg-charcoal/90 border border-gold/40 rounded-sm p-6 sm:p-8 shadow-dossier relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-noir border-2 border-gold rounded-full text-gold shadow-gold">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
                <span className="absolute -bottom-1 -right-1 bg-crimson text-parchment text-[10px] font-cinematic font-bold px-2 py-0.5 rounded border border-gold/50">
                  LVL {profile.level}
                </span>
              </div>

              <div>
                <div className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase">
                  DETECTIVE PROFILE • {profile.badgeId}
                </div>
                <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wide">
                  {profile.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gold/20 text-gold px-2.5 py-0.5 rounded border border-gold/40 font-cinematic font-bold">
                    {profile.rank}
                  </span>
                  <span className="text-xs text-parchment-dim typewriter-text">
                    {currentRankInfo.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats badges */}
            <div className="flex items-center gap-3 self-stretch md:self-auto justify-around bg-noir/80 border border-steel/30 rounded p-3 text-center">
              <div className="px-2">
                <div className="text-[9px] text-parchment-dim typewriter-text">GOLD POOL</div>
                <div className="text-base font-cinematic font-bold text-gold flex items-center justify-center gap-1 mt-0.5">
                  <Coins className="w-3.5 h-3.5 text-gold" /> {gold}
                </div>
              </div>
              <div className="h-6 w-px bg-steel/30" />
              <div className="px-2">
                <div className="text-[9px] text-parchment-dim typewriter-text">STREAK</div>
                <div className="text-base font-cinematic font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5" /> {profile.streak} DAYS
                </div>
              </div>
              <div className="h-6 w-px bg-steel/30" />
              <div className="px-2">
                <div className="text-[9px] text-parchment-dim typewriter-text">CASEWORK</div>
                <div className="text-base font-cinematic font-bold text-emerald-400 mt-0.5">
                  {profile.tasksCompletedCount} SOLVED
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Detective Attributes */}
        <div>
          <div className="text-[11px] font-cinematic font-bold tracking-widest text-gold uppercase mb-3">
            DETECTIVE ATTRIBUTES & PROFICIENCIES
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {attributes.map((attr) => {
              const Icon = attr.icon;
              return (
                <div
                  key={attr.name}
                  className="bg-charcoal/90 border border-steel/30 rounded-sm p-5 shadow-noir flex flex-col justify-between hover:border-gold transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-noir border border-gold/40 flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${attr.color}`} />
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-parchment-dim typewriter-text block">STAT LEVEL</span>
                        <span className="text-lg font-cinematic font-black text-gold">
                          LVL {attr.level}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-cinematic font-bold text-parchment uppercase tracking-wider mb-1">
                      {attr.name}
                    </h3>
                    <p className="text-xs text-parchment-dim typewriter-text leading-relaxed">
                      {attr.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-steel/20">
                    <div className="w-full h-1.5 bg-noir rounded-full overflow-hidden border border-steel/40">
                      <div
                        className="h-full bg-gradient-to-r from-gold to-gold-bright"
                        style={{ width: `${Math.min(100, attr.level * 10)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bureau Clearance & Promotion Track */}
        <div className="bg-charcoal/80 border border-steel/30 rounded-sm p-5 shadow-noir">
          <div className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase mb-1">
            BUREAU HIERARCHY
          </div>
          <h2 className="text-lg font-cinematic font-bold text-parchment mb-4">
            DETECTIVE RANK PROGRESSION
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {RANKS.map((rk) => {
              const isCurrent = profile.rank === rk.rank;
              const isUnlocked = profile.level >= rk.minLevel;

              return (
                <div
                  key={rk.rank}
                  className={`p-3 rounded border text-center transition ${
                    isCurrent
                      ? 'bg-gold/20 border-gold text-parchment shadow-gold'
                      : isUnlocked
                      ? 'bg-noir border-steel/40 text-parchment-dim'
                      : 'bg-noir/40 border-steel/20 text-steel opacity-60'
                  }`}
                >
                  <div className="text-[9px] typewriter-text text-gold font-bold">
                    LVL {rk.minLevel}+
                  </div>
                  <div className="text-xs font-cinematic font-bold truncate mt-0.5">
                    {rk.rank}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
