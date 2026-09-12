'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { TaskCategory, TaskDifficulty, TaskPriority, AttributeType } from '@/lib/types';
import { DIFFICULTY_REWARDS } from '@/lib/initialData';
import {
  X,
  Plus,
  Coins,
  Clock,
  Calendar,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from '@/components/ui/AnimatedButton';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { addTask } = useGameStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Discipline');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('B');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [dueDate, setDueDate] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape key press
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

  const currentRewards = DIFFICULTY_REWARDS[difficulty] || DIFFICULTY_REWARDS['B'] || {
    xp: 120,
    gold: 35,
    attributeXp: 18,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Quest title cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    soundEngine.playStampThud();

    // Map Category to attribute growth
    const attributeRewards: Partial<Record<AttributeType, number>> = {};
    if (category === 'Intelligence' || category === 'Coding') {
      attributeRewards.intelligence = currentRewards.attributeXp;
    } else if (category === 'Perception' || category === 'Reading') {
      attributeRewards.perception = currentRewards.attributeXp;
    } else if (category === 'Discipline' || category === 'Fitness' || category === 'Study') {
      attributeRewards.discipline = currentRewards.attributeXp;
    } else {
      attributeRewards.resilience = currentRewards.attributeXp;
    }

    try {
      await addTask({
        title: title.trim().toUpperCase(),
        description: description.trim(),
        category,
        difficulty,
        priority,
        xpReward: currentRewards.xp,
        goldReward: currentRewards.gold,
        attributeRewards,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      // Reset form & close
      setTitle('');
      setDescription('');
      setCategory('Discipline');
      setDifficulty('B');
      setPriority('HIGH');
      setDueDate('');
      setValidationError('');
      onClose();
    } catch (err: unknown) {
      console.error('Failed to create task:', err);
      const msg = err instanceof Error ? err.message : 'Failed to commission quest.';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-quest-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-noir/85 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="relative max-w-lg w-full bg-[#121316] text-parchment border-2 border-gold/40 rounded p-6 shadow-dossier max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-steel/30 pb-3 mb-4">
          <div>
            <div className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase tracking-wider">
              METROPOLITAN INVESTIGATION BUREAU
            </div>
            <h2 id="create-quest-title" className="text-xl font-cinematic font-black text-parchment tracking-wide">
              FILE NEW QUEST DOCKET
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded text-steel hover:text-parchment hover:bg-charcoal transition cursor-pointer focus-visible:ring-1 focus-visible:ring-gold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-1">
              QUEST TITLE (REAL-WORLD OBJECTIVE) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="e.g. COMPLETE DATA STRUCTURES SPRINT or RUN 5KM"
              className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded pl-3 pr-3 py-2 text-xs text-parchment font-medium typewriter-text outline-none transition placeholder:text-steel focus:ring-1 focus:ring-gold/30"
            />
            {validationError && (
              <p className="text-[10px] text-crimson-bright font-bold mt-1 typewriter-text">
                {validationError}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-1">
              DETAILS & SUCCESS CRITERIA (OPTIONAL):
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify milestones, pages, or focus intervals..."
              className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded p-3 text-xs text-parchment typewriter-text outline-none transition placeholder:text-steel focus:ring-1 focus:ring-gold/30"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-1">
              ATTRIBUTE & DISCIPLINE DOMAIN:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded px-3 py-2 text-xs text-parchment outline-none font-cinematic"
            >
              <option value="Discipline">Discipline (Habits, Routines, Focus)</option>
              <option value="Intelligence">Intelligence (Coding, Learning, Analysis)</option>
              <option value="Perception">Perception (Reading, Research, Review)</option>
              <option value="Resilience">Resilience (Fitness, Health, Undercover Fortitude)</option>
            </select>
          </div>

          {/* Difficulty Tier */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider">
                DIFFICULTY / EFFORT &amp; REWARD:
              </label>
              <span className="text-[10px] text-gold font-bold font-cinematic">
                {difficulty === 'E' || difficulty === 'D'
                  ? `EASY (TIER ${difficulty})`
                  : difficulty === 'C' || difficulty === 'B'
                  ? `MEDIUM (TIER ${difficulty})`
                  : `HARD (TIER ${difficulty})`}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1 sm:gap-2 mb-3">
              {(
                [
                  { tier: 'E' as TaskDifficulty, label: 'E', sub: 'Easy' },
                  { tier: 'D' as TaskDifficulty, label: 'D', sub: 'Easy' },
                  { tier: 'C' as TaskDifficulty, label: 'C', sub: 'Med' },
                  { tier: 'B' as TaskDifficulty, label: 'B', sub: 'Med' },
                  { tier: 'A' as TaskDifficulty, label: 'A', sub: 'Hard' },
                  { tier: 'S' as TaskDifficulty, label: 'S', sub: 'Hard' },
                ]
              ).map(({ tier, label, sub }) => {
                const isSelected = difficulty === tier;
                return (
                  <button
                    type="button"
                    key={tier}
                    onClick={() => {
                      soundEngine.playPaperRustle();
                      setDifficulty(tier);
                    }}
                    className={`py-1.5 px-1 text-center rounded border font-cinematic font-bold text-xs transition min-h-[44px] cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-crimson/30 text-parchment border-crimson shadow-crimson ring-1 ring-red-400'
                        : 'bg-[#18191c] text-parchment-dim border-steel/30 hover:border-gold/50'
                    }`}
                  >
                    <span className="text-xs leading-none">{label}</span>
                    <span className={`text-[8px] uppercase tracking-tight mt-0.5 ${isSelected ? 'text-gold' : 'text-steel'}`}>
                      {sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Deadline */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span>CASEWORK DEADLINE (OPTIONAL):</span>
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-[10px] text-crimson-bright hover:underline typewriter-text"
                >
                  CLEAR DEADLINE
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded px-3 py-2 text-xs text-parchment typewriter-text outline-none transition focus:ring-1 focus:ring-gold/30 [color-scheme:dark]"
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setHours(23, 59, 0, 0);
                    const tzOffset = d.getTimezoneOffset() * 60000;
                    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
                    setDueDate(localISOTime);
                  }}
                  className="flex-1 py-1.5 text-[9px] font-cinematic font-bold bg-[#18191c] hover:bg-[#252830] text-parchment-dim hover:text-gold border border-steel/30 rounded transition min-h-[38px] uppercase text-center"
                >
                  TODAY
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(18, 0, 0, 0);
                    const tzOffset = d.getTimezoneOffset() * 60000;
                    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
                    setDueDate(localISOTime);
                  }}
                  className="flex-1 py-1.5 text-[9px] font-cinematic font-bold bg-[#18191c] hover:bg-[#252830] text-parchment-dim hover:text-gold border border-steel/30 rounded transition min-h-[38px] uppercase text-center"
                >
                  TOMORROW
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    d.setHours(18, 0, 0, 0);
                    const tzOffset = d.getTimezoneOffset() * 60000;
                    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
                    setDueDate(localISOTime);
                  }}
                  className="flex-1 py-1.5 text-[9px] font-cinematic font-bold bg-[#18191c] hover:bg-[#252830] text-parchment-dim hover:text-gold border border-steel/30 rounded transition min-h-[38px] uppercase text-center"
                >
                  +1 WEEK
                </button>
              </div>
            </div>
          </div>

          {/* Calculated Reward Output */}
          <div className="bg-[#0b0c0e] border border-steel/30 rounded p-3 flex items-center justify-around text-center text-xs typewriter-text">
              <div>
                <span className="text-steel text-[9px] block uppercase">XP GAIN</span>
                <strong className="text-parchment font-cinematic">+{currentRewards.xp} XP</strong>
              </div>
              <div className="h-5 w-px bg-steel/25" />
              <div>
                <span className="text-steel text-[9px] block uppercase">GOLD YIELD</span>
                <strong className="text-gold font-cinematic flex items-center justify-center gap-0.5">
                  +{currentRewards.gold} <Coins className="w-3 h-3 text-gold" />
                </strong>
              </div>
              <div className="h-5 w-px bg-steel/25" />
              <div>
                <span className="text-steel text-[9px] block uppercase">ATTRIBUTE BOOST</span>
                <strong className="text-parchment font-cinematic">+{currentRewards.attributeXp} PTS</strong>
              </div>
            </div>

          {/* Submit Action with AnimatedButton */}
          <div className="pt-2">
            <AnimatedButton
              type="submit"
              variant="gold"
              size="lg"
              loading={isSubmitting}
              loadingText="COMMISSIONING TO CENTRAL DESK..."
              className="w-full"
            >
              <Plus className="w-4 h-4 text-noir stroke-[3]" />
              <span>COMMISSION QUEST TO DESK</span>
            </AnimatedButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
