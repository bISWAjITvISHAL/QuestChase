'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CaseFile } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
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
  Fingerprint,
  Clock,
  Skull,
  HelpCircle,
  Scale,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

interface FinalAccusationModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseFile: CaseFile;
}

const TIMELINE_OPTIONS: Record<string, { id: string; label: string }[]> = {
  case_001: [
    { id: 'time_2225', label: '22:25 PM (Between Marcus dropping watch at 22:24 in garden and carriage leaving gate at 22:31)' },
    { id: 'time_2145', label: '21:45 PM (During dinner service in the main dining hall)' },
    { id: 'time_2330', label: '23:30 PM (When the body was discovered by the night butler)' },
    { id: 'time_0200', label: '02:00 AM (Late night break-in theory)' },
  ],
};

const METHOD_OPTIONS: Record<string, { id: string; label: string }[]> = {
  case_001: [
    { id: 'how_cyanide_pen_scotch', label: "Laced Lord Arthur's fountain pen nib and crystal scotch tumbler with potassium cyanide" },
    { id: 'how_forced_scotch', label: 'Forced ingestion of poison directly from scotch glass' },
    { id: 'how_heart_tonic_overdose', label: "Overdose of Dr. Elena’s prescribed heart tonic" },
    { id: 'how_blunt_force_safe', label: 'Blunt trauma from safe door during theft' },
  ],
};

const MOTIVE_OPTIONS: Record<string, { id: string; label: string }[]> = {
  case_001: [
    { id: 'why_disinheritance_gambling_debt', label: 'Impending disinheritance in favor of Clara Giles and urgent debt to dockside bookmakers' },
    { id: 'why_malpractice_retaliation', label: 'Retaliation for impending Medical Board disciplinary report' },
    { id: 'why_concealed_heiress', label: 'Revenge for 22 years of concealed heiress identity' },
    { id: 'why_theft_bearer_bonds', label: 'Opportunistic robbery of safe bearer bonds' },
  ],
};

