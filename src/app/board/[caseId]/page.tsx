'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameShell } from '@/components/layout/GameShell';
import { useGameStore } from '@/lib/store';
import { EvidenceItem } from '@/lib/types';
import { FinalAccusationModal } from '@/components/evidence/FinalAccusationModal';
import {
  Share2,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  Clock,
  HelpCircle,
  Sparkles,
  Link2,
  Trash2,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export default function EvidenceBoardPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = (params.caseId as string) || 'case_001';

  const {
    cases,
    connectEvidence,
    removeEvidenceConnection,
    updateEvidenceBoardPosition,
  } = useGameStore();

  const currentCase = cases.find((c) => c.id === caseId) || cases[0];
  const discoveredEvidence = currentCase.evidence.filter((e) => e.isDiscovered);

  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [threadStartId, setThreadStartId] = useState<string | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [deductionBanner, setDeductionBanner] = useState<string | null>(null);
  const [accusationModalOpen, setAccusationModalOpen] = useState(false);

  // Fallback positions for evidence pins on the cork board
  const defaultPositions = [
    { x: 40, y: 30 },
    { x: 260, y: 40 },
    { x: 500, y: 35 },
    { x: 740, y: 45 },
    { x: 80, y: 260 },
    { x: 320, y: 280 },
    { x: 580, y: 270 },
    { x: 820, y: 290 },
  ];

  // Derive authoritative position: persisted boardPosition first, fallback to default cork grid
  const getEvidencePos = (ev: EvidenceItem, idx: number) => {
    if (ev.boardPosition && typeof ev.boardPosition.x === 'number' && typeof ev.boardPosition.y === 'number') {
      return ev.boardPosition;
    }
    return defaultPositions[idx % defaultPositions.length];
  };

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  const handlePointerDown = (ev: EvidenceItem, idx: number, e: React.PointerEvent) => {
    if (isLinkingMode) return;
    const pos = getEvidencePos(ev, idx);
    setDraggingId(ev.id);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (ev: EvidenceItem, e: React.PointerEvent) => {
    if (draggingId !== ev.id || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStartRef.current.moved = true;
    }
    const newX = Math.max(10, Math.min(880, dragStartRef.current.origX + dx));
    const newY = Math.max(10, Math.min(450, dragStartRef.current.origY + dy));
    updateEvidenceBoardPosition(currentCase.id, ev.id, newX, newY);
  };

  const handlePointerUp = (ev: EvidenceItem, e: React.PointerEvent) => {
    if (draggingId === ev.id) {
      const moved = dragStartRef.current?.moved;
      setDraggingId(null);
      dragStartRef.current = null;
      if (!moved) {
        handleCardClick(ev);
      }
    }
  };

  const handleCardClick = async (ev: EvidenceItem) => {
    soundEngine.playPaperRustle();

    if (isLinkingMode) {
      if (!threadStartId) {
        setThreadStartId(ev.id);
      } else if (threadStartId === ev.id) {
        setThreadStartId(null);
      } else {
        // Connect the two evidence items
        const res = await connectEvidence(currentCase.id, threadStartId, ev.id);
        if (res.isDeduction) {
          setDeductionBanner(res.message);
          setTimeout(() => setDeductionBanner(null), 7000);
        }
        setThreadStartId(null);
        setIsLinkingMode(false);
      }
    } else {
      setSelectedEvidence(ev);
    }
  };

  return (
    <GameShell>
      <div className="space-y-4">
        {/* Board Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-charcoal/90 border border-steel/30 px-4 py-2.5 rounded-sm">
          <div>
            <div className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase">
              INVESTIGATION WALL • {currentCase.code}
            </div>
            <h1 className="text-lg sm:text-xl font-cinematic font-bold text-parchment">
              EVIDENCE BOARD & THREADS
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEngine.playPaperRustle();
                router.push(`/investigate/${currentCase.id}`);
              }}
              className="flex items-center gap-1.5 bg-charcoal hover:bg-noir border border-steel/40 text-parchment font-cinematic font-bold text-xs py-1.5 px-3 rounded-sm transition"
            >
              <Search className="w-3.5 h-3.5 text-gold" />
              <span>CRIME SCENE</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playThreadConnected();
                setIsLinkingMode(!isLinkingMode);
                setThreadStartId(null);
              }}
              className={`flex items-center gap-1.5 font-cinematic font-bold text-xs py-1.5 px-3.5 rounded-sm transition ${
                isLinkingMode
                  ? 'bg-crimson text-parchment shadow-crimson animate-pulse border border-red-400'
                  : 'bg-noir border border-gold/40 text-gold hover:bg-gold hover:text-noir'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{isLinkingMode ? 'CANCEL THREAD' : 'CONNECT RED YARN'}</span>
            </button>

            <button
              onClick={() => setAccusationModalOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-crimson to-crimson-bright text-parchment font-cinematic font-bold text-xs py-1.5 px-4 rounded-sm shadow-crimson transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>FINAL ACCUSATION</span>
            </button>
          </div>
        </div>

        {/* Deduction / Contradiction Discovery Alert */}
        {deductionBanner && (
          <div className="p-3 bg-crimson/25 border-2 border-crimson rounded-sm text-parchment text-xs font-cinematic font-bold flex items-center justify-between shadow-crimson animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold animate-bounce" />
              <span>{deductionBanner}</span>
            </div>
            <button onClick={() => setDeductionBanner(null)} className="p-1 hover:text-gold">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Cork Board Container */}
        <div className="relative w-full min-h-[560px] bg-[#1a140f] border-4 border-[#2c1d12] rounded-sm shadow-2xl p-6 overflow-x-auto">
          {/* Cork Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#8a6642 1px, transparent 1px)`,
              backgroundSize: '12px 12px',
            }}
          />

          {/* SVG Canvas for Physical Red Yarn Threads */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 min-w-[1000px]">
            {currentCase.connections.map((conn) => {
              const evA = discoveredEvidence.find((e) => e.id === conn.fromEvidenceId);
              const evB = discoveredEvidence.find((e) => e.id === conn.toEvidenceId);
              if (!evA || !evB) return null;

              const fromIdx = discoveredEvidence.findIndex((e) => e.id === conn.fromEvidenceId);
              const toIdx = discoveredEvidence.findIndex((e) => e.id === conn.toEvidenceId);

              const posA = getEvidencePos(evA, fromIdx);
              const posB = getEvidencePos(evB, toIdx);

              const x1 = posA.x + 110;
              const y1 = posA.y + 70;
              const x2 = posB.x + 110;
              const y2 = posB.y + 70;

              return (
                <g key={conn.id}>
                  {/* Subtle Yarn Sag Bezier */}
                  <path
                    d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + 25} ${x2} ${y2}`}
                    fill="none"
                    className="evidence-thread"
                    strokeWidth="3"
                  />
                  {/* Pin endpoints */}
                  <circle cx={x1} cy={y1} r="4" fill="#A82B2B" />
                  <circle cx={x2} cy={y2} r="4" fill="#A82B2B" />
                </g>
              );
            })}
          </svg>

          {/* Render Discovered Evidence Cards on Cork Board */}
          {discoveredEvidence.length > 0 ? (
            <div className="relative z-20 min-w-[1000px] min-h-[500px]">
              {discoveredEvidence.map((ev, idx) => {
                const pos = getEvidencePos(ev, idx);
                const isSelectedForThread = threadStartId === ev.id;
                const isDragging = draggingId === ev.id;

                return (
                  <div
                    key={ev.id}
                    style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                    onPointerDown={(e) => handlePointerDown(ev, idx, e)}
                    onPointerMove={(e) => handlePointerMove(ev, e)}
                    onPointerUp={(e) => handlePointerUp(ev, e)}
                    className={`absolute w-56 bg-[#161412] border-2 rounded p-3 shadow-dossier cursor-grab active:cursor-grabbing select-none transition-shadow ${
                      isDragging ? 'z-30 ring-2 ring-gold scale-105 shadow-2xl' : 'z-20'
                    } ${
                      isSelectedForThread
                        ? 'border-crimson-bright shadow-crimson scale-105 ring-2 ring-crimson'
                        : isLinkingMode
                        ? 'border-gold hover:scale-105 ring-1 ring-gold/40'
                        : 'border-[#4a3b2c] hover:border-gold'
                    }`}
                  >
                    {/* Brass Push Pin */}
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-crimson border-2 border-gold shadow-md flex items-center justify-center">
                      <div className="w-1 h-1 bg-parchment rounded-full" />
                    </div>

                    {/* Tag & Type */}
                    <div className="flex items-center justify-between text-[9px] font-cinematic font-bold text-gold tracking-wider mb-1 pt-1">
                      <span>{ev.type}</span>
                      {ev.timelineTimestamp && (
                        <span className="text-crimson-bright flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {ev.timelineTimestamp}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-cinematic font-bold text-parchment mb-1 leading-snug">
                      {ev.title}
                    </h3>

                    <p className="text-[10px] text-parchment-dim typewriter-text line-clamp-3 mb-2">
                      {ev.description}
                    </p>

                    <div className="text-[8px] text-steel typewriter-text border-t border-steel/20 pt-1 flex justify-between">
                      <span>SOURCE: {ev.source}</span>
                      <span className="text-gold font-bold">INSPECT</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-80 flex flex-col justify-center items-center text-center p-6 relative z-20">
              <Share2 className="w-12 h-12 text-gold/30 mb-3" />
              <h3 className="text-base font-cinematic font-bold text-parchment">
                NO EVIDENCE PINNED YET
              </h3>
              <p className="text-xs text-parchment-dim typewriter-text mt-1 max-w-sm">
                Enter the Crime Scene to spend investigative Gold on forensic actions. Discovered clues will be automatically pinned here.
              </p>
            </div>
          )}
        </div>

        {/* Evidence Inspection Modal */}
        {selectedEvidence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/80 backdrop-blur-md p-4">
            <div className="max-w-md w-full bg-charcoal border border-gold/50 rounded-sm p-6 shadow-dossier">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase">
                  FORENSIC DOSSIER • {selectedEvidence.type}
                </span>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="text-steel hover:text-parchment p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-lg font-cinematic font-bold text-parchment mb-2">
                {selectedEvidence.title}
              </h2>

              <div className="text-xs text-parchment-dim typewriter-text mb-4 leading-relaxed">
                {selectedEvidence.description}
              </div>

              <div className="bg-noir/90 border border-steel/30 rounded p-3 text-xs typewriter-text space-y-2 mb-4">
                <div className="text-[10px] text-gold font-bold">LABORATORY FORENSIC ANALYSIS:</div>
                <p className="text-parchment leading-relaxed">{selectedEvidence.detailedNotes}</p>
                <div className="text-[10px] text-steel">RECOVERED FROM: {selectedEvidence.source}</div>
              </div>

              <button
                onClick={() => setSelectedEvidence(null)}
                className="w-full bg-charcoal hover:bg-noir border border-gold text-gold font-cinematic font-bold py-2 rounded-sm text-xs"
              >
                CLOSE DOSSIER
              </button>
            </div>
          </div>
        )}

        <FinalAccusationModal
          isOpen={accusationModalOpen}
          onClose={() => setAccusationModalOpen(false)}
          caseFile={currentCase}
        />
      </div>
    </GameShell>
  );
}
