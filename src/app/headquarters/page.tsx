'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameShell } from '@/components/layout/GameShell';
import { useGameStore } from '@/lib/store';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import {
  Search,
  Plus,
  ArrowRight,
  Brain,
  Eye,
  Shield,
  Sparkles,
  Share2,
  FileText,
  Clock,
  Compass,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export default function DetectivesDeskPage() {
  const router = useRouter();
  const { profile, tasks, cases, activeCaseId } = useGameStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedEvidenceSlip, setSelectedEvidenceSlip] = useState<string | null>(null);

  const currentCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const discoveredClues = currentCase.evidence.filter((e) => e.isDiscovered);
  const discoveredCluesCount = discoveredClues.length;
  const totalClues = currentCase.evidence.length;
  const investigationPct = Math.round((discoveredCluesCount / totalClues) * 100);

  // Active attribute tooltip/modal state
  const [selectedAttribute, setSelectedAttribute] = useState<{
    name: string;
    level: number;
    description: string;
    applications: string[];
  } | null>(null);

  // Speedometer needle rotation angle (-90deg to +90deg)
  const needleAngle = -90 + (investigationPct / 100) * 180;

  const handleOpenInvestigation = () => {
    soundEngine.playPaperRustle();
    router.push(`/investigate/${currentCase.id}`);
  };

  const handleOpenBoard = () => {
    soundEngine.playPaperRustle();
    router.push(`/board/${currentCase.id}`);
  };

  const attributeDetails: Record<
    string,
    { name: string; description: string; applications: string[] }
  > = {
    intelligence: {
      name: 'INTELLIGENCE',
      description: 'Powers digital forensics, cipher decryption, and document analysis.',
      applications: ['Encrypted Laptop recovery', 'Financial audit reconciliations', 'Safe combination analysis'],
    },
    perception: {
      name: 'PERCEPTION',
      description: 'Powers physical crime scene searches, latent fingerprints, and micro-clues.',
      applications: ['Latent fingerprint lifting', 'Concealed compartment detection', 'Physical timeline trace'],
    },
    discipline: {
      name: 'DISCIPLINE',
      description: 'Powers rigorous casework habits, routine diligence, and interrogation stamina.',
      applications: ['Suspect statement consistency', 'Long-lead investigation focus', 'Contradiction reconciliation'],
    },
    resilience: {
      name: 'RESILIENCE',
      description: 'Powers high-pressure undercover composure, mental fortitude, and danger resistance.',
      applications: ['High-stakes confrontation', 'Hostile witness interrogation', 'Undercover surveillance endurance'],
    },
  };

  return (
    <GameShell>
      {/* Main Detective's Desk Surface */}
      <div className="relative w-full min-h-[calc(100vh-8.5rem)] rounded-sm overflow-hidden p-3 sm:p-6 select-none desk-surface border border-steel/30 shadow-2xl">
        {/* Warm Ambient Lamp Glow */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none z-0" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

        {/* Editorial Desk Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT SIDE: OPEN MANILA CASE FOLDER (Cols 1-7) ================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* Manila Folder Container */}
            <div className="manila-folder rounded-sm p-4 sm:p-6 shadow-2xl relative">
              {/* Folder Tabs at top */}
              <div className="flex items-center justify-between border-b border-[#5a422d] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-[#4a3625] border-t border-x border-[#8c6527] px-3.5 py-1 rounded-t text-xs font-cinematic font-bold text-parchment uppercase tracking-wider">
                    TODAY'S CASEWORK
                  </div>
                  <div className="hidden sm:block text-[11px] typewriter-text text-parchment-dim">
                    ACTIVE QUEST DOCKETS
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-gold to-gold-bright hover:from-gold-bright hover:to-gold text-noir font-cinematic font-black text-xs py-1.5 px-3.5 rounded-sm shadow-gold transition active:scale-95 tracking-wider tactile-btn"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>NEW QUEST</span>
                  </button>
                </div>
              </div>

              {/* Pinned Paper Slips Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tasks.slice(0, 4).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>

              {tasks.length === 0 && (
                <div className="paper-slip rounded-sm p-8 text-center border border-[#d4c5a9]">
                  <CheckCircle className="w-8 h-8 text-[#5a422d] mx-auto mb-2 opacity-50" />
                  <h3 className="text-sm font-cinematic font-bold text-[#1a1714]">
                    NO ACTIVE CASEWORK DOCKETS
                  </h3>
                  <p className="text-xs text-[#5a422d] typewriter-text mt-1">
                    Your desk is clear. Commission a new objective above to fuel the investigation with Gold and XP.
                  </p>
                </div>
              )}
            </div>

            {/* ================= BOTTOM-LEFT: RECENT EVIDENCE LOGGED ================= */}
            <div className="space-y-2">
              <div className="text-xs font-cinematic font-bold text-parchment tracking-wider uppercase flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>DISCOVERED CASE EVIDENCE</span>
                  <span className="text-[10px] text-parchment-dim typewriter-text">
                    ({discoveredCluesCount} of {totalClues} LOGGED)
                  </span>
                </div>
                <button
                  onClick={handleOpenBoard}
                  className="text-[10px] font-cinematic font-bold text-gold hover:text-parchment transition flex items-center gap-1"
                >
                  <span>VIEW FULL BOARD</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {discoveredClues.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {discoveredClues.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvidenceSlip(ev.id)}
                      className="bg-[#181512] border border-gold/40 text-parchment rounded p-3 shadow-md relative cursor-pointer hover:border-gold transition flex flex-col justify-between min-h-[110px] tactile-card"
                    >
                      {/* Brass Pushpin */}
                      <div className="absolute -top-2 left-3 w-3 h-3 rounded-full bg-crimson border border-gold brass-pin" />

                      <div>
                        <div className="text-[9px] font-bold font-cinematic text-gold uppercase tracking-tight pt-1 flex justify-between">
                          <span>{ev.type}</span>
                          <span className="text-crimson-bright">CLUE #{ev.id.replace('ev_', '')}</span>
                        </div>
                        <div className="text-xs font-cinematic font-bold text-parchment mt-1 line-clamp-1">
                          {ev.title}
                        </div>
                        <div className="text-[9px] typewriter-text text-parchment-dim mt-0.5 line-clamp-2">
                          "{ev.description}"
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-steel/20 flex items-center justify-between text-[8px] typewriter-text text-steel">
                        <span>SOURCE: {ev.source}</span>
                        <span className="text-gold font-bold">{ev.reliability || 'HIGH'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#161310] border border-steel/30 rounded p-4 text-center">
                  <div className="text-xs font-cinematic font-bold text-parchment">
                    NO FORENSIC EVIDENCE LOGGED YET
                  </div>
                  <p className="text-[10px] typewriter-text text-parchment-dim mt-1 max-w-md mx-auto">
                    Complete your daily casework dockets to acquire Gold, then enter the 3D Crime Scene to inspect hotspots and unlock critical clues.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT SIDE: CASE STATUS & DETECTIVE ATTRIBUTES (Cols 8-12) ================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* Top Right: CASE STATUS Card with Speedometer Gauge */}
            <div className="bg-[#161310] border border-gold/40 rounded-sm p-5 shadow-2xl relative">
              <div className="border-b border-steel/30 pb-2 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase tracking-wider">
                    CASE DOSSIER • {currentCase.code}
                  </div>
                  <h3 className="text-base sm:text-lg font-cinematic font-black text-parchment tracking-wide">
                    {currentCase.title}
                  </h3>
                </div>
                <div className="text-[9px] font-cinematic font-bold px-2 py-0.5 bg-crimson/20 border border-crimson/60 text-parchment rounded">
                  {currentCase.status}
                </div>
              </div>

              {/* Grid: Clues / Suspects / Contradictions + Speedometer Gauge */}
              <div className="grid grid-cols-2 gap-3 items-center mb-4">
                {/* Metrics */}
                <div className="space-y-1.5 text-xs typewriter-text text-parchment-dim">
                  <div className="flex items-center justify-between">
                    <span>Clues:</span>
                    <strong className="text-gold font-cinematic font-bold">
                      {discoveredCluesCount} / {totalClues}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Suspects:</span>
                    <strong className="text-parchment font-cinematic font-bold">
                      {currentCase.suspects.length} PERSONS
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Contradictions:</span>
                    <strong className="text-crimson-bright font-cinematic font-bold">
                      2 DETECTED
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-steel/30">
                    <span>Solvability:</span>
                    <strong className="text-amber-400 font-cinematic font-bold">
                      {investigationPct}%
                    </strong>
                  </div>
                </div>

                {/* Vintage Speedometer Gauge */}
                <div className="flex flex-col items-center justify-center relative">
                  <svg className="w-28 h-16" viewBox="0 0 120 70">
                    {/* Gauge Arc Background */}
                    <path
                      d="M 15 60 A 45 45 0 0 1 105 60"
                      fill="none"
                      stroke="#2c251e"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    {/* Gauge Arc Active Fill */}
                    <path
                      d="M 15 60 A 45 45 0 0 1 105 60"
                      fill="none"
                      stroke="#A88952"
                      strokeWidth="10"
                      strokeDasharray="141"
                      strokeDashoffset={141 - (141 * investigationPct) / 100}
                      strokeLinecap="round"
                    />
                    {/* Gauge Center Pin */}
                    <circle cx="60" cy="60" r="5" fill="#161310" stroke="#A88952" strokeWidth="2" />
                    {/* Gauge Needle Pointer */}
                    <line
                      x1="60"
                      y1="60"
                      x2="60"
                      y2="20"
                      stroke="#A82B2B"
                      strokeWidth="3"
                      strokeLinecap="round"
                      transform={`rotate(${needleAngle} 60 60)`}
                      className="transition-transform duration-700"
                    />
                  </svg>
                  <div className="text-[10px] font-cinematic font-bold text-gold mt-1">
                    SOLVABILITY INDEX
                  </div>
                </div>
              </div>

              {/* Continue Investigation Action Button */}
              <button
                onClick={handleOpenInvestigation}
                className="w-full bg-gradient-to-r from-crimson to-crimson-bright hover:from-crimson-bright hover:to-crimson text-parchment font-cinematic font-bold text-xs py-2.5 px-4 rounded transition active:scale-95 flex items-center justify-center gap-2 shadow-crimson tactile-btn"
              >
                <Search className="w-4 h-4 text-parchment" />
                <span>ENTER CRIME SCENE FORENSICS</span>
              </button>
            </div>

            {/* Bottom Right: DETECTIVE ATTRIBUTES Card */}
            <div className="bg-[#161310] border border-steel/40 rounded-sm p-5 shadow-2xl relative">
              <div className="border-b border-steel/30 pb-2 mb-4 flex items-center justify-between">
                <h3 className="text-sm font-cinematic font-black text-parchment tracking-wider uppercase">
                  DETECTIVE ATTRIBUTES
                </h3>
                <span className="text-[9px] text-parchment-dim typewriter-text">
                  CLICK STAT FOR FORENSIC SCOPE
                </span>
              </div>

              {/* 4 Attributes Grid with Vintage Badges */}
              <div className="grid grid-cols-2 gap-3">
                {/* Intelligence */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPaperRustle();
                    setSelectedAttribute({
                      ...attributeDetails.intelligence,
                      level: profile.attributes.intelligence || 3,
                    });
                  }}
                  className="flex flex-col items-center text-center p-3 rounded bg-noir/70 border border-steel/30 hover:border-gold transition tactile-btn"
                >
                  <div className="w-10 h-10 rounded-full border border-gold/40 bg-charcoal flex items-center justify-center text-gold shadow-inner mb-1.5">
                    <Brain className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-[10px] font-cinematic font-bold text-parchment uppercase">
                    INTELLIGENCE
                  </span>
                  <span className="text-xs font-cinematic font-black text-gold">
                    LEVEL {profile.attributes.intelligence || 3}
                  </span>
                </button>

                {/* Perception */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPaperRustle();
                    setSelectedAttribute({
                      ...attributeDetails.perception,
                      level: profile.attributes.perception || 3,
                    });
                  }}
                  className="flex flex-col items-center text-center p-3 rounded bg-noir/70 border border-steel/30 hover:border-gold transition tactile-btn"
                >
                  <div className="w-10 h-10 rounded-full border border-gold/40 bg-charcoal flex items-center justify-center text-gold shadow-inner mb-1.5">
                    <Eye className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-[10px] font-cinematic font-bold text-parchment uppercase">
                    PERCEPTION
                  </span>
                  <span className="text-xs font-cinematic font-black text-gold">
                    LEVEL {profile.attributes.perception || 3}
                  </span>
                </button>

                {/* Discipline */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPaperRustle();
                    setSelectedAttribute({
                      ...attributeDetails.discipline,
                      level: profile.attributes.discipline || 8,
                    });
                  }}
                  className="flex flex-col items-center text-center p-3 rounded bg-noir/70 border border-steel/30 hover:border-gold transition tactile-btn"
                >
                  <div className="w-10 h-10 rounded-full border border-gold/40 bg-charcoal flex items-center justify-center text-gold shadow-inner mb-1.5">
                    <Sparkles className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-[10px] font-cinematic font-bold text-parchment uppercase">
                    DISCIPLINE
                  </span>
                  <span className="text-xs font-cinematic font-black text-gold">
                    LEVEL {profile.attributes.discipline || 8}
                  </span>
                </button>

                {/* Resilience */}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPaperRustle();
                    setSelectedAttribute({
                      ...attributeDetails.resilience,
                      level: profile.attributes.resilience || 2,
                    });
                  }}
                  className="flex flex-col items-center text-center p-3 rounded bg-noir/70 border border-steel/30 hover:border-gold transition tactile-btn"
                >
                  <div className="w-10 h-10 rounded-full border border-gold/40 bg-charcoal flex items-center justify-center text-gold shadow-inner mb-1.5">
                    <Shield className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-[10px] font-cinematic font-bold text-parchment uppercase">
                    RESILIENCE
                  </span>
                  <span className="text-xs font-cinematic font-black text-gold">
                    LEVEL {profile.attributes.resilience || 2}
                  </span>
                </button>
              </div>

              {/* Case Board Link Button */}
              <div className="mt-4 pt-3 border-t border-steel/30">
                <button
                  onClick={handleOpenBoard}
                  className="w-full bg-charcoal hover:bg-noir border border-gold/40 text-gold hover:text-parchment font-cinematic font-bold text-xs py-2 px-3 rounded transition flex items-center justify-center gap-1.5 tactile-btn"
                >
                  <Share2 className="w-3.5 h-3.5 text-crimson-bright" />
                  <span>OPEN EVIDENCE BOARD & RED YARN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attribute Purpose Modal */}
      {selectedAttribute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-[#181512] border-2 border-gold rounded-sm p-6 shadow-gold text-parchment relative">
            <div className="flex items-center justify-between border-b border-steel/30 pb-2 mb-3">
              <div>
                <span className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase">
                  BUREAU PROFICIENCY DOSSIER
                </span>
                <h3 className="text-xl font-cinematic font-black text-gold">
                  {selectedAttribute.name} • LEVEL {selectedAttribute.level}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAttribute(null)}
                className="text-steel hover:text-parchment p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs typewriter-text text-parchment-dim leading-relaxed mb-4">
              {selectedAttribute.description}
            </p>

            <div className="bg-noir/90 border border-steel/30 rounded p-3 text-xs typewriter-text space-y-1.5 mb-5">
              <div className="text-[10px] font-cinematic font-bold text-gold uppercase">
                INVESTIGATIVE CAPABILITIES & APPLICATIONS:
              </div>
              {selectedAttribute.applications.map((app, i) => (
                <div key={i} className="flex items-center gap-2 text-parchment-dim">
                  <span className="text-crimson-bright font-bold">▶</span>
                  <span>{app}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedAttribute(null)}
              className="w-full bg-gold hover:bg-gold-bright text-noir font-cinematic font-bold text-xs py-2.5 rounded-sm transition tracking-wider uppercase"
            >
              ACKNOWLEDGE CLEARANCE
            </button>
          </div>
        </div>
      )}

      {/* Evidence Slip Dossier Modal */}
      {selectedEvidenceSlip && (() => {
        const ev = currentCase.evidence.find((e) => e.id === selectedEvidenceSlip);
        if (!ev) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="max-w-md w-full bg-[#181512] border-2 border-gold/60 rounded-sm p-6 shadow-gold text-parchment relative">
              <div className="flex items-center justify-between border-b border-steel/30 pb-2 mb-3">
                <div>
                  <span className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase">
                    EVIDENCE RECORD • {ev.type}
                  </span>
                  <h3 className="text-lg font-cinematic font-black text-parchment">
                    {ev.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEvidenceSlip(null)}
                  className="text-steel hover:text-parchment p-1"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs typewriter-text text-parchment-dim leading-relaxed mb-4 border-l-2 border-gold/40 pl-3">
                "{ev.description}"
              </div>

              <div className="bg-noir/90 border border-steel/30 rounded p-3 text-xs typewriter-text space-y-1.5 mb-5">
                <div className="flex justify-between">
                  <span className="text-steel">RECOVERED FROM:</span>
                  <span className="text-parchment font-bold">{ev.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">RELIABILITY:</span>
                  <span className="text-gold font-bold">{ev.reliability || 'HIGH'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">CONNECTED SUSPECTS:</span>
                  <span className="text-crimson-bright font-bold">{ev.connectedSuspects?.join(', ') || 'Under Analysis'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedEvidenceSlip(null);
                    handleOpenBoard();
                  }}
                  className="flex-1 bg-gold hover:bg-gold-bright text-noir font-cinematic font-bold text-xs py-2.5 rounded-sm transition tracking-wider uppercase flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>VIEW ON CASE BOARD</span>
                </button>
                <button
                  onClick={() => setSelectedEvidenceSlip(null)}
                  className="bg-charcoal hover:bg-noir border border-steel/40 text-parchment font-cinematic font-bold text-xs px-4 py-2.5 rounded-sm transition"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </GameShell>
  );
}