export function FinalAccusationModal({
  isOpen,
  onClose,
  caseFile,
}: FinalAccusationModalProps) {
  const router = useRouter();
  const { submitFinalAccusation } = useGameStore();

  const timelineChoices = TIMELINE_OPTIONS[caseFile.id] || TIMELINE_OPTIONS.case_001;
  const methodChoices = METHOD_OPTIONS[caseFile.id] || METHOD_OPTIONS.case_001;
  const motiveChoices = MOTIVE_OPTIONS[caseFile.id] || MOTIVE_OPTIONS.case_001;

  const [accusedSuspectId, setAccusedSuspectId] = useState(caseFile.suspects[0]?.id || '');
  const [timelineTime, setTimelineTime] = useState(timelineChoices[0]?.id || '');
  const [method, setMethod] = useState(methodChoices[0]?.id || '');
  const [motive, setMotive] = useState(motiveChoices[0]?.id || '');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (caseFile.id === 'case_002') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070809]/90 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
        <div className="relative max-w-md w-full bg-[#121316] border-2 border-gold/40 rounded p-6 shadow-dossier text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-steel hover:text-parchment p-1.5 transition rounded hover:bg-charcoal"
            aria-label="Close Accusation Modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-[10px] font-cinematic font-bold text-gold uppercase tracking-widest mb-2">
            METROPOLITAN INVESTIGATION BUREAU • ARCHIVES
          </div>
          <h2 className="text-xl font-cinematic font-black text-parchment mb-2">
            CASE #002: THE SILENT WITNESS
          </h2>
          <div className="inline-block bg-noir border border-steel/50 px-3 py-1 text-xs text-steel font-cinematic font-bold tracking-wider uppercase mb-4">
            CLASSIFIED DOSSIER • COMING SOON
          </div>
          <p className="text-xs text-parchment-dim typewriter-text leading-relaxed mb-6">
            This case file is currently undergoing forensic preparation and is not available for final deduction. Please complete Case #001.
          </p>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-gold via-gold-bright to-gold text-noir font-cinematic font-bold text-xs py-2 px-6 rounded shadow-gold uppercase tracking-wider"
          >
            Close Dossier
          </button>
        </div>
      </div>
    );
  }

  const discoveredEvidence = caseFile.evidence.filter((e) => e.isDiscovered);

  const toggleEvidenceSelection = (id: string) => {
    soundEngine.playPaperRustle();
    setSelectedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    soundEngine.playTypewriter();

    try {
      const outcome = await submitFinalAccusation(
        caseFile.id,
        accusedSuspectId,
        timelineTime,
        method,
        motive,
        selectedEvidenceIds
      );
      if (outcome.isCorrect) {
        soundEngine.playStampThud();
      }
      setResult(outcome);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070809]/90 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative max-w-2xl w-full bg-[#121316] border-2 border-gold/40 rounded p-5 sm:p-7 shadow-dossier max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-steel hover:text-parchment p-1.5 transition rounded hover:bg-charcoal"
          aria-label="Close Accusation Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 border-b border-steel/20 pb-4">
          <div className="flex items-center gap-2 text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase mb-1">
            <Scale className="w-4 h-4" />
            <span>CRIMINOLOGY TRIBUNAL • {caseFile.code}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wide">
            DELIVER FINAL ACCUSATION
          </h2>
          <p className="text-xs text-parchment-dim typewriter-text mt-1 max-w-xl">
            Synthesize your investigative findings into four incontrovertible pillars: <strong>WHO</strong>, <strong>WHEN</strong>, <strong>HOW</strong>, and <strong>WHY</strong>.
          </p>
        </div>

        {result ? (
          <div className="space-y-5">
            <div
              className={`p-6 rounded border-2 shadow-dossier relative overflow-hidden ${
                result.isCorrect
                  ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-100'
                  : 'bg-crimson/20 border-crimson text-red-100'
              }`}
            >
              {/* Bureau Stamp */}
              <div
                className={`absolute top-4 right-4 text-[10px] font-cinematic font-bold px-2 py-0.5 border rotate-6 uppercase opacity-80 ${
                  result.isCorrect
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-crimson-bright text-crimson-bright'
                }`}
              >
                {result.isCorrect ? 'CASE SOLVED' : 'VERDICT REJECTED'}
              </div>

              <div className="flex items-center gap-2.5 font-cinematic font-black text-lg sm:text-xl mb-3">
                {result.isCorrect ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                    <span>DEDUCTION CONFIRMED • CASE CLOSED</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-crimson-bright shrink-0" />
                    <span>DEDUCTION FAILED • INSUFFICIENT PROOF</span>
                  </>
                )}
              </div>

              <p className="text-xs typewriter-text leading-relaxed bg-noir/50 p-3 rounded border border-steel/20 mb-4">
                {result.feedback}
              </p>

              {result.isCorrect && (
                <div className="pt-3 border-t border-emerald-500/30 flex flex-wrap items-center gap-4 text-xs font-cinematic">
                  <span className="flex items-center gap-1.5 text-gold font-bold">
                    <Sparkles className="w-4 h-4 text-gold-bright" /> +{caseFile.rewardXp} XP EARNED
                  </span>
                  <span className="flex items-center gap-1.5 text-gold-bright font-bold">
                    <Coins className="w-4 h-4" /> +{caseFile.rewardGold} GOLD REWARD
                  </span>
                  <span className="flex items-center gap-1.5 text-parchment">
                    <Award className="w-4 h-4 text-gold" /> AWARD: {caseFile.rewardBadge}
                  </span>
                </div>
              )}
            </div>

            {result.isCorrect ? (
              <AnimatedButton
                onClick={() => {
                  onClose();
                  router.push('/headquarters');
                }}
                variant="gold"
                className="w-full min-h-[48px] text-xs font-cinematic font-bold tracking-widest uppercase flex items-center justify-center gap-2"
              >
                <span>RETURN TO DETECTIVE&apos;S DESK</span>
                <ArrowRight className="w-4 h-4 inline" />
              </AnimatedButton>
            ) : (
              <AnimatedButton
                onClick={() => setResult(null)}
                variant="ghost"
                className="w-full min-h-[44px] text-xs font-cinematic font-bold tracking-wider uppercase border border-steel/40 text-parchment"
              >
                <span>RE-EXAMINE THE CASE EVIDENCE &amp; RETRY</span>
              </AnimatedButton>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. WHO */}
            <div>
              <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-crimson-bright" />
                <span>1. WHO IS THE PERPETRATOR? (CULPRIT) *</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {caseFile.suspects.map((s) => {
                  const isSelected = accusedSuspectId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playPaperRustle();
                        setAccusedSuspectId(s.id);
                      }}
                      className={`p-3 text-left rounded border transition tactile-card ${
                        isSelected
                          ? 'bg-crimson/25 border-crimson text-parchment shadow-crimson ring-1 ring-red-400'
                          : 'bg-[#18191c] border-steel/30 text-parchment-dim hover:text-parchment hover:border-steel/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-cinematic font-bold text-xs ${
                            isSelected ? 'bg-crimson text-parchment' : 'bg-noir text-gold'
                          }`}
                        >
                          {s.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-cinematic font-bold text-parchment truncate">
                            {s.name}
                          </div>
                          <div className="text-[10px] text-steel typewriter-text truncate">
                            {s.role}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. WHEN */}
            <div>
              <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span>2. WHEN DID THE CRIME OCCUR? (TIMELINE) *</span>
              </label>
              <select
                value={timelineTime}
                onChange={(e) => setTimelineTime(e.target.value)}
                className="w-full bg-[#18191c] border border-steel/40 focus:border-gold rounded px-3 py-2.5 text-xs text-parchment outline-none typewriter-text"
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
              <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Skull className="w-3.5 h-3.5 text-crimson-bright" />
                <span>3. HOW WAS THE MURDER COMMITTED? (METHOD & WEAPON) *</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-[#18191c] border border-steel/40 focus:border-gold rounded px-3 py-2.5 text-xs text-parchment outline-none typewriter-text"
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
              <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-gold" />
                <span>4. WHAT WAS THE MOTIVE? (WHY) *</span>
              </label>
              <select
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                className="w-full bg-[#18191c] border border-steel/40 focus:border-gold rounded px-3 py-2.5 text-xs text-parchment outline-none typewriter-text"
              >
                {motiveChoices.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. SUPPORTING EVIDENCE */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-gold" />
                  <span>5. SELECT SUPPORTING EVIDENCE</span>
                </label>
                <span className="text-[10px] typewriter-text text-gold font-bold">
                  {selectedEvidenceIds.length} SELECTED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {discoveredEvidence.length === 0 ? (
                  <div className="col-span-2 text-center py-4 text-xs typewriter-text text-steel bg-noir/50 rounded border border-steel/20">
                    No clues discovered yet. Conduct casework and investigate crime scenes to unlock evidence.
                  </div>
                ) : (
                  discoveredEvidence.map((ev) => {
                    const isSelected = selectedEvidenceIds.includes(ev.id);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => toggleEvidenceSelection(ev.id)}
                        className={`p-2.5 rounded border text-xs cursor-pointer flex items-center justify-between transition tactile-card ${
                          isSelected
                            ? 'bg-noir border-gold text-parchment shadow-sm ring-1 ring-gold/40'
                            : 'bg-[#18191c] border-steel/30 text-parchment-dim hover:text-parchment hover:border-steel/60'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-[11px] font-cinematic font-bold truncate">{ev.title}</div>
                          <div className="text-[9px] typewriter-text text-steel truncate">SRC: {ev.source}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] ${
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

            {/* Submit Button */}
            <AnimatedButton
              type="submit"
              loading={isSubmitting}
              loadingText="SUBMITTING TRIBUNAL DEDUCTION..."
              variant="crimson"
              className="w-full min-h-[48px] text-xs font-cinematic font-bold tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 inline mr-1" />
              <span>SUBMIT FINAL DEDUCTION</span>
            </AnimatedButton>
          </form>
        )}
      </div>
    </div>
  );
}
