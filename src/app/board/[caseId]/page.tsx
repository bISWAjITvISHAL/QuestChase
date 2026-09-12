'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameShell } from '@/components/layout/GameShell';
import { useGameStore } from '@/lib/store';
import { EvidenceItem, Suspect } from '@/lib/types';
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
  User,
  Users,
  ShieldAlert,
  ArrowRight,
  Fingerprint,
  FileSearch,
  Zap,
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
  const suspects = currentCase.suspects || [];

  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [threadStartId, setThreadStartId] = useState<string | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [deductionBanner, setDeductionBanner] = useState<string | null>(null);
  const [accusationModalOpen, setAccusationModalOpen] = useState(false);
  const [hoveredEvidenceId, setHoveredEvidenceId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Fallback positions for evidence pins on the cork board
  const defaultPositions = [
    { x: 40, y: 30 },
    { x: 270, y: 40 },
    { x: 500, y: 35 },
    { x: 740, y: 45 },
    { x: 70, y: 260 },
    { x: 310, y: 280 },
    { x: 550, y: 265 },
    { x: 780, y: 290 },
    { x: 420, y: 460 },
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
    const newX = Math.max(10, Math.min(960, dragStartRef.current.origX + dx));
    const newY = Math.max(10, Math.min(600, dragStartRef.current.origY + dy));
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
          soundEngine.playStampThud();
          setDeductionBanner(res.message);
          setTimeout(() => setDeductionBanner(null), 8000);
        }
        setThreadStartId(null);
        setIsLinkingMode(false);
      }
    } else {
      setSelectedEvidence(ev);
    }
  };

  // Calculate connected evidence set for hover effects
  const getConnectedIds = (evidenceId: string | null) => {
    if (!evidenceId) return new Set<string>();
    const set = new Set<string>([evidenceId]);
    currentCase.connections.forEach((conn) => {
      if (conn.fromEvidenceId === evidenceId) set.add(conn.toEvidenceId);
      if (conn.toEvidenceId === evidenceId) set.add(conn.fromEvidenceId);
    });
    return set;
  };

  const activeConnectedSet = getConnectedIds(hoveredEvidenceId);
  const validDeductionCount = currentCase.connections.filter((c) => c.isDeductionValid).length;

  if (caseId === 'case_002') {
    return (
      <GameShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <div className="max-w-lg bg-[#111215] border border-steel/40 p-8 rounded shadow-2xl relative">
            <div className="text-[10px] font-cinematic font-bold tracking-widest text-gold uppercase mb-2">
              METROPOLITAN INVESTIGATION BUREAU • ARCHIVES
            </div>
            <h1 className="text-2xl font-cinematic font-black text-parchment tracking-wide mb-2">
              CASE #002: THE SILENT WITNESS
            </h1>
            <div className="inline-block bg-noir border border-steel/50 px-3 py-1 text-xs text-steel font-cinematic font-bold tracking-wider uppercase mb-4">
              CASE BOARD UNDER BUREAU PREPARATION
            </div>
            <p className="text-xs text-parchment-dim typewriter-text leading-relaxed mb-6">
              The pinboard and string matrix for Case #002 are currently classified while forensic investigators secure the crime scene. Solve Case #001 (The Blackwood Murder) to prepare for this dossier.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push('/headquarters')}
                className="w-full sm:w-auto bg-gradient-to-r from-gold via-gold-bright to-gold text-noir font-cinematic font-bold text-xs py-2.5 px-6 rounded shadow-gold transition active:scale-95 uppercase tracking-wider"
              >
                Return to Detective&apos;s Desk
              </button>
              <button
                onClick={() => router.push('/board/case_001')}
                className="w-full sm:w-auto bg-[#1a1c22] hover:bg-[#252830] text-parchment border border-steel/40 font-cinematic font-bold text-xs py-2.5 px-6 rounded transition active:scale-95 uppercase tracking-wider"
              >
                Open Case #001 Board
              </button>
            </div>
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell>
      <div className="space-y-4">
        {/* Board Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f1012] border border-steel/30 px-4 py-3 rounded shadow-dossier">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>MURDER BOARD • {currentCase.code}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-cinematic font-bold text-parchment tracking-wide">
              {currentCase.title}
            </h1>
          </div>

          {/* Quick Metrics */}
          <div className="hidden md:flex items-center gap-4 bg-noir/70 border border-steel/20 px-3 py-1.5 rounded text-xs typewriter-text">
            <div className="flex items-center gap-1.5">
              <FileSearch className="w-3.5 h-3.5 text-gold" />
              <span className="text-steel">DISCOVERED:</span>
              <span className="text-parchment font-bold">{discoveredEvidence.length}/{currentCase.evidence.length}</span>
            </div>
            <div className="w-px h-4 bg-steel/30" />
            <div className="flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-crimson-bright" />
              <span className="text-steel">THREADS:</span>
              <span className="text-parchment font-bold">{currentCase.connections.length}</span>
            </div>
            <div className="w-px h-4 bg-steel/30" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-gold-bright" />
              <span className="text-steel">CONTRADICTIONS:</span>
              <span className="text-gold-bright font-bold">{validDeductionCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mobile View Mode Switcher */}
            <div className="flex sm:hidden bg-noir border border-steel/40 p-0.5 rounded">
              <button
                onClick={() => setViewMode('board')}
                className={`px-2 py-1 text-[10px] font-cinematic font-bold rounded transition-colors ${
                  viewMode === 'board' ? 'bg-gold text-noir' : 'text-steel hover:text-parchment'
                }`}
              >
                BOARD
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 text-[10px] font-cinematic font-bold rounded transition-colors ${
                  viewMode === 'list' ? 'bg-gold text-noir' : 'text-steel hover:text-parchment'
                }`}
              >
                LIST
              </button>
            </div>

            <button
              onClick={() => {
                soundEngine.playPaperRustle();
                router.push(`/investigate/${currentCase.id}`);
              }}
              className="flex items-center gap-1.5 bg-charcoal hover:bg-noir border border-steel/40 text-parchment font-cinematic font-bold text-xs py-2 px-3 rounded transition tactile-btn min-h-[44px]"
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
              className={`flex items-center gap-1.5 font-cinematic font-bold text-xs py-2 px-3.5 rounded transition tactile-btn min-h-[44px] ${
                isLinkingMode
                  ? 'bg-crimson text-parchment shadow-crimson animate-pulse border border-red-400 ring-2 ring-crimson/50'
                  : 'bg-noir border border-gold/40 text-gold hover:bg-gold hover:text-noir'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{isLinkingMode ? 'CANCEL LINK' : 'CONNECT RED YARN'}</span>
            </button>

            <button
              onClick={() => setAccusationModalOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-crimson to-crimson-bright hover:from-crimson-bright hover:to-crimson text-parchment font-cinematic font-bold text-xs py-2 px-4 rounded shadow-crimson transition tactile-btn tracking-wider min-h-[44px]"
            >
              <CheckCircle className="w-3.5 h-3.5 text-gold" />
              <span>FINAL ACCUSATION</span>
            </button>
          </div>
        </div>

        {/* Deduction / Contradiction Discovery Alert */}
        {deductionBanner && (
          <div className="p-3.5 bg-crimson/30 border-2 border-crimson rounded text-parchment text-xs font-cinematic font-bold flex items-center justify-between shadow-crimson animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-gold-bright animate-bounce shrink-0" />
              <span className="leading-snug">{deductionBanner}</span>
            </div>
            <button onClick={() => setDeductionBanner(null)} className="p-1 hover:text-gold shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SUSPECTS DOSSIER GALLERY (PINNED TO WALL TOP) */}
        <div className="bg-[#121316] border border-steel/30 rounded p-3 shadow-dossier">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] font-cinematic font-bold text-parchment uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-gold" />
              <span>PERSONS OF INTEREST • SUSPECT DOSSIERS</span>
            </div>
            <span className="text-[9px] typewriter-text text-steel">CLICK PORTRAIT TO INSPECT ALIBI & MOTIVE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {suspects.map((suspect) => {
              const relatedEvidence = discoveredEvidence.filter((e) =>
                e.connectedSuspects?.some((s) => s.toLowerCase().includes(suspect.name.toLowerCase()) || suspect.name.toLowerCase().includes(s.toLowerCase()))
              );

              return (
                <button
                  key={suspect.id}
                  onClick={() => {
                    soundEngine.playPaperRustle();
                    setSelectedSuspect(suspect);
                  }}
                  className="group relative text-left bg-[#18191c] hover:bg-[#202226] border border-steel/30 hover:border-gold/60 rounded p-2.5 transition tactile-card"
                >
                  {/* Brass Pin on top */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-steel border border-gold/70 shadow-sm" />

                  <div className="flex items-center gap-2 mb-1.5 pt-1">
                    <div className="w-7 h-7 rounded-full bg-noir border border-steel/40 flex items-center justify-center shrink-0 text-gold font-cinematic font-bold text-xs group-hover:border-gold">
                      {suspect.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-cinematic font-bold text-parchment truncate group-hover:text-gold transition-colors">
                        {suspect.name}
                      </div>
                      <div className="text-[9px] typewriter-text text-steel truncate">
                        {suspect.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] typewriter-text text-parchment-dim line-clamp-2 italic bg-noir/50 p-1.5 rounded border border-steel/15 mb-1.5">
                    &ldquo;{suspect.alibi}&rdquo;
                  </div>

                  <div className="flex items-center justify-between text-[8px] typewriter-text text-steel">
                    <span>{relatedEvidence.length} CLUE{relatedEvidence.length !== 1 ? 'S' : ''} LINKED</span>
                    <span className="text-gold font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      VIEW <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Linking Mode Helper Prompt */}
        {isLinkingMode && (
          <div className="bg-crimson/20 border border-crimson/50 text-parchment px-4 py-2 rounded text-xs font-cinematic flex items-center justify-between shadow-crimson">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-crimson-bright animate-spin" />
              <span>
                {threadStartId
                  ? 'PIN 1 SELECTED. Click the second evidence card to stretch and connect the red yarn thread.'
                  : 'SELECT FIRST CLUE: Click any pinned evidence card on the board to anchor yarn.'}
              </span>
            </div>
            <button
              onClick={() => {
                setIsLinkingMode(false);
                setThreadStartId(null);
              }}
              className="text-[10px] text-parchment-dim hover:text-parchment underline uppercase"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Mobile Dossier List View */}
        {viewMode === 'list' && (
          <div className="sm:hidden space-y-3">
            <div className="text-[11px] font-cinematic font-bold text-gold uppercase tracking-wider mb-2">
              DISCOVERED EVIDENCE DOSSIER ({discoveredEvidence.length} ITEMS)
            </div>
            {discoveredEvidence.map((ev) => {
              const isSelected = threadStartId === ev.id;
              const isContradicted = currentCase.connections.some(
                (c) => c.isDeductionValid && (c.fromEvidenceId === ev.id || c.toEvidenceId === ev.id)
              );
              return (
                <div
                  key={ev.id}
                  className={`bg-[#161412] border-2 rounded p-3.5 shadow-dossier ${
                    isSelected
                      ? 'border-crimson-bright ring-2 ring-crimson'
                      : isContradicted
                      ? 'border-crimson/80'
                      : 'border-steel/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-cinematic font-bold text-gold mb-1">
                    <span>{ev.type}</span>
                    {ev.timelineTimestamp && (
                      <span className="text-crimson-bright flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ev.timelineTimestamp}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-cinematic font-bold text-parchment mb-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-parchment-dim typewriter-text mb-3 leading-relaxed">
                    {ev.description}
                  </p>
                  <div className="flex items-center justify-between gap-2 border-t border-steel/20 pt-2 text-[10px]">
                    <span className="text-steel">SRC: {ev.source}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedEvidence(ev)}
                        className="px-2.5 py-1.5 min-h-[36px] bg-noir border border-steel/40 text-parchment rounded text-[10px] font-cinematic uppercase active:scale-95"
                      >
                        Details
                      </button>
                      {isLinkingMode && (
                        <button
                          onClick={() => handleCardClick(ev)}
                          className={`px-2.5 py-1.5 min-h-[36px] rounded text-[10px] font-cinematic font-bold uppercase active:scale-95 ${
                            isSelected ? 'bg-crimson text-parchment' : 'bg-gold text-noir'
                          }`}
                        >
                          {isSelected ? 'Pin 1' : 'Connect'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cork Board Container */}
        <div className={`relative w-full min-h-[620px] bg-[#1a140f] border-4 border-[#2c1d12] rounded shadow-2xl p-6 overflow-x-auto ${viewMode === 'list' ? 'hidden sm:block' : 'block'}`}>
          {/* Cork Texture Overlay */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#9c744c 1.2px, transparent 1.2px)`,
              backgroundSize: '14px 14px',
            }}
          />

          {/* Vignette Shadow around Cork */}
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.85)] pointer-events-none" />

          {/* SVG Canvas for Physical Red Yarn Threads */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 min-w-[1050px]">
            <defs>
              <filter id="yarnGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {currentCase.connections.map((conn) => {
              const evA = discoveredEvidence.find((e) => e.id === conn.fromEvidenceId);
              const evB = discoveredEvidence.find((e) => e.id === conn.toEvidenceId);
              if (!evA || !evB) return null;

              const fromIdx = discoveredEvidence.findIndex((e) => e.id === conn.fromEvidenceId);
              const toIdx = discoveredEvidence.findIndex((e) => e.id === conn.toEvidenceId);

              const posA = getEvidencePos(evA, fromIdx);
              const posB = getEvidencePos(evB, toIdx);

              const x1 = posA.x + 115;
              const y1 = posA.y + 75;
              const x2 = posB.x + 115;
              const y2 = posB.y + 75;

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2 + 25; // Subtle physical yarn sag

              const isContradiction = conn.isDeductionValid;
              const isHovered = hoveredConnectionId === conn.id;

              return (
                <g key={conn.id}>
                  {/* Subtle drop shadow under thread */}
                  <path
                    d={`M ${x1} ${y1 + 3} Q ${midX} ${midY + 3} ${x2} ${y2 + 3}`}
                    fill="none"
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth="3.5"
                  />

                  {/* Main Red Yarn Path */}
                  <path
                    d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                    fill="none"
                    stroke={isContradiction ? '#C83232' : '#8A1F1F'}
                    strokeWidth={isContradiction ? '3.5' : '2.5'}
                    strokeDasharray={isContradiction ? '6 3' : undefined}
                    filter={isContradiction ? 'url(#yarnGlow)' : undefined}
                    className="evidence-thread animate-thread-draw"
                  />

                  {/* Brass Pin Endpoints */}
                  <circle cx={x1} cy={y1} r="5" fill="#A82B2B" stroke="#D4AF37" strokeWidth="1.5" />
                  <circle cx={x2} cy={y2} r="5" fill="#A82B2B" stroke="#D4AF37" strokeWidth="1.5" />

                  {/* Contradiction / Breakthrough Badge on Thread */}
                  {isContradiction && (
                    <g
                      transform={`translate(${midX - 55}, ${midY - 14})`}
                      className="pointer-events-auto cursor-pointer"
                      onClick={() => {
                        soundEngine.playPaperRustle();
                        setDeductionBanner(`CONTRADICTION VALIDATED: ${evA.title} vs ${evB.title}`);
                      }}
                    >
                      <rect
                        width="110"
                        height="20"
                        rx="3"
                        fill="#7F2525"
                        stroke="#C8A668"
                        strokeWidth="1"
                      />
                      <text
                        x="55"
                        y="14"
                        textAnchor="middle"
                        fill="#E7E1D5"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="serif"
                        letterSpacing="0.05em"
                      >
                        ⚡ CONTRADICTION
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Render Discovered Evidence Cards on Cork Board */}
          {discoveredEvidence.length > 0 ? (
            <div className="relative z-20 min-w-[1050px] min-h-[560px]">
              {discoveredEvidence.map((ev, idx) => {
                const pos = getEvidencePos(ev, idx);
                const isSelectedForThread = threadStartId === ev.id;
                const isDragging = draggingId === ev.id;
                const isConnectedToHovered = activeConnectedSet.has(ev.id);
                const isContradicted = currentCase.connections.some(
                  (c) => c.isDeductionValid && (c.fromEvidenceId === ev.id || c.toEvidenceId === ev.id)
                );

                const dimCard =
                  hoveredEvidenceId !== null &&
                  hoveredEvidenceId !== ev.id &&
                  !isConnectedToHovered;

                return (
                  <div
                    key={ev.id}
                    style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                    onPointerDown={(e) => handlePointerDown(ev, idx, e)}
                    onPointerMove={(e) => handlePointerMove(ev, e)}
                    onPointerUp={(e) => handlePointerUp(ev, e)}
                    onMouseEnter={() => setHoveredEvidenceId(ev.id)}
                    onMouseLeave={() => setHoveredEvidenceId(null)}
                    className={`absolute w-60 bg-[#161412] border-2 rounded p-3.5 shadow-dossier cursor-grab active:cursor-grabbing select-none touch-none transition-all duration-150 ${
                      dimCard ? 'opacity-40' : 'opacity-100'
                    } ${
                      isDragging ? 'z-40 ring-2 ring-gold scale-105 shadow-2xl' : 'z-20'
                    } ${
                      isSelectedForThread
                        ? 'border-crimson-bright shadow-crimson scale-105 ring-2 ring-crimson'
                        : isLinkingMode
                        ? 'border-gold/80 hover:scale-105 ring-1 ring-gold/40'
                        : isContradicted
                        ? 'border-crimson/80 hover:border-gold'
                        : 'border-[#4a3b2c] hover:border-gold'
                    }`}
                  >
                    {/* Realistic Brass Pin */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-[#d4af37] via-[#aa820a] to-[#5a4200] border border-[#f3e5ab] shadow-md flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-[#fff8db] rounded-full opacity-80" />
                    </div>

                    {/* Contradiction Stamp */}
                    {isContradicted && (
                      <div className="absolute -top-2 -right-2 stamp-contradiction text-[9px] pointer-events-none z-30">
                        CONTRADICTION
                      </div>
                    )}

                    {/* Tag & Timeline Header */}
                    <div className="flex items-center justify-between text-[9px] font-cinematic font-bold text-gold tracking-wider mb-1 pt-1.5 border-b border-steel/20 pb-1">
                      <span className="truncate pr-1">{ev.type}</span>
                      {ev.timelineTimestamp && (
                        <span className="text-crimson-bright flex items-center gap-0.5 shrink-0">
                          <Clock className="w-2.5 h-2.5" /> {ev.timelineTimestamp}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-cinematic font-bold text-parchment mb-1.5 leading-snug">
                      {ev.title}
                    </h3>

                    <p className="text-[10px] text-parchment-dim typewriter-text line-clamp-3 mb-2 leading-relaxed">
                      {ev.description}
                    </p>

                    {/* Footer Info */}
                    <div className="text-[8px] text-steel typewriter-text border-t border-steel/20 pt-1.5 flex items-center justify-between">
                      <span className="truncate max-w-[130px]">SRC: {ev.source}</span>
                      <span className="text-gold font-bold tracking-wider hover:underline">
                        {isLinkingMode ? (isSelectedForThread ? 'ANCHORED' : 'CONNECT') : 'INSPECT'}
                      </span>
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
                Enter the Crime Scene to spend investigative Gold on forensic actions. Discovered clues will be automatically pinned here for analysis and deduction.
              </p>
              <button
                onClick={() => router.push(`/investigate/${currentCase.id}`)}
                className="mt-4 flex items-center gap-1.5 bg-noir border border-gold/50 text-gold font-cinematic font-bold text-xs py-2 px-4 rounded hover:bg-gold hover:text-noir transition"
              >
                <Search className="w-3.5 h-3.5" />
                <span>GO TO CRIME SCENE</span>
              </button>
            </div>
          )}
        </div>

        {/* Evidence Inspection Modal */}
        {selectedEvidence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="max-w-lg w-full bg-[#141518] border-2 border-gold/40 rounded p-6 shadow-dossier max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 border-b border-steel/30 pb-2">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-gold" />
                  <span className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase tracking-wider">
                    EVIDENCE RECORD • {selectedEvidence.type}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="text-steel hover:text-parchment p-1 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-cinematic font-bold text-parchment mb-2">
                {selectedEvidence.title}
              </h2>

              <div className="text-xs text-parchment-dim typewriter-text mb-4 leading-relaxed bg-noir/60 p-3 rounded border border-steel/20">
                {selectedEvidence.description}
              </div>

              <div className="bg-noir/90 border border-gold/30 rounded p-3.5 text-xs typewriter-text space-y-2.5 mb-4">
                <div className="text-[10px] text-gold font-bold font-cinematic tracking-wider uppercase">
                  FORENSIC LABORATORY DOSSIER NOTES:
                </div>
                <p className="text-parchment leading-relaxed">{selectedEvidence.detailedNotes}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-steel pt-2 border-t border-steel/20">
                  <span>RECOVERED FROM: <strong className="text-parchment">{selectedEvidence.source}</strong></span>
                  <span>RELIABILITY: <strong className="text-gold font-bold">{selectedEvidence.reliability || 'CONFIRMED'}</strong></span>
                </div>
              </div>

              {/* Connected Suspects */}
              {selectedEvidence.connectedSuspects && selectedEvidence.connectedSuspects.length > 0 && (
                <div className="mb-4">
                  <div className="text-[10px] font-cinematic font-bold text-parchment-dim uppercase tracking-wider mb-1.5">
                    LINKED SUSPECTS:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEvidence.connectedSuspects.map((name) => (
                      <span
                        key={name}
                        className="bg-charcoal border border-steel/40 text-gold px-2.5 py-1 rounded text-xs typewriter-text"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Connections with option to sever */}
              {currentCase.connections.some(
                (c) => c.fromEvidenceId === selectedEvidence.id || c.toEvidenceId === selectedEvidence.id
              ) && (
                <div className="mb-4 bg-noir/50 border border-steel/30 rounded p-3">
                  <div className="text-[10px] font-cinematic font-bold text-parchment-dim uppercase tracking-wider mb-2">
                    ACTIVE RED YARN CONNECTIONS:
                  </div>
                  <div className="space-y-1.5">
                    {currentCase.connections
                      .filter(
                        (c) => c.fromEvidenceId === selectedEvidence.id || c.toEvidenceId === selectedEvidence.id
                      )
                      .map((conn) => {
                        const otherId = conn.fromEvidenceId === selectedEvidence.id ? conn.toEvidenceId : conn.fromEvidenceId;
                        const otherEv = discoveredEvidence.find((e) => e.id === otherId);
                        if (!otherEv) return null;

                        return (
                          <div
                            key={conn.id}
                            className="flex items-center justify-between text-xs typewriter-text bg-charcoal/80 px-2.5 py-1.5 rounded border border-steel/20"
                          >
                            <span className="text-parchment truncate pr-2">
                              ↔ {otherEv.title} {conn.isDeductionValid && <strong className="text-crimson-bright">(Contradiction)</strong>}
                            </span>
                            <button
                              onClick={async () => {
                                soundEngine.playPaperRustle();
                                await removeEvidenceConnection(currentCase.id, conn.id);
                              }}
                              className="text-steel hover:text-crimson-bright p-1"
                              title="Sever Yarn Thread"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedEvidence(null)}
                className="w-full bg-charcoal hover:bg-noir border border-gold/50 text-gold font-cinematic font-bold py-2.5 rounded text-xs transition"
              >
                CLOSE DOSSIER
              </button>
            </div>
          </div>
        )}

        {/* Suspect Dossier Modal */}
        {selectedSuspect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="max-w-lg w-full bg-[#141518] border-2 border-crimson/50 rounded p-6 shadow-dossier max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 border-b border-steel/30 pb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-crimson-bright" />
                  <span className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase tracking-wider">
                    INTERROGATION DOSSIER
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSuspect(null)}
                  className="text-steel hover:text-parchment p-1 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-noir border-2 border-gold/70 flex items-center justify-center text-gold font-cinematic font-bold text-xl shrink-0">
                  {selectedSuspect.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-cinematic font-bold text-parchment">
                    {selectedSuspect.name}
                  </h2>
                  <div className="text-xs text-gold typewriter-text">
                    {selectedSuspect.role}
                  </div>
                </div>
              </div>

              {/* Alibi */}
              <div className="mb-3 bg-noir/80 border border-steel/30 rounded p-3 typewriter-text text-xs space-y-1">
                <div className="text-[10px] font-cinematic font-bold text-parchment uppercase tracking-wider">
                  FORMAL SWORN ALIBI:
                </div>
                <p className="text-parchment-dim italic leading-relaxed">
                  &ldquo;{selectedSuspect.alibi}&rdquo;
                </p>
              </div>

              {/* Motive */}
              <div className="mb-3 bg-noir/80 border border-steel/30 rounded p-3 typewriter-text text-xs space-y-1">
                <div className="text-[10px] font-cinematic font-bold text-parchment uppercase tracking-wider">
                  KNOWN MOTIVE PROFILE:
                </div>
                <p className="text-parchment leading-relaxed">
                  {selectedSuspect.motiveSummary}
                </p>
              </div>

              {/* Status Notes */}
              {selectedSuspect.statusNotes && (
                <div className="mb-4 bg-noir/80 border border-gold/30 rounded p-3 typewriter-text text-xs space-y-1">
                  <div className="text-[10px] font-cinematic font-bold text-gold uppercase tracking-wider">
                    INTERROGATION BEHAVIOR & NOTES:
                  </div>
                  <p className="text-parchment leading-relaxed">
                    {selectedSuspect.statusNotes}
                  </p>
                </div>
              )}

              <button
                onClick={() => setSelectedSuspect(null)}
                className="w-full bg-charcoal hover:bg-noir border border-steel/40 text-parchment font-cinematic font-bold py-2.5 rounded text-xs transition"
              >
                RETURN TO WALL
              </button>
            </div>
          </div>
        )}

        {/* Final Accusation Modal */}
        <FinalAccusationModal
          isOpen={accusationModalOpen}
          onClose={() => setAccusationModalOpen(false)}
          caseFile={currentCase}
        />
      </div>
    </GameShell>
  );
}
