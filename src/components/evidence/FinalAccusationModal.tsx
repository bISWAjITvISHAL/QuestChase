'use client';

import React, { useState } from 'react';
import { CaseFile } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import {
  X,
  ShieldAlert,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  FileCheck,
  Coins,
  Sparkles,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

interface FinalAccusationModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseFile: CaseFile;
}

const TIMELINE_OPTIONS: Record<string, { id: string; label: string }[]> = {
  case_001: [
    { id: 'time_2225', label: '22:25 PM (Contradicts gatekeeper departure log and broken watch)' },
    { id: 'time_2145', label: '21:45 PM (During dinner service in the main dining hall)' },
    { id: 'time_2330', label: '23:30 PM (When the body was discovered by the night butler)' },
    { id: 'time_0200', label: '02:00 AM (Late night break-in theory)' },
  ],
  case_002: [
    { id: 'time_0245', label: '02:45 AM (During VIP Gala tour in the main atrium)' },
    { id: 'time_0115', label: '01:15 AM (Before gala doors opened)' },
    { id: 'time_0330', label: '03:30 AM (After security shift handover)' },
    { id: 'time_0415', label: '04:15 AM (Dawn vault perimeter inspection)' },
  ],
};

const METHOD_OPTIONS: Record<string, { id: string; label: string }[]> = {
  case_001: [
    { id: 'how_cyanide_pen_scotch', label: "Laced Lord Arthur's fountain pen nib and crystal scotch tumbler with potassium cyanide" },
    { id: 'how_forced_scotch', label: 'Forced ingestion of poison directly from scotch glass' },
    { id: 'how_heart_tonic_overdose', label: "Overdose of Dr. Elena’s prescribed heart tonic" },
    { id: 'how_blunt_force_safe', label: 'Blunt trauma from safe door during theft' },
  ],
  case_002: [
    { id: 'how_master_keycard_degausser', label: 'Used curator master keycard and magnetic degausser to bypass biometric lock' },
    { id: 'how_vent_shaft_entry', label: 'Infiltrated via ceiling ventilation shaft' },
    { id: 'how_glass_cutter', label: 'Cut display case using diamond-tipped glass cutter' },
    { id: 'how_power_grid_cut', label: 'Triggered emergency blackout via basement circuit breaker' },
  ],
};

const MOTIVE_OPTIONS: Record<string, { id: string; label: string }[]> = {
  case_001: [
    { id: 'why_disinheritance_gambling_debt', label: 'Impending disinheritance in favor of Clara Giles and urgent debt to dockside bookmakers' },
    { id: 'why_malpractice_retaliation', label: 'Retaliation for impending Medical Board disciplinary report' },
    { id: 'why_concealed_heiress', label: 'Revenge for 22 years of concealed heiress identity' },
    { id: 'why_theft_bearer_bonds', label: 'Opportunistic robbery of safe bearer bonds' },
  ],
  case_002: [
    { id: 'why_forgery_offshore_payout', label: 'Swap genuine sapphire for forgery to satisfy offshore collector debt' },
    { id: 'why_insurance_fraud', label: 'Stage robbery for multi-million insurance claim' },
    { id: 'why_curator_rivalry', label: 'Frame assistant curator for gallery sabotage' },
    { id: 'why_art_syndicate_blackmail', label: 'Blackmailed by international art syndicate' },
  ],
};

