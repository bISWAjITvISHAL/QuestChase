'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Task } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { soundEngine } from '@/lib/soundEngine';
import {
  CheckCircle,
  Coins,
  Sparkles,
  Flame,
  Brain,
  Eye,
  Shield,
  Trash2,
  Check,
  Clock,
  Pencil,
  Undo2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditTaskModal } from './EditTaskModal';

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onDelete, onEdit }: TaskCardProps) {
  const { completeTask, deleteTask, undoTaskCompletion, activeStampTaskId } = useGameStore();
  const [showFloatingReward, setShowFloatingReward] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState<number | null>(null);

  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const undoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isStamping = activeStampTaskId === task.id;
  const gold = task.goldReward || 20;

  // Clean up any pending undo timer on unmount, auto-committing if user navigated away
  useEffect(() => {
    return () => {
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        completeTask(task.id);
      }
    };
  }, [task.id, completeTask]);

  const handleStartComplete = async () => {
    if (task.isCompleted || isPending) return;

    // 1. Audio and visual reward particles
    soundEngine.playStampThud();
    setShowFloatingReward(true);
    setTimeout(() => {
      setShowFloatingReward(false);
    }, 1400);

    setIsPending(true);
    try {
      await completeTask(task.id);
    } finally {
      setIsPending(false);
    }
  };

  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Reclaim coins and XP and restore active status
    undoTaskCompletion(task.id, {
      xp: task.xpReward,
      gold,
      attributes: task.attributeRewards,
    });
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    undoTimerRef.current = null;
    undoIntervalRef.current = null;
    if (onDelete) {
      onDelete(task.id);
    } else {
      deleteTask(task.id);
    }
  };

  const deadlineInfo = (() => {
    if (!task.dueDate) return null;
    try {
      const date = new Date(task.dueDate);
      if (isNaN(date.getTime())) return null;
      const now = new Date();
      const isOverdue = date < now && !task.isCompleted;

      const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return { formatted, isOverdue };
    } catch {
      return null;
    }
  })();

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
      <AnimatePresence>
        {showFloatingReward && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -24, scale: 1.05 }}
            exit={{ opacity: 0, y: -42, scale: 0.95 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 bg-[#121316]/95 border border-gold/80 px-3 py-1.5 rounded-sm shadow-gold backdrop-blur-sm"
          >
            <span className="text-xs font-cinematic font-bold text-gold">+{task.xpReward} XP</span>
            <span className="text-xs font-cinematic font-bold text-amber-400 flex items-center gap-0.5">
              +{gold} <Coins className="w-3 h-3 text-amber-400" />
            </span>
            {task.attributeRewards &&
              Object.entries(task.attributeRewards).map(([attr, pts]) => (
                <span key={attr} className="text-[10px] font-cinematic font-bold text-emerald-400">
                  +{pts} {attr.slice(0, 3).toUpperCase()}
                </span>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Paper Slip Container */}
      <div
        className={`paper-slip rounded-sm p-4 sm:p-5 relative shadow-md transition-all duration-200 min-h-[215px] flex flex-col justify-between border select-none ${
          task.isCompleted
            ? 'opacity-85 border-[#c5b599] bg-[#eae3d5]'
            : 'hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] border-[#d4c5a9]'
        }`}
      >
        {/* Metal Paperclip (Top Left) */}
        <div className="absolute -top-3 left-4 w-4 h-8 rounded-full border-2 border-slate-500 bg-transparent opacity-80 pointer-events-none" />

        {/* Priority Stamp Badge & Docket ID */}
        <div className="flex items-center justify-between pl-6 mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-cinematic font-bold text-[#4a3b2c] uppercase">
            <span className="w-2 h-2 rounded-full bg-[#8c7355]" />
            <span>CASEWORK DOCKET</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="stamp-priority text-[9px] px-1.5 py-0.5 bg-red-100/60 rounded">
              {task.priority || 'PRIORITY'}
            </div>
            {!task.isCompleted && undoSecondsLeft === null && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) {
                    onEdit(task);
                  } else {
                    setIsEditOpen(true);
                  }
                }}
                className="text-[#8c7355] hover:text-[#1a1714] transition p-1 cursor-pointer focus-visible:ring-1 focus-visible:ring-[#8c7355] rounded"
                title="Amend Docket"
                aria-label={`Edit casework docket: ${task.title}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className={`transition p-1 cursor-pointer focus-visible:ring-1 rounded ${
                task.isCompleted
                  ? 'text-red-800 hover:text-red-950 hover:bg-red-200/60 focus-visible:ring-red-700'
                  : 'text-[#8c7355] hover:text-crimson focus-visible:ring-crimson'
              }`}
              title={task.isCompleted ? 'Permanently Purge Docket' : 'Shelve Docket'}
              aria-label={`${task.isCompleted ? 'Permanently delete' : 'Delete'} casework docket`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Task Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-sm sm:text-base font-cinematic font-black tracking-wide uppercase leading-snug transition-all duration-200 ${
                task.isCompleted || undoSecondsLeft !== null ? 'line-through text-[#6a5b4c]' : 'text-[#1a1714]'
              }`}
            >
              {task.title}
            </h3>
            {undoSecondsLeft !== null && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400 font-cinematic font-bold animate-pulse uppercase">
                STAMPING...
              </span>
            )}
          </div>

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
          {deadlineInfo && (
            <div className={`flex items-center justify-between py-0.5 ${deadlineInfo.isOverdue ? 'text-red-900' : 'text-[#5a422d]'}`}>
              <span className="font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                DEADLINE:
              </span>
              <span
                className={`text-[10px] font-cinematic px-1.5 py-0.5 rounded border ${
                  deadlineInfo.isOverdue
                    ? 'bg-red-100 text-red-900 border-red-300 font-black animate-pulse'
                    : 'bg-[#ebdcc6] text-[#2b2219] border-[#c5b599]/60 font-bold'
                }`}
              >
                {deadlineInfo.formatted} {deadlineInfo.isOverdue && '⚠️ OVERDUE'}
              </span>
            </div>
          )}
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

          {/* Action Area: Undo Buffer vs Complete vs Evidence Logged with Permanent Delete */}
          {undoSecondsLeft !== null ? (
            <div className="space-y-1.5 p-2 bg-amber-100/95 border-2 border-amber-500/80 rounded shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-cinematic font-black text-amber-950">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-800 animate-spin" />
                  <span>EVIDENCE LOGGING IN {undoSecondsLeft}S...</span>
                </span>
                <span className="text-[10px] text-amber-900 typewriter-text font-bold uppercase">MISCLICK?</span>
              </div>

              {/* Countdown Ticking Bar */}
              <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-amber-700 h-full rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                />
              </div>

              <button
                onClick={handleUndo}
                className="w-full bg-[#342416] hover:bg-[#463220] text-gold font-cinematic font-black text-xs py-2 px-3 rounded shadow transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider border border-gold/40"
                aria-label="Undo task completion and reclaim coins"
              >
                <Undo2 className="w-3.5 h-3.5 text-gold stroke-[3]" />
                <span>UNDO (RECLAIM {gold} GOLD)</span>
              </button>
            </div>
          ) : !task.isCompleted ? (
            <button
              onClick={handleStartComplete}
              disabled={isPending}
              aria-label={`Complete quest: ${task.title}`}
              className="w-full bg-gradient-to-b from-[#8c7355] to-[#5a422d] hover:from-[#9c8263] hover:to-[#6a503a] text-[#f4eee1] font-cinematic font-black text-xs py-2.5 px-3 min-h-[44px] rounded shadow transition active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#8c7355] disabled:opacity-60"
            >
              <div className="w-4 h-4 rounded-sm border-2 border-gold-bright flex items-center justify-center shrink-0">
                {isPending && <Check className="w-3 h-3 text-gold-bright animate-spin" />}
              </div>
              <span>{isPending ? 'LOGGING EVIDENCE...' : 'COMPLETE QUEST DOCKET'}</span>
            </button>
          ) : (
            <div className="relative py-2 flex flex-col items-center justify-center gap-2">
              <div
                className={`stamp-evidence-logged text-center py-1.5 px-4 text-xs sm:text-sm font-black ${
                  isStamping ? 'animate-bounce' : ''
                }`}
              >
                EVIDENCE LOGGED
              </div>
              <button
                onClick={handleDelete}
                className="text-[10px] text-red-900/80 hover:text-red-950 font-bold typewriter-text uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer py-1 px-2 rounded hover:bg-red-100/60 transition"
                title="Permanently remove completed docket from archives"
                aria-label={`Permanently delete completed docket: ${task.title}`}
              >
                <Trash2 className="w-3 h-3 text-red-800" />
                <span>PURGE DOCKET PERMANENTLY</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {isEditOpen && (
        <EditTaskModal
          task={task}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}
