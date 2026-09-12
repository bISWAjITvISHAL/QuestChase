'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import {
  CheckCircle,
  Coins,
  Sparkles,
  Flame,
  Brain,
  Eye,
  Shield,
  Zap,
  Trash2,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
}

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const { completeTask, activeStampTaskId } = useGameStore();
  const [showFloatingReward, setShowFloatingReward] = useState(false);

  const isStamping = activeStampTaskId === task.id;
  const gold = task.goldReward || 20;

  const handleComplete = () => {
    if (task.isCompleted) return;
    setShowFloatingReward(true);
    completeTask(task.id);
    setTimeout(() => {
      setShowFloatingReward(false);
    }, 1600);
  };

  const getCategoryIcon = () => {
    switch (task.category) {
      case 'Intelligence':
      case 'Coding':
        return <Brain className="w-3.5 h-3.5 text-blue-800" />;
      case 'Perception':
      case 'Reading':
        return <Eye className="w-3.5 h-3.5 text-amber-900" />;
      case 'Discipline':
      case 'Fitness':
      case 'Study':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-900" />;
      case 'Resilience':
      case 'Work':
      default:
        return <Shield className="w-3.5 h-3.5 text-stone-900" />;
    }
  };

  return (
    <div className="relative group">
      {/* Floating XP & Gold Particles Animation */}
      {showFloatingReward && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-float-reward flex items-center gap-2 bg-charcoal/95 border border-gold/70 px-3 py-1.5 rounded-sm shadow-gold">
          <span className="text-xs font-cinematic font-bold text-gold">+{task.xpReward} XP</span>
          <span className="text-xs font-cinematic font-bold text-amber-400 flex items-center gap-0.5">
            +{gold} <Coins className="w-3 h-3 text-amber-400" />
          </span>
          {task.attributeRewards && Object.entries(task.attributeRewards).map(([attr, pts]) => (
            <span key={attr} className="text-[10px] font-cinematic font-bold text-emerald-400">
              +{pts} {attr.slice(0, 3).toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* Main Paper Slip Container */}
      <div className={`paper-slip rounded-sm p-4 sm:p-5 relative shadow-md transition-all duration-200 min-h-[215px] flex flex-col justify-between border ${
        task.isCompleted
          ? 'opacity-85 border-[#c5b599] bg-[#eae3d5]'
          : 'hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] border-[#d4c5a9]'
      }`}>
        {/* Metal Paperclip (Top Left) */}
        <div className="absolute -top-3 left-4 w-4 h-8 rounded-full border-2 border-slate-500 bg-transparent opacity-80 pointer-events-none" />

        {/* Priority Stamp Badge & Docket ID */}
        <div className="flex items-center justify-between pl-6 mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-cinematic font-bold text-[#4a3b2c] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#8c7355]" />
            <span>CASEWORK DOCKET</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="stamp-priority text-[9px] px-1.5 py-0.5 bg-red-100/60 rounded">
              {task.priority || 'PRIORITY'}
            </div>
            {onDelete && !task.isCompleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="text-[#8c7355] hover:text-crimson transition p-0.5"
                title="Shelve Docket"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Task Title */}
        <div className="space-y-1">
          <h3 className={`text-sm sm:text-base font-cinematic font-black tracking-wide uppercase leading-snug ${
            task.isCompleted ? 'line-through text-[#6a5b4c]' : 'text-[#1a1714]'
          }`}>
            {task.title}
          </h3>

          {task.description && (
            <p className="text-[11px] typewriter-text text-[#4a3b2c] line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Category & Difficulty Rows */}
        <div className="my-2 border-y border-[#c5b599] py-1.5 text-xs typewriter-text text-[#2b2219]">
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[#5a422d] font-bold">DOMAIN:</span>
            <span className="font-bold flex items-center gap-1 uppercase">
              {getCategoryIcon()}
              {task.category}
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[#5a422d] font-bold">DIFFICULTY:</span>
            <span className="font-black text-[#7f2525] bg-[#ebdcc6] px-1.5 rounded text-[11px] border border-[#c5b599]/60">
              TIER {task.difficulty || 'B'}
            </span>
          </div>
        </div>

        {/* Rewards Breakdown & Completion Action */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-around text-center bg-[#eae0cf] border border-[#c5b599] rounded py-1.5">
            <div>
              <div className="text-[9px] text-[#5a422d] typewriter-text">XP YIELD</div>
              <div className="text-xs font-cinematic font-bold text-[#1a1714]">
                +{task.xpReward} <span className="text-[9px]">XP</span>
              </div>
            </div>
            <div className="h-4 w-px bg-[#c5b599]" />
            <div>
              <div className="text-[9px] text-[#5a422d] typewriter-text">GOLD YIELD</div>
              <div className="text-xs font-cinematic font-bold text-[#8c6527] flex items-center justify-center gap-0.5">
                +{gold} <Coins className="w-3 h-3 text-[#8c6527]" />
              </div>
            </div>
            <div className="h-4 w-px bg-[#c5b599]" />
            <div>
              <div className="text-[9px] text-[#5a422d] typewriter-text">ATTRIBUTE</div>
              <div className="text-xs font-cinematic font-bold text-[#2b2219]">
                +18 PTS
              </div>
            </div>
          </div>

          {/* Button or EVIDENCE LOGGED Stamp */}
          {!task.isCompleted ? (
            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-b from-[#8c7355] to-[#5a422d] hover:from-[#9c8263] hover:to-[#6a503a] text-[#f4eee1] font-cinematic font-black text-xs py-2.5 px-3 rounded shadow transition active:scale-95 uppercase tracking-wider flex items-center justify-center gap-1.5 tactile-btn"
            >
              <CheckCircle className="w-3.5 h-3.5 text-gold-bright" />
              <span>COMPLETE QUEST DOCKET</span>
            </button>
          ) : (
            <div className="relative py-2 flex items-center justify-center">
              <div className={`stamp-evidence-logged text-center py-1.5 px-4 text-xs sm:text-sm font-black ${isStamping ? 'animate-bounce' : ''}`}>
                EVIDENCE LOGGED
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
