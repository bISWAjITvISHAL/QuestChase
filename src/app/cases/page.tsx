'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { GameShell } from '@/components/layout/GameShell';
import { useGameStore } from '@/lib/store';
import {
  FolderOpen,
  Lock,
  ArrowRight,
  Shield,
  Coins,
  Sparkles,
  MapPin,
  CheckCircle,
  Users,
  Search,
  FileSearch,
  Award,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export default function CasesPage() {
  const router = useRouter();
  const { cases, activeCaseId, setActiveCase } = useGameStore();

  const handleOpenCase = (caseId: string) => {
    soundEngine.playPaperRustle();
    setActiveCase(caseId);
    router.push(`/headquarters`);
  };

  return (
    <GameShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-steel/30 pb-4">
          <div className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase">
            METROPOLITAN INVESTIGATION BUREAU • ARCHIVES
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wide">
            MASTER CASE ARCHIVES
          </h1>
          <p className="text-xs text-parchment-dim typewriter-text mt-1 max-w-xl">
            Browse confidential homicide and criminal syndicate dossiers. Select an active file to focus your casework, interrogate suspects, and inspect crime scenes.
          </p>
        </div>

        {/* Case Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((cf) => {
            const isComingSoon = cf.id === 'case_002';
            const isSolved = cf.status === 'SOLVED';
            const isCurrent = cf.id === activeCaseId && !isComingSoon;
            const discoveredClues = cf.evidence.filter((e) => e.isDiscovered).length;
            const isLocked = isComingSoon || (cf.status === 'UNSOLVED' && cf.id !== 'case_001');

            return (
              <div
                key={cf.id}
                className={`bg-[#121316] border-2 rounded p-6 shadow-dossier flex flex-col justify-between relative transition-all duration-200 tactile-card ${
                  isCurrent
                    ? 'border-gold shadow-gold ring-1 ring-gold/40'
                    : 'border-steel/30 hover:border-gold/60'
                }`}
              >
                {/* Dossier Tab */}
                <div className="absolute -top-3.5 right-6 bg-[#202227] px-3 py-0.5 rounded-t text-[9px] font-cinematic font-bold text-gold uppercase border-t border-x border-steel/40">
                  DOSSIER {cf.code}
                </div>

                <div>
                  {/* Top Status Badges */}
                  <div className="flex items-center justify-between border-b border-steel/20 pb-3 mb-4">
                    <span className="text-xs font-cinematic font-bold text-gold tracking-widest uppercase">
                      {cf.code}
                    </span>
                    <span
                      className={`text-[9px] font-cinematic font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                        isComingSoon
                          ? 'bg-[#181a1f] border-steel/50 text-steel'
                          : isSolved
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                          : isLocked
                          ? 'bg-noir border-steel/40 text-steel'
                          : 'bg-crimson/30 border-crimson text-parchment shadow-crimson'
                      }`}
                    >
                      {isComingSoon
                        ? 'CLASSIFIED • COMING SOON'
                        : isSolved
                        ? 'SOLVED & ARCHIVED'
                        : isLocked
                        ? 'CLEARANCE RESTRICTED'
                        : 'ACTIVE INVESTIGATION'}
                    </span>
                  </div>

                  <h2 className="text-xl font-cinematic font-black text-parchment mb-1 leading-tight">
                    {cf.title}
                  </h2>
                  <div className="text-xs text-gold typewriter-text mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{cf.location}</span>
                  </div>

                  <p className="text-xs text-parchment-dim typewriter-text leading-relaxed border-l-2 border-gold/40 pl-3 mb-6 bg-noir/40 py-2 rounded-r">
                    {cf.synopsis}
                  </p>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0b0c0e] border border-steel/25 rounded p-3 text-center text-xs typewriter-text mb-6">
                    <div>
                      <span className="text-steel text-[9px] block uppercase">SUSPECTS</span>
                      <strong className="text-parchment font-cinematic font-bold text-sm">
                        {cf.suspects.length}
                      </strong>
                    </div>
                    <div>
                      <span className="text-steel text-[9px] block uppercase">CLUES LOGGED</span>
                      <strong className="text-gold font-cinematic font-bold text-sm">
                        {discoveredClues} / {cf.evidence.length || 0}
                      </strong>
                    </div>
                    <div>
                      <span className="text-steel text-[9px] block uppercase">XP REWARD</span>
                      <strong className="text-amber-400 font-cinematic font-bold text-sm">
                        +{cf.rewardXp}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-steel/20 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[10px] text-steel typewriter-text flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-gold" />
                    <span>SEAL: {cf.rewardBadge}</span>
                  </div>

                  {isComingSoon ? (
                    <div className="flex items-center gap-1.5 text-xs text-steel font-cinematic font-bold bg-[#0b0c0e] px-3 py-1.5 rounded border border-steel/30">
                      <Lock className="w-3.5 h-3.5 text-gold/50" />
                      <span>BUREAU PREPARATION IN PROGRESS</span>
                    </div>
                  ) : !isLocked ? (
                    <button
                      onClick={() => handleOpenCase(cf.id)}
                      className="flex items-center gap-2 bg-gradient-to-r from-gold via-gold-bright to-gold hover:opacity-95 text-noir font-cinematic font-bold text-xs py-2 px-4 rounded shadow-gold transition active:scale-95 uppercase tracking-wider tactile-btn"
                    >
                      <span>{isCurrent ? 'ACCESS CURRENT DESK' : 'SWITCH ACTIVE CASE'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-steel font-cinematic font-bold bg-[#0b0c0e] px-3 py-1.5 rounded border border-steel/30">
                      <Lock className="w-3.5 h-3.5" />
                      <span>SOLVE CASE #001 FIRST</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
