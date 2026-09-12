'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameShell } from '@/components/layout/GameShell';
import { useGameStore } from '@/lib/store';
import { CrimeScene3D } from '@/components/3d/CrimeScene3D';
import { InvestigationAction, EvidenceItem } from '@/lib/types';
import {
  Search,
  Share2,
  Lock,
  Zap,
  Coins,
  Shield,
  CheckCircle,
  AlertTriangle,
  FileText,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export default function InvestigatePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = (params.caseId as string) || 'case_001';

  const { cases, profile, executeInvestigationAction } = useGameStore();
  const currentCase = cases.find((c) => c.id === caseId) || cases[0];

  const [selectedAction, setSelectedAction] = useState<InvestigationAction | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [revealedEvidence, setRevealedEvidence] = useState<EvidenceItem | null>(null);

  const discoveredEvidence = currentCase.evidence.filter((e) => e.isDiscovered);
  const currentChapter = currentCase.chapters.find((ch) => !ch.isCompleted) || currentCase.chapters[0];
  const gold = profile.gold || 0;

  const handleExecute = async (action: InvestigationAction) => {
    const result = await executeInvestigationAction(currentCase.id, action.id);
    if (result.success) {
      setFeedbackMessage({ type: 'success', text: result.message });
      setSelectedAction({ ...action, isExecuted: true });

      // Find the unlocked evidence item and show the cinematic clue reveal modal
      const ev = currentCase.evidence.find((e) => e.id === action.yieldsEvidenceId);
      if (ev) {
        setRevealedEvidence(ev);
      }
    } else {
      setFeedbackMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <GameShell>
      <div className="flex flex-col h-[calc(100vh-9.5rem)] space-y-4">
        {/* Top Case Intelligence Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-charcoal/90 border border-steel/30 px-4 py-2.5 rounded-sm shadow-noir">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-cinematic font-bold text-gold px-1.5 py-0.5 bg-noir border border-gold/30 rounded">
                {currentCase.code}
              </span>
              <h1 className="text-base sm:text-lg font-cinematic font-bold text-parchment">
                {currentCase.title}
              </h1>
            </div>
            <div className="text-[11px] text-parchment-dim typewriter-text mt-0.5">
              OBJECTIVE: {currentChapter?.title} • {currentChapter?.objective}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEngine.playPaperRustle();
                router.push(`/board/${currentCase.id}`);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-crimson to-crimson-bright text-parchment font-cinematic font-bold text-xs py-1.5 px-3.5 rounded-sm shadow-crimson transition active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>OPEN EVIDENCE BOARD</span>
            </button>
          </div>
        </div>

        {/* Main 3D Investigation Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* 3D Crime Scene Canvas (Spans 8 Columns) */}
          <div className="lg:col-span-8 bg-noir border border-steel/40 rounded-sm relative overflow-hidden flex flex-col shadow-2xl">
            <div className="absolute top-3 left-3 z-10 bg-noir/85 backdrop-blur-md border border-steel/30 px-3 py-1.5 rounded text-[10px] typewriter-text text-parchment-dim pointer-events-none">
              <span className="text-gold font-bold">3D CRIME SCENE HOTSPOTS</span> • ROTATE & CLICK OBJECTS TO EXAMINE
            </div>

            <div className="flex-1 w-full h-full min-h-[300px]">
              <CrimeScene3D
                actions={currentCase.actions}
                onSelectAction={(action) => {
                  setSelectedAction(action);
                  setFeedbackMessage(null);
                }}
              />
            </div>
          </div>

          {/* Right Action Inspection Panel (Spans 4 Columns) */}
          <div className="lg:col-span-4 parchment-card rounded-sm p-4 flex flex-col justify-between overflow-y-auto shadow-dossier">
            {selectedAction ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase">
                      FORENSIC INSPECTION ACTION
                    </span>
                    <button
                      onClick={() => setSelectedAction(null)}
                      className="text-steel hover:text-parchment p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <h2 className="text-base sm:text-lg font-cinematic font-black text-parchment">
                    {selectedAction.title}
                  </h2>
                  <div className="text-xs text-gold typewriter-text">
                    LOCATION: {selectedAction.locationLabel}
                  </div>
                </div>

                <p className="text-xs text-parchment-dim typewriter-text border-l-2 border-gold/40 pl-2.5 leading-relaxed">
                  {selectedAction.description}
                </p>

                {/* Resource Costs & Attribute Requirements */}
                <div className="bg-noir/90 border border-steel/30 rounded p-3 space-y-2 text-xs typewriter-text">
                  <div className="text-[10px] text-parchment-dim font-bold">INVESTIGATION REQUIREMENTS:</div>

                  {/* Gold Cost */}
                  <div className="flex items-center justify-between">
                    <span className="text-parchment-dim flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-gold" /> Gold Required:
                    </span>
                    <span
                      className={`font-bold ${
                        gold >= (selectedAction.costGold || 50)
                          ? 'text-gold font-cinematic'
                          : 'text-crimson-bright'
                      }`}
                    >
                      {selectedAction.costGold || 50} GOLD (You have {gold})
                    </span>
                  </div>

                  {/* Primary Attribute Requirement */}
                  {selectedAction.reqAttributes &&
                    Object.entries(selectedAction.reqAttributes).map(([attr, val]) => (
                      <div key={attr} className="flex items-center justify-between text-[11px] pt-1 border-t border-steel/20">
                        <span className="text-parchment-dim uppercase">Primary Req: {attr}</span>
                        <span className="text-parchment font-bold">
                          Level {val} (Your stat: {profile.attributes[attr] || 0})
                        </span>
                      </div>
                    ))}

                  {/* Alternate Route Indicator */}
                  {selectedAction.alternateRoute && (
                    <div className="text-[10px] text-emerald-400/90 pt-1 border-t border-steel/20">
                      <span>ALTERNATE ROUTE: {selectedAction.alternateRoute.label}</span>
                    </div>
                  )}
                </div>

                {/* Feedback Message */}
                {feedbackMessage && (
                  <div
                    className={`p-3 rounded text-xs typewriter-text ${
                      feedbackMessage.type === 'success'
                        ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300'
                        : 'bg-crimson/20 border border-crimson text-red-300'
                    }`}
                  >
                    {feedbackMessage.text}
                  </div>
                )}

                {/* Execute Button */}
                {!selectedAction.isExecuted ? (
                  <button
                    onClick={() => handleExecute(selectedAction)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-crimson to-crimson-bright hover:from-crimson-bright hover:to-crimson text-parchment font-cinematic font-bold py-3 px-4 rounded-sm shadow-crimson transition active:scale-95 text-xs uppercase tracking-wider"
                  >
                    <Search className="w-4 h-4" />
                    <span>SPEND GOLD & EXECUTE ACTION</span>
                  </button>
                ) : (
                  <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-cinematic font-bold text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>EVIDENCE DISCOVERED & LOGGED</span>
                    </div>
                    <div className="text-[10px] text-parchment-dim typewriter-text mt-1">
                      Pinned to Evidence Board. Connect threads to form deductions.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-4">
                <Search className="w-8 h-8 text-gold/40 mb-3 animate-pulse" />
                <h3 className="text-sm font-cinematic font-bold text-parchment">
                  CRIME SCENE FORENSICS
                </h3>
                <p className="text-[11px] text-parchment-dim typewriter-text mt-1 max-w-xs leading-relaxed">
                  Rotate the 3D scene and select highlighted hotspots (Victim Desk, Laptop Terminal, Wall Safe, Garden Perimeter, Interrogation Suite) to expend Gold and conduct forensic investigation.
                </p>
              </div>
            )}

            {/* Bottom Progress Footnote */}
            <div className="pt-3 mt-3 border-t border-steel/20 text-[10px] typewriter-text text-parchment-dim flex items-center justify-between">
              <span>EVIDENCE RETRIEVED:</span>
              <span className="text-gold font-bold">
                {discoveredEvidence.length} / {currentCase.evidence.length} ITEMS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic Clue Reveal Modal matching Specification Section 22 */}
      {revealedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="relative max-w-md w-full bg-[#181512] border-2 border-gold rounded-sm p-6 shadow-gold text-parchment">
            {/* Scanning light animation bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />

            <div className="flex items-center justify-between text-[10px] font-cinematic font-bold text-gold uppercase tracking-widest mb-2">
              <span>EVIDENCE REVEALED</span>
              <span className="text-crimson-bright">CLUE #{revealedEvidence.id.replace('ev_', '')}</span>
            </div>

            <h2 className="text-xl font-cinematic font-black text-parchment mb-2 leading-tight">
              {revealedEvidence.title}
            </h2>

            <div className="text-xs text-parchment-dim typewriter-text mb-4 border-l-2 border-gold/50 pl-3 leading-relaxed">
              "{revealedEvidence.description}"
            </div>

            {/* Metadata Table */}
            <div className="bg-noir/80 border border-steel/30 rounded p-3 text-xs typewriter-text space-y-1.5 mb-5">
              <div className="flex justify-between">
                <span className="text-steel">SOURCE:</span>
                <span className="text-parchment font-bold">{revealedEvidence.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel">RELIABILITY:</span>
                <span className="text-gold font-bold">{revealedEvidence.reliability || 'HIGH'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel">CONNECTED SUSPECTS:</span>
                <span className="text-crimson-bright font-bold">
                  {revealedEvidence.connectedSuspects?.join(', ') || 'Marcus Vance'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel">CATEGORY:</span>
                <span className="text-parchment">{revealedEvidence.type}</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playStampThud();
                setRevealedEvidence(null);
              }}
              className="w-full bg-gradient-to-r from-gold to-gold-bright hover:from-gold-bright hover:to-gold text-noir font-cinematic font-black text-xs py-3 rounded-sm shadow-gold transition active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>ADD TO CASE BOARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </GameShell>
  );
}
