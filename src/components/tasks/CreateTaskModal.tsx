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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-[#f4eee1] text-[#1a1714] border-4 border-[#2b2219] rounded-sm p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#2b2219] pb-3 mb-4">
          <div>
            <div className="text-[10px] font-cinematic font-bold text-[#7f2525] uppercase tracking-wider">
              METROPOLITAN INVESTIGATION BUREAU
            </div>
            <h2 className="text-xl font-cinematic font-black text-[#1a1714] tracking-wide">
              FILE NEW QUEST DOCKET
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#5a422d] hover:text-[#1a1714] hover:bg-[#e0d3be] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-cinematic font-bold text-[#2b2219] uppercase tracking-wider mb-1">
              QUEST TITLE (REAL-WORLD OBJECTIVE):
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="e.g. COMPLETE DSA PRACTICE or DRAFT PROPOSAL"
              className="w-full bg-[#eae0cf] border-2 border-[#8c7355] focus:border-[#2b2219] rounded-sm px-3 py-2 text-xs text-[#1a1714] font-bold typewriter-text outline-none transition placeholder:text-[#8c7355]"
            />
            {validationError && (
              <p className="text-[10px] text-red-700 font-bold mt-1 typewriter-text">
                {validationError}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-cinematic font-bold text-[#2b2219] uppercase tracking-wider mb-1">
              DETAILS & SUCCESS CRITERIA (OPTIONAL):
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify milestones, pages, or focus intervals..."
              className="w-full bg-[#eae0cf] border-2 border-[#8c7355] focus:border-[#2b2219] rounded-sm px-3 py-2 text-xs text-[#1a1714] typewriter-text outline-none transition placeholder:text-[#8c7355]"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-cinematic font-bold text-[#2b2219] uppercase tracking-wider mb-1">
              ATTRIBUTE DOMAIN:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Intelligence', icon: Brain, label: 'Intelligence' },
                { id: 'Perception', icon: Eye, label: 'Perception' },
                { id: 'Discipline', icon: Sparkles, label: 'Discipline' },
                { id: 'Resilience', icon: Shield, label: 'Resilience' },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id as TaskCategory)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-sm border-2 text-xs font-cinematic font-bold transition ${
                      isSelected
                        ? 'bg-[#2b2219] text-[#f4eee1] border-[#2b2219] shadow'
                        : 'bg-[#eae0cf] text-[#5a422d] border-[#8c7355] hover:border-[#2b2219]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Tier Picker with Rewards Preview */}
          <div>
            <label className="block text-xs font-cinematic font-bold text-[#2b2219] uppercase tracking-wider mb-1">
              DIFFICULTY TIER & REWARD MATRIX:
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {(['E', 'D', 'C', 'B', 'A'] as const).map((tier) => {
                const isSelected = difficulty === tier;
                return (
                  <button
                    type="button"
                    key={tier}
                    onClick={() => setDifficulty(tier)}
                    className={`py-2 text-center rounded border-2 font-cinematic font-black text-xs transition ${
                      isSelected
                        ? 'bg-[#7f2525] text-parchment border-[#7f2525] shadow-md scale-105'
                        : 'bg-[#eae0cf] text-[#5a422d] border-[#8c7355] hover:border-[#2b2219]'
                    }`}
                  >
                    TIER {tier}
                  </button>
                );
              })}
            </div>

            {/* Calculated Reward Output */}
            <div className="bg-[#eae0cf] border border-[#c5b599] rounded p-2.5 flex items-center justify-around text-center text-xs typewriter-text">
              <div>
                <span className="text-[#5a422d] text-[9px] block">XP GAIN</span>
                <strong className="text-[#1a1714] font-cinematic">+{currentRewards.xp} XP</strong>
              </div>
              <div className="h-4 w-px bg-[#c5b599]" />
              <div>
                <span className="text-[#5a422d] text-[9px] block">GOLD YIELD</span>
                <strong className="text-[#8c6527] font-cinematic flex items-center justify-center gap-0.5">
                  +{currentRewards.gold} <Coins className="w-3 h-3 text-[#8c6527]" />
                </strong>
              </div>
              <div className="h-4 w-px bg-[#c5b599]" />
              <div>
                <span className="text-[#5a422d] text-[9px] block">ATTRIBUTE XP</span>
                <strong className="text-[#2b2219] font-cinematic">+{currentRewards.attributeXp} PTS</strong>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded bg-[#203a27] hover:bg-[#2c4e36] text-[#f4ede1] font-cinematic font-black text-xs tracking-wider uppercase border-2 border-[#3d4f3b] shadow transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-gold" />
              <span>COMMISSION QUEST TO DESK</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