export function FinalAccusationModal({
  isOpen,
  onClose,
  caseFile,
}: FinalAccusationModalProps) {
  const { submitFinalAccusation } = useGameStore();

  const timelineChoices = TIMELINE_OPTIONS[caseFile.id] || TIMELINE_OPTIONS.case_001;
  const methodChoices = METHOD_OPTIONS[caseFile.id] || METHOD_OPTIONS.case_001;
  const motiveChoices = MOTIVE_OPTIONS[caseFile.id] || MOTIVE_OPTIONS.case_001;

  const [accusedSuspectId, setAccusedSuspectId] = useState(caseFile.suspects[0]?.id || '');
  const [timelineTime, setTimelineTime] = useState(timelineChoices[0]?.id || '');
  const [method, setMethod] = useState(methodChoices[0]?.id || '');
  const [motive, setMotive] = useState(motiveChoices[0]?.id || '');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);

  if (!isOpen) return null;

  const discoveredEvidence = caseFile.evidence.filter((e) => e.isDiscovered);

  const toggleEvidenceSelection = (id: string) => {
    soundEngine.playPaperRustle();
    setSelectedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playTypewriter();

    const outcome = await submitFinalAccusation(
      caseFile.id,
      accusedSuspectId,
      timelineTime,
      method,
      motive,
      selectedEvidenceIds
    );
    setResult(outcome);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/85 backdrop-blur-lg p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative max-w-2xl w-full bg-charcoal border-2 border-crimson rounded-sm p-5 sm:p-7 shadow-dossier max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-steel hover:text-parchment p-1 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase">
            <ShieldAlert className="w-4 h-4" />
            <span>FINAL DEDUCTION • {caseFile.code}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wide">
            SOLVE THE CASE
          </h2>
          <p className="text-xs text-parchment-dim typewriter-text mt-1">
            Reconcile all discovered evidence threads. Form the four canonical pillars of deduction: <strong>WHO</strong>, <strong>WHEN</strong>, <strong>HOW</strong>, and <strong>WHY</strong>.
          </p>
        </div>

        {result ? (
          <div className="space-y-4">
            <div
              className={`p-5 rounded-sm border ${
                result.isCorrect
                  ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                  : 'bg-crimson/25 border-crimson text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-cinematic font-black text-lg mb-2">
                {result.isCorrect ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                    <span>DEDUCTION CONFIRMED • CASE SOLVED</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-crimson" />
                    <span>DEDUCTION FAILED • INCONCLUSIVE CASEWORK</span>
                  </>
                )}
              </div>
              <p className="text-xs typewriter-text leading-relaxed">{result.feedback}</p>

              {result.isCorrect && (
                <div className="mt-4 pt-4 border-t border-emerald-500/30 flex flex-wrap items-center gap-4 text-xs font-cinematic">
                  <span className="flex items-center gap-1 text-gold">
                    <Sparkles className="w-4 h-4" /> +{caseFile.rewardXp} XP
                  </span>
                  <span className="flex items-center gap-1 text-gold-bright font-bold">
                    <Coins className="w-4 h-4" /> +{caseFile.rewardGold} GOLD
                  </span>
                  <span className="flex items-center gap-1 text-parchment">
                    <Award className="w-4 h-4 text-gold" /> BADGE: {caseFile.rewardBadge}
                  </span>
                </div>
              )}
            </div>

            {result.isCorrect ? (
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-bright text-noir font-cinematic font-bold py-3.5 rounded-sm shadow-gold text-xs tracking-widest uppercase"
              >
                <span>RETURN TO DETECTIVE'S DESK</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setResult(null)}
                className="w-full flex items-center justify-center gap-2 bg-charcoal hover:bg-noir border border-steel/40 text-parchment font-cinematic font-bold py-2.5 rounded-sm text-xs"
              >
                <span>REVIEW THE CASE & TRY AGAIN</span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. WHO */}
            <div>
              <label className="block text-xs font-cinematic font-bold text-parchment-dim uppercase tracking-wider mb-1.5">
                1. WHO IS THE PERPETRATOR? (CULPRIT) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {caseFile.suspects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setAccusedSuspectId(s.id)}
                    className={`p-3 text-left rounded border transition ${
                      accusedSuspectId === s.id
                        ? 'bg-crimson/25 border-crimson text-parchment shadow-crimson ring-1 ring-red-400'
                        : 'bg-noir border-steel/30 text-parchment-dim hover:text-parchment'
                    }`}
                  >
                    <div className="text-xs font-cinematic font-bold text-parchment">
                      {s.name}
                    </div>
                    <div className="text-[10px] text-parchment-dim typewriter-text mt-0.5">
                      {s.role}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. WHEN */}
            <div>
              <label className="block text-xs font-cinematic font-bold text-parchment-dim uppercase tracking-wider mb-1.5">
                2. WHEN DID THE CRIME OCCUR? (TIMELINE) *
              </label>
              <select
                value={timelineTime}
                onChange={(e) => setTimelineTime(e.target.value)}
                className="w-full bg-noir border border-steel/40 focus:border-gold rounded-sm px-3 py-2 text-xs text-parchment outline-none typewriter-text"
              >
                {timelineChoices.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. HOW */}
            <div>
              <label className="block text-xs font-cinematic font-bold text-parchment-dim uppercase tracking-wider mb-1.5">
                3. HOW WAS THE MURDER COMMITTED? (METHOD & WEAPON) *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-noir border border-steel/40 focus:border-gold rounded-sm px-3 py-2 text-xs text-parchment outline-none typewriter-text"
              >
                {methodChoices.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. WHY */}
            <div>
              <label className="block text-xs font-cinematic font-bold text-parchment-dim uppercase tracking-wider mb-1.5">
                4. WHAT WAS THE MOTIVE? (WHY) *
              </label>
              <select
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                className="w-full bg-noir border border-steel/40 focus:border-gold rounded-sm px-3 py-2 text-xs text-parchment outline-none typewriter-text"
              >
                {motiveChoices.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. SUPPORTING EVIDENCE SELECTION */}
            <div>
              <label className="block text-xs font-cinematic font-bold text-parchment-dim uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>5. WHICH DISCOVERED EVIDENCE SUPPORTS YOUR THEORY?</span>
                <span className="text-[10px] text-gold">{selectedEvidenceIds.length} SELECTED</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {discoveredEvidence.length === 0 ? (
                  <div className="col-span-2 text-center py-4 text-xs typewriter-text text-steel">
                    No clues discovered yet. Conduct casework and investigate crime scenes to unlock evidence.
                  </div>
                ) : (
                  discoveredEvidence.map((ev) => {
                    const isSelected = selectedEvidenceIds.includes(ev.id);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => toggleEvidenceSelection(ev.id)}
                        className={`p-2 rounded border text-xs cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-noir border-gold text-parchment'
                            : 'bg-noir/50 border-steel/30 text-parchment-dim hover:text-parchment'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-[11px] font-cinematic font-bold truncate">{ev.title}</div>
                          <div className="text-[9px] typewriter-text text-steel truncate">{ev.source}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-gold text-noir font-bold' : 'border border-steel/50'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Submit Deduction */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-crimson to-crimson-bright hover:from-crimson-bright hover:to-crimson text-parchment font-cinematic font-black py-3.5 rounded-sm shadow-crimson transition tracking-widest text-xs uppercase active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>SUBMIT FINAL DEDUCTION</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
