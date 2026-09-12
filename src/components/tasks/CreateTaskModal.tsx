'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { TaskCategory, TaskDifficulty, TaskPriority, AttributeType } from '@/lib/types';
import { DIFFICULTY_REWARDS } from '@/lib/initialData';
import {
  X,
  Plus,
  Brain,
  Eye,
  Shield,
  Sparkles,
  Coins,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

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
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const currentRewards = DIFFICULTY_REWARDS[difficulty];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Quest title cannot be empty.');
      return;
    }

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

    addTask({
      title: title.trim().toUpperCase(),
      description: description.trim(),
      category,
      difficulty,
      priority,
      xpReward: currentRewards.xp,
      goldReward: currentRewards.gold,
      attributeRewards,
    });

    // Reset form & close
    setTitle('');
    setDescription('');
    setCategory('Discipline');
    setDifficulty('B');
    setPriority('HIGH');
    setValidationError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-[#121316] text-parchment border-2 border-gold/40 rounded p-6 shadow-dossier max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-steel/30 pb-3 mb-4">
          <div>
            <div className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase tracking-wider">
              METROPOLITAN INVESTIGATION BUREAU
            </div>
            <h2 className="text-xl font-cinematic font-black text-parchment tracking-wide">
              FILE NEW QUEST DOCKET
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-steel hover:text-parchment hover:bg-charcoal transition"
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
            <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>DIFFICULTY TIER & RESOURCE YIELD:</span>
              <span className="text-[10px] text-gold font-bold">TIER {difficulty}</span>
            </label>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {(['C', 'B', 'A', 'S'] as TaskDifficulty[]).map((tier) => {
                const isSelected = difficulty === tier;
                return (
                  <button
                    type="button"
                    key={tier}
                    onClick={() => {
                      soundEngine.playPaperRustle();
                      setDifficulty(tier);
                    }}
                    className={`py-2 text-center rounded border font-cinematic font-bold text-xs transition tactile-btn ${
                      isSelected
                        ? 'bg-crimson/30 text-parchment border-crimson shadow-crimson ring-1 ring-red-400'
                        : 'bg-[#18191c] text-parchment-dim border-steel/30 hover:border-gold/50'
                    }`}
                  >
                    TIER {tier}
                  </button>
                );
              })}
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
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded bg-gradient-to-r from-gold via-gold-bright to-gold hover:opacity-95 text-noir font-cinematic font-bold text-xs tracking-wider uppercase shadow-gold transition active:scale-95 flex items-center justify-center gap-2 tactile-btn"
            >
              <Plus className="w-4 h-4 text-noir stroke-[3]" />
              <span>COMMISSION QUEST TO DESK</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
