'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { Task, TaskCategory, TaskPriority } from '@/lib/types';
import {
  X,
  Check,
  Clock,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from '@/components/ui/AnimatedButton';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTaskModal({ task, isOpen, onClose }: EditTaskModalProps) {
  const { updateTask } = useGameStore();

  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [priority, setPriority] = useState<TaskPriority>(task.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(formatForInput(task.dueDate));
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever task or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setCategory(task.category);
      setPriority(task.priority || 'MEDIUM');
      setDueDate(formatForInput(task.dueDate));
      setValidationError('');
      setIsSubmitting(false);
    }
  }, [task, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Quest title cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    soundEngine.playStampThud();

    try {
      await updateTask(task.id, {
        title: title.trim().toUpperCase(),
        description: description.trim(),
        category,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      onClose();
    } catch (err: unknown) {
      console.error('Failed to update task:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save amendments.';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-quest-title"
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
              <div className="text-[10px] font-cinematic font-bold text-crimson-bright uppercase tracking-wider flex items-center gap-1.5">
                <Pencil className="w-3 h-3 text-gold" />
                <span>CASEWORK AMENDMENT • METROPOLITAN INVESTIGATION BUREAU</span>
              </div>
              <h2 id="edit-quest-title" className="text-xl font-cinematic font-black text-parchment tracking-wide">
                AMEND QUEST DOCKET
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close edit modal"
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
                placeholder="e.g. 2 DSA QUESTIONS"
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
                placeholder="Correct typos, add notes or extra parameters..."
                className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded p-3 text-xs text-parchment typewriter-text outline-none transition placeholder:text-steel focus:ring-1 focus:ring-gold/30"
              />
            </div>

            {/* Domain / Category Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-1">
                  DISCIPLINE DOMAIN:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded px-3 py-2 text-xs text-parchment outline-none font-cinematic"
                >
                  <option value="Discipline">Discipline (Habits, Focus)</option>
                  <option value="Intelligence">Intelligence (Coding, Study)</option>
                  <option value="Perception">Perception (Reading, Review)</option>
                  <option value="Resilience">Resilience (Fitness, Health)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-1">
                  PRIORITY LEVEL:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded px-3 py-2 text-xs text-parchment outline-none font-cinematic"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
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

            {/* Read-only Reward Notice */}
            <div className="bg-[#0b0c0e] border border-steel/30 rounded p-2.5 flex items-center justify-between text-xs typewriter-text text-parchment-dim">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-gold shrink-0" />
                <span className="text-[10px]">
                  SEALED YIELD: TIER {task.difficulty || 'B'} • +{task.xpReward} XP • +{task.goldReward || 20} GOLD
                </span>
              </div>
              <span className="text-[9px] text-steel uppercase font-cinematic">LOCKED REWARDS</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-[#18191c] hover:bg-[#252830] text-parchment-dim hover:text-parchment font-cinematic font-bold text-xs rounded border border-steel/30 transition min-h-[44px] uppercase"
              >
                DISCARD CHANGES
              </button>

              <div className="flex-1">
                <AnimatedButton
                  type="submit"
                  variant="gold"
                  size="md"
                  loading={isSubmitting}
                  loadingText="AMENDING DOCKET..."
                  className="w-full"
                >
                  <Check className="w-4 h-4 text-noir stroke-[3]" />
                  <span>SAVE AMENDMENTS</span>
                </AnimatedButton>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
