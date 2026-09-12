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
            CASE FILES
          </h1>
          <p className="text-xs text-parchment-dim typewriter-text mt-1">
            Browse master homicide and criminal conspiracy dossiers. Select an active file to focus your casework resources.
          </p>
        </div>

        {/* Case Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((cf) => {
            const isSolved = cf.status === 'SOLVED';
            const isCurrent = cf.id === activeCaseId;
            const discoveredClues = cf.evidence.filter((e) => e.isDiscovered).length;
            const isLocked = cf.status === 'UNSOLVED' && cf.id !== 'case_001';

            return (
              <div
                key={cf.id}
                className={`manila-folder rounded-sm p-6 shadow-2xl flex flex-col justify-between relative transition-all duration-300 ${
                  isCurrent ? 'ring-2 ring-gold shadow-gold' : 'hover:border-gold'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between border-b border-[#5a422d] pb-3 mb-4">
                    <span className="text-xs font-cinematic font-bold text-gold tracking-widest uppercase">
                      {cf.code}
                    </span>
                    <span
                      className={`text-[9px] font-cinematic font-bold px-2 py-0.5 rounded border ${
                        isSolved
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                          : isLocked
                          ? 'bg-noir border-steel/40 text-steel'
                          : 'bg-crimson/30 border-crimson text-parchment'
                      }`}
                    >
                      {isSolved ? 'SOLVED & CLOSED' : isLocked ? 'LOCKED DOSSIER' : 'ACTIVE INVESTIGATION'}
                    </span>
                  </div>

                  <h2 className="text-xl font-cinematic font-black text-parchment mb-1 leading-tight">
                    {cf.title}
                  </h2>
                  <div className="text-xs text-gold typewriter-text mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{cf.location}</span>
                  </div>

                  <p className="text-xs text-parchment-dim typewriter-text leading-relaxed border-l-2 border-gold/40 pl-3 mb-6">
                    {cf.synopsis}
                  </p>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-noir/80 border border-steel/30 rounded p-2.5 text-center text-xs typewriter-text mb-6">
                    <div>
                      <span className="text-steel text-[9px] block">SUSPECTS</span>
                      <strong className="text-parchment font-cinematic font-bold">{cf.suspects.length}</strong>
                    </div>
                    <div>
                      <span className="text-steel text-[9px] block">CLUES DISCOVERED</span>
                      <strong className="text-gold font-cinematic font-bold">
                        {discoveredClues} / {cf.evidence.length || 0}
                      </strong>
                    </div>
                    <div>
                      <span className="text-steel text-[9px] block">REWARD XP</span>
                      <strong className="text-amber-400 font-cinematic font-bold">+{cf.rewardXp}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[#5a422d] flex items-center justify-between">
                  <div className="text-[10px] text-parchment-dim typewriter-text">
                    REWARD: +{cf.rewardGold || 250} GOLD • {cf.rewardBadge}
                  </div>

                  {!isLocked ? (
                    <button
                      onClick={() => handleOpenCase(cf.id)}
                      className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-bright text-noir font-cinematic font-bold text-xs py-2 px-4 rounded-sm shadow-gold transition active:scale-95 uppercase tracking-wider"
                    >
                      <span>OPEN DESK</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-steel font-cinematic font-bold">
                      <Lock className="w-4 h-4" />
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
