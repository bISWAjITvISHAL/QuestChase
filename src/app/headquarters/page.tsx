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
  const discoveredClues = currentCase.evidence.filter((e) => e.isDiscovered).length;
  const totalClues = currentCase.evidence.length;
  const investigationPct = Math.round((discoveredClues / totalClues) * 100);

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

  return (
    <GameShell>
      {/* Main Detective's Desk Surface matching Reference Image 3 */}
      <div className="relative w-full min-h-[calc(100vh-8.5rem)] rounded-sm overflow-hidden p-3 sm:p-6 select-none bg-[#110e0b] border-2 border-[#2b2219] shadow-2xl">
        {/* Warm Ambient Lamp Glow in Top Left */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-amber-500/15 rounded-full blur-[90px] pointer-events-none z-0" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] pointer-events-none z-0" />

        {/* Asymmetrical Editorial Composition Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT SIDE: OPEN MANILA CASE FOLDER (Cols 1-7) ================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* Manila Folder Container matching Mockup 3 */}
            <div className="manila-folder rounded-sm p-4 sm:p-6 shadow-2xl relative">
              {/* Folder Tabs at top */}
              <div className="flex items-center justify-between border-b border-[#5a422d] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-[#4a3625] border-t border-x border-[#8c6527] px-3.5 py-1 rounded-t text-xs font-cinematic font-bold text-parchment uppercase tracking-wider">
                    TODAY'S CASEWORK
                  </div>
                  <div className="hidden sm:block text-[11px] typewriter-text text-parchment-dim">
                    TODAY'S QUESTS
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-gold to-gold-bright hover:from-gold-bright hover:to-gold text-noir font-cinematic font-bold text-xs py-1.5 px-3 rounded-sm shadow-gold transition active:scale-95 tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>NEW QUEST</span>
                  </button>
                </div>
              </div>

              {/* Pinned Paper Slips Grid matching Reference Image 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tasks.slice(0, 4).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>

              {tasks.length === 0 && (
                <div className="paper-slip rounded-sm p-8 text-center">
                  <CheckCircle className="w-8 h-8 text-[#5a422d] mx-auto mb-2 opacity-50" />
                  <h3 className="text-sm font-cinematic font-bold text-[#1a1714]">
                    NO ACTIVE CASEWORK
                  </h3>
                  <p className="text-xs text-[#5a422d] typewriter-text mt-1">
                    Your desk is clear. Commission a new objective above to fuel the investigation.
                  </p>
                </div>
              )}
            </div>

            {/* ================= BOTTOM-LEFT: RECENT EVIDENCE SLIPS matching Mockup 3 ================= */}
            <div className="space-y-2">
              <div className="text-xs font-cinematic font-bold text-parchment tracking-wider uppercase flex items-center gap-2">
                <span>RECENT EVIDENCE</span>
                <span className="text-[10px] text-parchment-dim typewriter-text">
                  (CLUES LOGGED FROM CASEWORK)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Evidence Slip 1: Lined Index Card */}
                <div
                  onClick={() => setSelectedEvidenceSlip('fingerprint')}
                  className="bg-[#f2ece1] text-[#1a1714] border border-[#c5b599] rounded p-3 shadow-md relative cursor-pointer hover:scale-102 transition"
                >
                  {/* Paperclip */}
                  <div className="absolute -top-2.5 left-3 w-3.5 h-6 rounded-full border-2 border-slate-600 bg-transparent" />
                  <div className="text-[9px] font-bold font-mono tracking-tight pt-1">
                    FINGERPRINT AD #32,
                  </div>
                  <div className="text-[8px] typewriter-text text-[#5a422d] mt-1">
                    Matched: Marcus Vance (Latent print on safe latch)
                  </div>
                  <div className="mt-2 text-right">
                    <span className="stamp-priority text-[8px] px-1 py-0.5">LOGGED</span>
                  </div>
                </div>

                {/* Evidence Slip 2: Pinned Cinema Ticket */}
                <div
                  onClick={() => setSelectedEvidenceSlip('ticket')}
                  className="bg-[#d49b56] text-[#2b1b0b] border border-[#7a4e1d] rounded p-3 shadow-md relative cursor-pointer hover:scale-102 transition flex flex-col justify-between"
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-crimson border border-gold" />
                  <div className="text-center font-cinematic font-black text-xs border-b border-[#7a4e1d]/40 pb-1">
                    TICKET 713
                  </div>
                  <div className="text-[8px] typewriter-text text-center mt-1">
                    Downtown Gentlemens Club • Admit 22:35 PM
                  </div>
                  <div className="text-[8px] font-bold text-center mt-1">ESTATE CARRIAGE ROUTE</div>
                </div>

                {/* Evidence Slip 3: Bar Itemized Receipt */}
                <div
                  onClick={() => setSelectedEvidenceSlip('receipt')}
                  className="bg-[#f8f6f0] text-[#1a1714] border border-[#d4c5a9] rounded p-3 shadow-md relative cursor-pointer hover:scale-102 transition"
                >
                  <div className="text-[9px] font-bold font-mono text-center border-b border-dashed border-[#a69980] pb-1">
                    BAR RECEIPT #109
                  </div>
                  <div className="text-[8px] font-mono text-[#4a3b2c] mt-1 space-y-0.5">
                    <div className="flex justify-between"><span>Scotch single</span><span>$9.00</span></div>
                    <div className="flex justify-between"><span>Dry vermouth</span><span>$5.00</span></div>
                    <div className="flex justify-between font-bold border-t border-dotted border-[#a69980] pt-0.5"><span>Total</span><span>$14.00</span></div>
                  </div>
                  <div className="mt-1 text-center">
                    <span className="stamp-priority text-[7px] px-1">LOGGED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE: CASE STATUS & DETECTIVE ATTRIBUTES (Cols 8-12) ================= */}
          <div className="lg:col-span-5 space-y-6">
            {/* Top Right: CASE STATUS Card with Speedometer Gauge matching Mockup 3 */}
            <div className="bg-[#f4eee1] text-[#1a1714] border-2 border-[#5a422d] rounded-sm p-5 shadow-2xl relative">
              {/* Paperclip top right */}
              <div className="absolute -top-3 right-6 w-4 h-8 rounded-full border-2 border-slate-600 bg-transparent" />

              <div className="border-b border-[#c5b599] pb-2 mb-3">
                <div className="text-[10px] font-cinematic font-bold text-[#7f2525] uppercase tracking-wider">
                  CASE STATUS
                </div>
                <h3 className="text-base sm:text-lg font-cinematic font-black text-[#1a1714] tracking-wide">
                  {currentCase.title}
                </h3>
              </div>

              {/* Grid: Clues / Suspects / Contradictions + Speedometer Gauge */}
              <div className="grid grid-cols-2 gap-3 items-center mb-4">
                {/* Metrics */}
                <div className="space-y-1.5 text-xs typewriter-text text-[#2b2219]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5a422d]">Clues:</span>
                    <strong className="font-bold">{discoveredClues} / {totalClues}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5a422d]">Suspects:</span>
                    <strong className="font-bold">{currentCase.suspects.length}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5a422d]">Contradictions:</span>
                    <strong className="font-bold text-[#7f2525]">2 DETECTED</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#c5b599]">
                    <span className="text-[#5a422d]">Investigation:</span>
                    <strong className="font-bold text-[#8c6527]">{investigationPct}%</strong>
                  </div>
                </div>

                {/* Vintage Speedometer Gauge matching Mockup 3 */}
                <div className="flex flex-col items-center justify-center relative">
                  <svg className="w-28 h-16" viewBox="0 0 120 70">
                    {/* Gauge Arc Background */}
                    <path
                      d="M 15 60 A 45 45 0 0 1 105 60"
                      fill="none"
                      stroke="#c5b599"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    {/* Gauge Arc Active Fill */}
                    <path
                      d="M 15 60 A 45 45 0 0 1 105 60"
                      fill="none"
                      stroke="#8c6527"
                      strokeWidth="10"
                      strokeDasharray="141"
                      strokeDashoffset={141 - (141 * investigationPct) / 100}
                      strokeLinecap="round"
                    />
                    {/* Gauge Center Pin */}
                    <circle cx="60" cy="60" r="5" fill="#2b2219" />
                    {/* Gauge Needle Pointer */}
                    <line
                      x1="60"
                      y1="60"
                      x2="60"
                      y2="20"
                      stroke="#7f2525"
                      strokeWidth="3"
                      strokeLinecap="round"
                      transform={`rotate(${needleAngle} 60 60)`}
                      className="transition-transform duration-700"
                    />
                  </svg>
                  <div className="text-[10px] font-cinematic font-bold text-[#5a422d] mt-1">
                    SOLVABILITY INDEX
                  </div>
                </div>
              </div>

              {/* Continue Investigation Action Button */}
              <button
                onClick={handleOpenInvestigation}
                className="w-full bg-[#2b2219] hover:bg-[#3d3124] text-[#f4eee1] font-cinematic font-bold text-xs py-2.5 px-4 rounded transition active:scale-95 flex items-center justify-center gap-2 shadow"
              >
                <Search className="w-4 h-4 text-gold" />
                <span>CONTINUE INVESTIGATION</span>
              </button>
            </div>

            {/* Bottom Right: DETECTIVE ATTRIBUTES Card matching Mockup 3 */}
            <div className="bg-[#f4eee1] text-[#1a1714] border-2 border-[#5a422d] rounded-sm p-5 shadow-2xl relative">
              <div className="border-b border-[#c5b599] pb-2 mb-4">
                <h3 className="text-sm font-cinematic font-black text-[#1a1714] tracking-wider uppercase">
                  DETECTIVE ATTRIBUTES
                </h3>
              </div>

              {/* 4 Attributes Grid with Vintage Circular Badges */}
              <div className="grid grid-cols-2 gap-4">
                {/* Intelligence */}
                <div className="flex flex-col items-center text-center p-2 rounded bg-[#eae0cf] border border-[#c5b599]">
                  <div className="w-12 h-12 rounded-full border-2 border-[#5a422d] bg-[#f4eee1] flex items-center justify-center text-[#2b2219] shadow-inner mb-1.5">
                    <Brain className="w-6 h-6 text-[#2b2219]" />
                  </div>
                  <span className="text-[10px] font-cinematic font-bold text-[#1a1714] uppercase">
                    INTELLIGENCE
                  </span>
                  <span className="text-xs font-cinematic font-black text-[#8c6527]">
                    LEVEL {profile.attributes.intelligence || 3}
                  </span>
                </div>

                {/* Perception */}
                <div className="flex flex-col items-center text-center p-2 rounded bg-[#eae0cf] border border-[#c5b599]">
                  <div className="w-12 h-12 rounded-full border-2 border-[#5a422d] bg-[#f4eee1] flex items-center justify-center text-[#2b2219] shadow-inner mb-1.5">
                    <Eye className="w-6 h-6 text-[#2b2219]" />
                  </div>
                  <span className="text-[10px] font-cinematic font-bold text-[#1a1714] uppercase">
                    PERCEPTION
                  </span>
                  <span className="text-xs font-cinematic font-black text-[#8c6527]">
                    LEVEL {profile.attributes.perception || 3}
                  </span>
                </div>

                {/* Discipline */}
                <div className="flex flex-col items-center text-center p-2 rounded bg-[#eae0cf] border border-[#c5b599]">
                  <div className="w-12 h-12 rounded-full border-2 border-[#5a422d] bg-[#f4eee1] flex items-center justify-center text-[#2b2219] shadow-inner mb-1.5">
                    <Sparkles className="w-6 h-6 text-[#2b2219]" />
                  </div>
                  <span className="text-[10px] font-cinematic font-bold text-[#1a1714] uppercase">
                    DISCIPLINE
                  </span>
                  <span className="text-xs font-cinematic font-black text-[#8c6527]">
                    LEVEL {profile.attributes.discipline || 8}
                  </span>
                </div>

                {/* Resilience */}
                <div className="flex flex-col items-center text-center p-2 rounded bg-[#eae0cf] border border-[#c5b599]">
                  <div className="w-12 h-12 rounded-full border-2 border-[#5a422d] bg-[#f4eee1] flex items-center justify-center text-[#2b2219] shadow-inner mb-1.5">
                    <Shield className="w-6 h-6 text-[#2b2219]" />
                  </div>
                  <span className="text-[10px] font-cinematic font-bold text-[#1a1714] uppercase">
                    RESILIENCE
                  </span>
                  <span className="text-xs font-cinematic font-black text-[#8c6527]">
                    LEVEL {profile.attributes.resilience || 2}
                  </span>
                </div>
              </div>

              {/* Case Board Link Button */}
              <div className="mt-4 pt-3 border-t border-[#c5b599]">
                <button
                  onClick={handleOpenBoard}
                  className="w-full bg-[#eae0cf] hover:bg-[#ded1bc] border border-[#8c7355] text-[#2b2219] font-cinematic font-bold text-xs py-2 px-3 rounded transition flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#7f2525]" />
                  <span>VIEW 2D/3D EVIDENCE BOARD & THREADS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </GameShell>
  );
}
