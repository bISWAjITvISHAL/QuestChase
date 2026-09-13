'use client';

import React from 'react';
import Image from 'next/image';
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
  Volume2,
  VolumeX,
  Radio,
  Sliders,
} from 'lucide-react';
import { RANKS, getRankForLevel, calculateXpForLevel } from '@/lib/initialData';
import { soundEngine } from '@/lib/soundEngine';

export default function CharacterProfilePage() {
  const { profile, setProfile, cases, tasks, achievements } = useGameStore();

  const gold = profile.gold || 0;
  const canonicalRank = getRankForLevel(profile.level);
  const currentRankInfo = RANKS.find((r) => r.rank === canonicalRank) || RANKS[0];
  const nextRank = RANKS.find((r) => r.minLevel > profile.level);
  const xpToNext = profile.xpToNextLevel || calculateXpForLevel(profile.level);
  const xpPercentage = Math.min(100, Math.max(0, Math.round((profile.xp / xpToNext) * 100)));

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
      desc: 'Powers endurance through high-stakes interrogation pressure, fatigue mitigation, and adversarial courtroom resistance.',
      icon: Zap,
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
              <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-noir border-2 border-gold rounded-full overflow-visible text-gold shadow-gold shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Detective Bureau Badge Emblem"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                <span className="absolute -bottom-1 bg-crimson text-parchment text-[10px] font-cinematic font-black px-2 py-0.5 rounded border border-gold/60 shadow-crimson tracking-wider z-10">
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
                    {canonicalRank}
                  </span>
                  <span className="text-xs text-parchment-dim typewriter-text">
                    &ldquo;{currentRankInfo.title}&rdquo; (Level {currentRankInfo.minLevel}+)
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
                CLEARANCE PROGRESSION: <strong className="text-parchment">{profile.xp} / {xpToNext} XP ({xpPercentage}%)</strong>
              </span>
              <span className="text-gold font-cinematic font-bold">
                {nextRank ? `NEXT RANK: ${nextRank.title.toUpperCase()} (LEVEL ${nextRank.minLevel})` : 'TOP BUREAU RANK ACHIEVED'}
              </span>
            </div>
            <div className="w-full h-2 bg-[#090a0c] rounded-full overflow-hidden border border-steel/30">
              <div
                className="h-full bg-gradient-to-r from-gold via-gold-bright to-gold transition-all duration-500"
                style={{
                  width: `${xpPercentage}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Environment & Audio Dispatch Settings (Accessible for Mobile & Desktop) */}
        <div className="bg-[#121316] border-2 border-gold/40 rounded p-5 sm:p-6 shadow-dossier">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-steel/20 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#18191c] border border-gold/40 flex items-center justify-center text-gold">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase tracking-wider">
                  DISPATCH CONSOLE • PREFERENCES
                </div>
                <h2 className="text-base sm:text-lg font-cinematic font-bold text-parchment tracking-wide">
                  ENVIRONMENT & AUDIO SETTINGS
                </h2>
              </div>
            </div>
            <span className="text-[10px] typewriter-text text-steel">
              100% PROCEDURAL SYNTHESIS • OFFLINE CAPABLE
            </span>
          </div>

          <div className="bg-[#0b0c0e] border border-steel/30 rounded-lg p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    profile.settings?.audioEnabled ?? true
                      ? 'bg-gold/15 border-gold text-gold shadow-gold'
                      : 'bg-[#18191c] border-steel/30 text-steel'
                  }`}
                >
                  {profile.settings?.audioEnabled ?? true ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-cinematic font-bold text-parchment uppercase tracking-wide">
                    Detective Sound Effects (SFX)
                  </h3>
                  <p className="text-xs text-parchment-dim typewriter-text mt-0.5 leading-relaxed max-w-xl">
                    100% real-time Web Audio procedural synthesis. Features heavy rubber stamp impacts, mechanical typewriter keystrokes, clue discovery chimes, red yarn pin snaps, and case-closed victory fanfares.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-cinematic font-bold tracking-wider ${profile.settings?.audioEnabled ?? true ? 'text-gold' : 'text-steel'}`}>
                  {profile.settings?.audioEnabled ?? true ? 'SFX ENABLED' : 'MUTED'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profile.settings?.audioEnabled ?? true}
                  aria-label="Toggle Detective Sound Effects"
                  onClick={() => {
                    const next = !(profile.settings?.audioEnabled ?? true);
                    setProfile({
                      settings: {
                        ...profile.settings,
                        audioEnabled: next,
                      },
                    });
                    if (next) {
                      soundEngine.playStampThud();
                    }
                  }}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold min-w-[56px] min-h-[32px] ${
                    profile.settings?.audioEnabled ?? true
                      ? 'bg-gold/20 border-gold'
                      : 'bg-[#18191c] border-steel/40'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                      profile.settings?.audioEnabled ?? true
                        ? 'translate-x-6 bg-gold'
                        : 'translate-x-0 bg-steel'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Interactive Sound Test Matrix */}
            <div className="pt-3 border-t border-steel/20 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] typewriter-text text-steel uppercase tracking-wider">
                AUDIO SYNTHESIS TEST CONSOLE:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => soundEngine.playStampThud()}
                  className="px-2.5 py-1.5 rounded bg-[#16171b] border border-steel/40 text-[11px] font-cinematic text-parchment hover:border-gold hover:text-gold active:scale-95 transition min-h-[30px]"
                >
                  Rubber Stamp
                </button>
                <button
                  type="button"
                  onClick={() => soundEngine.playTypewriter()}
                  className="px-2.5 py-1.5 rounded bg-[#16171b] border border-steel/40 text-[11px] font-cinematic text-parchment hover:border-gold hover:text-gold active:scale-95 transition min-h-[30px]"
                >
                  Typewriter Key
                </button>
                <button
                  type="button"
                  onClick={() => soundEngine.playClueFound()}
                  className="px-2.5 py-1.5 rounded bg-[#16171b] border border-steel/40 text-[11px] font-cinematic text-parchment hover:border-gold hover:text-gold active:scale-95 transition min-h-[30px]"
                >
                  Clue Chime
                </button>
                <button
                  type="button"
                  onClick={() => soundEngine.playThreadConnected()}
                  className="px-2.5 py-1.5 rounded bg-[#16171b] border border-steel/40 text-[11px] font-cinematic text-parchment hover:border-gold hover:text-gold active:scale-95 transition min-h-[30px]"
                >
                  Red Thread Snap
                </button>
                <button
                  type="button"
                  onClick={() => soundEngine.playPaperRustle()}
                  className="px-2.5 py-1.5 rounded bg-[#16171b] border border-steel/40 text-[11px] font-cinematic text-parchment hover:border-gold hover:text-gold active:scale-95 transition min-h-[30px]"
                >
                  Paper Rustle
                </button>
              </div>
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
              const isCurrent = canonicalRank === rk.rank;
              const isUnlocked = profile.level >= rk.minLevel;

              return (
                <div
                  key={rk.rank}
                  className={`p-3 rounded border text-center transition tactile-card flex flex-col justify-between min-h-[90px] ${
                    isCurrent
                      ? 'bg-gold/20 border-gold text-parchment shadow-gold ring-1 ring-gold/60'
                      : isUnlocked
                      ? 'bg-[#0b0c0e] border-steel/40 text-parchment-dim'
                      : 'bg-[#090a0c] border-steel/15 text-steel opacity-40'
                  }`}
                >
                  <div>
                    <div className={`text-[9px] font-cinematic font-bold ${isCurrent ? 'text-gold' : 'text-steel'}`}>
                      LEVEL {rk.minLevel}+
                    </div>
                    <div className="text-xs font-cinematic font-bold mt-0.5 leading-tight">
                      {rk.title}
                    </div>
                  </div>
                  <div className="text-[8px] typewriter-text text-parchment-dim uppercase mt-1">
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
