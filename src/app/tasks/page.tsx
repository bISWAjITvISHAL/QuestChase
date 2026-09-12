'use client';

import React, { useState } from 'react';
import { GameShell } from '@/components/layout/GameShell';
import { useGameStore } from '@/lib/store';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Coins,
  Brain,
  Eye,
  Shield,
} from 'lucide-react';

export default function TasksPage() {
  const { tasks } = useGameStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SOLVED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  const potentialXp = activeTasks.reduce((acc, t) => acc + t.xpReward, 0);
  const potentialGold = activeTasks.reduce((acc, t) => acc + (t.goldReward || 20), 0);

  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (filterStatus === 'ACTIVE' && task.isCompleted) return false;
    if (filterStatus === 'SOLVED' && !task.isCompleted) return false;

    // Category filter
    if (filterCategory !== 'ALL' && task.category !== filterCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  return (
    <GameShell>
      <div className="space-y-6">
        {/* Desk Header & Summary Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/30 pb-4">
          <div>
            <div className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase">
              CASEWORK DOCKET REGISTER • METROPOLITAN INVESTIGATION BUREAU
            </div>
            <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wide">
              REAL-WORLD QUESTS
            </h1>
            <p className="text-xs text-parchment-dim typewriter-text mt-1">
              Complete real-world objectives to yield investigative Gold, XP, and expand detective attributes.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-bright hover:from-gold-bright hover:to-gold text-noir font-cinematic font-black text-xs px-4 py-2.5 rounded-sm shadow-gold transition active:scale-95 whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>NEW QUEST DOCKET</span>
          </button>
        </div>

        {/* Intelligence Ledger / Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-charcoal/80 border border-gold/30 rounded-sm p-3 shadow-noir">
            <div className="text-[10px] text-parchment-dim typewriter-text">ACTIVE CASEWORK</div>
            <div className="text-xl font-bold font-cinematic text-parchment mt-0.5">
              {activeTasks.length} <span className="text-xs text-parchment-dim">QUESTS</span>
            </div>
          </div>

          <div className="bg-charcoal/80 border border-steel/30 rounded-sm p-3 shadow-noir">
            <div className="text-[10px] text-parchment-dim typewriter-text">EVIDENCE LOGGED</div>
            <div className="text-xl font-bold font-cinematic text-emerald-400 mt-0.5">
              {completedTasks.length} <span className="text-xs text-parchment-dim">SOLVED</span>
            </div>
          </div>

          <div className="bg-charcoal/80 border border-gold/40 rounded-sm p-3 shadow-noir">
            <div className="text-[10px] text-parchment-dim typewriter-text">PENDING YIELD</div>
            <div className="text-xl font-bold font-cinematic text-gold mt-0.5 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-gold" />
              +{potentialXp} <span className="text-xs text-parchment-dim">XP</span>
            </div>
          </div>

          <div className="bg-charcoal/80 border border-gold/40 rounded-sm p-3 shadow-noir">
            <div className="text-[10px] text-parchment-dim typewriter-text">PENDING GOLD POOL</div>
            <div className="text-xl font-bold font-cinematic text-amber-400 mt-0.5 flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" />
              +{potentialGold} <span className="text-xs text-parchment-dim">GOLD</span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-charcoal/70 border border-steel/30 p-2.5 rounded-sm">
          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            {(['ACTIVE', 'SOLVED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs font-cinematic font-bold rounded transition ${
                  filterStatus === st
                    ? 'bg-gold text-noir shadow-gold'
                    : 'text-parchment-dim hover:text-parchment hover:bg-noir'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search & Category Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-steel" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search casework..."
                className="w-full bg-noir border border-steel/40 focus:border-gold rounded-sm pl-8 pr-2 py-1 text-xs text-parchment outline-none typewriter-text placeholder:text-steel/50"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-noir border border-steel/40 focus:border-gold rounded-sm px-2 py-1 text-xs text-parchment outline-none font-cinematic"
            >
              <option value="ALL">ALL DOMAINS</option>
              <option value="Discipline">Discipline</option>
              <option value="Intelligence">Intelligence</option>
              <option value="Perception">Perception</option>
              <option value="Resilience">Resilience</option>
            </select>
          </div>
        </div>

        {/* Task Cards Grid */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="parchment-card rounded-sm p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-steel mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-cinematic font-bold text-parchment">
              NO ACTIVE CASEWORK DOCKETS
            </h3>
            <p className="text-xs text-parchment-dim typewriter-text mt-1 max-w-sm mx-auto">
              All objectives in this filter have been logged or no matching records exist. File a new quest docket above to continue earning resources.
            </p>
          </div>
        )}
      </div>

      <CreateTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </GameShell>
  );
}
