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
  Fingerprint,
  FileSearch,
  Crosshair,
  Medal,
} from 'lucide-react';
import { RANKS } from '@/lib/initialData';

export default function CharacterProfilePage() {
  const { profile, cases, tasks, achievements } = useGameStore();

  const gold = profile.gold || 0;
  const currentRankInfo = RANKS.find((r) => r.rank === profile.rank) || RANKS[0];
  const nextRank = RANKS.find((r) => r.minLevel > profile.level);

  const solvedCases = cases.filter((c) => c.status === 'SOLVED');
  const totalEvidenceCount = cases.reduce(
    (acc, c) => acc + c.evidence.filter((e) => e.isDiscovered).length,
    0
  );

  const attributes = [
    {
      name: 'INTELLIGENCE',
      level: profile.attributes.intelligence || 3,
      domain: 'CYBER & FORENSICS',
      desc: 'Powers encrypted digital forensics, cipher cracking, deleted records recovery, and timeline reconciliation.',
      icon: Brain,
      border: 'border-steel/40 hover:border-gold',
    },
    {
      name: 'PERCEPTION',
      level: profile.attributes.perception || 3,
      domain: 'CRIME SCENE SWEEP',
      desc: 'Powers physical search sweeps, microscopic trace evidence, fingerprint lift accuracy, and hidden compartment detection.',
      icon: Eye,
      border: 'border-steel/40 hover:border-gold',
    },
    {
      name: 'DISCIPLINE',
      level: profile.attributes.discipline || 2,
      domain: 'DUE DILIGENCE',
      desc: 'Powers systematic casework habits, cross-referencing registries, meticulous record-keeping, and audit trails.',
      icon: Sparkles,
      border: 'border-steel/40 hover:border-gold',
    },
    {
      name: 'RESILIENCE',
      level: profile.attributes.resilience || 2,
      domain: 'TRIBUNAL PRESSURE',
      desc: 'Powers adversarial interrogation composure, stamina during late-night stakeouts, and resistance to red herrings.',
      icon: Shield,
      border: 'border-steel/40 hover:border-gold',
    },
  ];

  return (
    <GameShell>
      <div className="space-y-6">
        {/* Profile Header Dossier */}
        <div className="bg-[#121316] border-2 border-gold/40 rounded p-6 sm:p-8 shadow-dossier relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              {/* Metallic Badge Emblem */}
              <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-b from-[#1e2025] to-[#0c0d0f] border-2 border-gold rounded-full text-gold shadow-gold shrink-0">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-gold filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                <span className="absolute -bottom-1 bg-crimson text-parchment text-[10px] font-cinematic font-black px-2 py-0.5 rounded border border-gold/60 shadow-crimson tracking-wider">
                  LVL {profile.level}
                </span>
              </div>

              <div>
                <div className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase mb-1">
                  METROPOLITAN BUREAU OF INVESTIGATION • BADGE #{profile.badgeId}
                </div>
                <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wide">
                  {profile.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                  <span className="text-xs bg-gold/15 text-gold px-3 py-1 rounded border border-gold/40 font-cinematic font-bold tracking-wider">
                    {profile.rank}
                  </span>
                  <span className="text-xs text-parchment-dim typewriter-text">
                    "{currentRankInfo.title}"
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats badges */}
            <div className="flex items-center gap-3 self-stretch md:self-auto justify-around bg-[#0a0b0d] border border-steel/30 rounded p-3.5 text-center shadow-inner">
              <div className="px-3">
                <div className="text-[9px] text-steel typewriter-text uppercase">GOLD CURRENCY</div>
                <div className="text-base font-cinematic font-bold text-gold flex items-center justify-center gap-1 mt-0.5">
                  <Coins className="w-4 h-4 text-gold" /> {gold}
                </div>
              </div>
              <div className="h-7 w-px bg-steel/25" />
              <div className="px-3">
                <div className="text-[9px] text-steel typewriter-text uppercase">INVESTIGATIVE STREAK</div>
                <div className="text-base font-cinematic font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                  <Flame className="w-4 h-4 text-amber-400" /> {profile.streak} DAYS
                </div>
              </div>
              <div className="h-7 w-px bg-steel/25" />
              <div className="px-3">
                <div className="text-[9px] text-steel typewriter-text uppercase">CASES CLOSED</div>
                <div className="text-base font-cinematic font-bold text-emerald-400 mt-0.5">
                  {solvedCases.length} / {cases.length}
                </div>
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mt-6 pt-4 border-t border-steel/20">
            <div className="flex items-center justify-between text-xs typewriter-text mb-1.5">
              <span className="text-steel">
                CURRENT RANK PROGRESSION: <strong className="text-parchment">{profile.xp} XP</strong>
              </span>
              <span className="text-gold">
                {nextRank ? `NEXT RANK: ${nextRank.rank} (LVL ${nextRank.minLevel})` : 'TOP CLEARANCE ACHIEVED'}
              </span>
            </div>
            <div className="w-full h-2 bg-[#090a0c] rounded-full overflow-hidden border border-steel/30">
              <div
                className="h-full bg-gradient-to-r from-gold via-gold-bright to-gold"
                style={{
                  width: `${Math.min(100, ((profile.xp % 1000) / 1000) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 4 Core Detective Attributes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-cinematic font-bold tracking-widest text-gold uppercase flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-gold" />
              <span>CORE DETECTIVE ATTRIBUTES & PROFICIENCIES</span>
            </div>
            <span className="text-[10px] typewriter-text text-steel">DERIVED FROM HABITUAL CASEWORK</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {attributes.map((attr) => {
              const Icon = attr.icon;
              return (
                <div
                  key={attr.name}
                  className={`bg-[#121316] border rounded p-5 shadow-dossier flex flex-col justify-between transition tactile-card ${attr.border}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded bg-[#0b0c0e] border border-gold/40 flex items-center justify-center text-gold">
                        <Icon className="w-5 h-5 text-gold" />
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-steel typewriter-text uppercase block">STAT LEVEL</span>
                        <span className="text-lg font-cinematic font-black text-gold">
                          LVL {attr.level}
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] font-cinematic font-bold text-crimson-bright tracking-wider uppercase mb-0.5">
                      {attr.domain}
                    </div>
                    <h3 className="text-sm font-cinematic font-bold text-parchment uppercase tracking-wider mb-1.5">
                      {attr.name}
                    </h3>
                    <p className="text-xs text-parchment-dim typewriter-text leading-relaxed">
                      {attr.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-steel/20">
                    <div className="flex items-center justify-between text-[9px] typewriter-text text-steel mb-1">
                      <span>MASTERY</span>
                      <span className="text-parchment font-bold">{Math.min(100, attr.level * 10)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#090a0c] rounded-full overflow-hidden border border-steel/30">
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

        {/* Bureau Badges & Medals Showcase */}
        <div className="bg-[#121316] border border-steel/30 rounded p-5 shadow-dossier">
          <div className="flex items-center justify-between mb-3 border-b border-steel/20 pb-2">
            <div className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase tracking-wider flex items-center gap-1.5">
              <Medal className="w-3.5 h-3.5" />
              <span>HONORS, COMMENDATIONS & MEDALS</span>
            </div>
            <span className="text-[10px] typewriter-text text-steel">
              TOTAL EARNED: {achievements.filter((a) => a.isUnlocked).length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Blackwood Master Seal */}
            <div
              className={`p-3.5 rounded border transition tactile-card ${
                solvedCases.some((c) => c.id === 'case_001')
                  ? 'bg-noir border-gold shadow-gold'
                  : 'bg-[#0a0b0d] border-steel/20 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#18191c] border border-gold/50 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <div className="text-xs font-cinematic font-bold text-parchment">
                    Blackwood Master Seal
                  </div>
                  <div className="text-[10px] typewriter-text text-steel">
                    {solvedCases.some((c) => c.id === 'case_001') ? 'COMMENDED • CASE CLOSED' : 'UNEARNED • CASE #001 PENDING'}
                  </div>
                </div>
              </div>
            </div>

            {/* Louvre Blue Star Seal */}
            <div
              className={`p-3.5 rounded border transition tactile-card ${
                solvedCases.some((c) => c.id === 'case_002')
                  ? 'bg-noir border-gold shadow-gold'
                  : 'bg-[#0a0b0d] border-steel/20 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#18191c] border border-steel/40 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-steel" />
                </div>
                <div>
                  <div className="text-xs font-cinematic font-bold text-parchment">
                    Midnight Vanguard Ribbon
                  </div>
                  <div className="text-[10px] typewriter-text text-steel">
                    {solvedCases.some((c) => c.id === 'case_002') ? 'COMMENDED • CASE CLOSED' : 'UNEARNED • CASE #002 PENDING'}
                  </div>
                </div>
              </div>
            </div>

            {/* Forensics Expert */}
            <div
              className={`p-3.5 rounded border transition tactile-card ${
                totalEvidenceCount >= 6
                  ? 'bg-noir border-gold shadow-gold'
                  : 'bg-[#0a0b0d] border-steel/20 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#18191c] border border-gold/40 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <div className="text-xs font-cinematic font-bold text-parchment">
                    Forensic Specialist Seal
                  </div>
                  <div className="text-[10px] typewriter-text text-steel">
                    {totalEvidenceCount >= 6 ? 'AWARDED • 6+ CLUES LOGGED' : `PROGRESS: ${totalEvidenceCount}/6 CLUES`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bureau Clearance & Promotion Track */}
        <div className="bg-[#121316] border border-steel/30 rounded p-5 shadow-dossier">
          <div className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase mb-1">
            BUREAU HIERARCHY
          </div>
          <h2 className="text-lg font-cinematic font-bold text-parchment mb-4">
            DETECTIVE COMMISSION PROGRESSION TRACK
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {RANKS.map((rk) => {
              const isCurrent = profile.rank === rk.rank;
              const isUnlocked = profile.level >= rk.minLevel;

              return (
                <div
                  key={rk.rank}
                  className={`p-3 rounded border text-center transition tactile-card ${
                    isCurrent
                      ? 'bg-gold/15 border-gold text-parchment shadow-gold ring-1 ring-gold/50'
                      : isUnlocked
                      ? 'bg-[#0b0c0e] border-steel/40 text-parchment-dim'
                      : 'bg-[#090a0c] border-steel/15 text-steel opacity-40'
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
