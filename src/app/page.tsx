'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  ArrowRight,
  Shield,
  Coins,
  Flame,
  Check,
  Search,
  Brain,
  Eye,
  Lock,
  Volume2,
  VolumeX,
  Sparkles,
  FileText,
  Users,
  MapPin,
  Target,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export default function LandingPage() {
  const router = useRouter();
  const [soundActive, setSoundActive] = useState(false);
  const [activeStep, setActiveStep] = useState(2);

  // Interactive Live Demo Quest state
  const [demoQuests, setDemoQuests] = useState([
    { id: 1, title: 'Finish Architecture Report', completed: true, reward: '+120 XP / +35 Gold' },
    { id: 2, title: '30-Min Cardio Stamina', completed: true, reward: '+80 XP / +20 Gold' },
    { id: 3, title: 'Inspect Codebase Forensics', completed: true, reward: '+180 XP / +50 Gold' },
    { id: 4, title: 'Solve 2 DSA Algorithm Problems', completed: false, reward: '+120 XP / +35 Gold' },
  ]);

  const [demoGold, setDemoGold] = useState(240);
  const [demoXp, setDemoXp] = useState(680);

  const toggleQuest = (id: number) => {
    soundEngine.playStampThud();
    setDemoQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const next = !q.completed;
          if (next) {
            setDemoGold((g) => g + 35);
            setDemoXp((x) => x + 120);
          } else {
            setDemoGold((g) => Math.max(240, g - 35));
            setDemoXp((x) => Math.max(680, x - 120));
          }
          return { ...q, completed: next };
        }
        return q;
      })
    );
  };

  const handleToggleSound = () => {
    soundEngine.init();
    const next = !soundActive;
    setSoundActive(next);
    soundEngine.setSoundEnabled(next);
    soundEngine.setAmbienceEnabled(next);
  };

  const handleBeginInvestigation = () => {
    soundEngine.playPaperRustle();
    router.push('/login');
  };

  const steps = [
    { num: '01', title: 'ACCEPT A QUEST', desc: 'Transform real tasks into high-stakes investigative casework' },
    { num: '02', title: 'COMPLETE THE TASK', desc: 'Get things done in the physical world without distractions' },
    { num: '03', title: 'EARN XP + GOLD', desc: 'Reap attribute XP, level progress, and hard currency' },
    { num: '04', title: 'INVESTIGATE', desc: 'Spend gold on crime scenes, digital forensics, and suspect interviews' },
    { num: '05', title: 'DISCOVER CLUES', desc: 'Unearth physical evidence, alibis, and critical contradictions' },
    { num: '06', title: 'SOLVE THE CASE', desc: 'Form the final deduction: Who, When, How, and Why Lord Blackwood died' },
  ];

  return (
    <div className="min-h-screen bg-noir text-parchment overflow-x-hidden selection:bg-gold/30 selection:text-gold relative">
      {/* Background Ambience & Desk Warm Lamp Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 right-1/4 w-[650px] h-[650px] bg-amber-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-vignette opacity-80" />
      </div>

      {/* Top Sticky Navigation Bar */}
      <header className="relative z-40 border-b border-steel/20 bg-noir/85 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-gold to-[#6b4e28] border border-gold/60 flex items-center justify-center text-noir shadow-gold group-hover:scale-105 transition">
              <FolderOpen className="w-4 h-4 text-noir" />
            </div>
            <div className="flex flex-col">
              <span className="font-cinematic font-bold text-lg sm:text-xl text-parchment tracking-wider leading-none">
                QuestChase
              </span>
              <span className="text-[9px] text-gold font-cinematic uppercase tracking-widest mt-0.5">
                Productivity Mystery RPG
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-cinematic font-semibold text-parchment-dim">
            <a href="#how-it-works" className="hover:text-gold transition">
              How It Works
            </a>
            <a href="#features" className="hover:text-gold transition">
              Features
            </a>
            <a href="#case-preview" className="hover:text-gold transition">
              Case Files
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSound}
              className="hidden sm:flex items-center gap-1.5 bg-charcoal/80 border border-steel/40 text-parchment-dim hover:text-gold px-2.5 py-1.5 rounded text-[11px] font-cinematic transition"
              title="Toggle Noir Rain Ambience"
            >
              {soundActive ? <Volume2 className="w-3.5 h-3.5 text-gold" /> : <VolumeX className="w-3.5 h-3.5 text-steel" />}
              <span className="text-[10px]">{soundActive ? 'RAIN ON' : 'AUDIO'}</span>
            </button>

            <Link
              href="/login"
              className="text-xs font-cinematic font-semibold text-parchment hover:text-gold px-3 py-1.5 transition"
            >
              Sign In
            </Link>

            <button
              onClick={handleBeginInvestigation}
              className="bg-gradient-to-r from-gold to-gold-bright hover:from-gold-bright hover:to-gold text-noir font-cinematic font-bold text-xs py-2 px-4 rounded-sm shadow-gold transition active:scale-95 tracking-wider"
            >
              Begin Investigation
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 pb-20 sm:pt-16 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-charcoal/90 border border-gold/40 px-3 py-1 rounded text-[10px] font-cinematic font-bold text-gold tracking-widest shadow-noir">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
              <span>METROPOLITAN INVESTIGATION BUREAU // CASE #001</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-cinematic font-black text-parchment tracking-tight leading-[1.05]">
              YOUR LIFE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-bright to-parchment">
                IS THE GAME.
              </span>
            </h1>

            <div className="space-y-2">
              <p className="text-base sm:text-lg text-parchment font-cinematic font-bold tracking-wide">
                Complete your tasks. Follow the clues. Solve the case.
              </p>
              <p className="text-xs sm:text-sm text-parchment-dim typewriter-text leading-relaxed max-w-xl">
                Transform your daily productivity into investigative currency. Every completed objective earns XP and Gold to interrogate suspects, analyze crime scenes, and deduce the truth behind Lord Blackwood's murder.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={handleBeginInvestigation}
                className="flex items-center gap-2.5 bg-gradient-to-r from-gold to-gold-bright hover:from-gold-bright hover:to-gold text-noir font-cinematic font-black py-3.5 px-7 rounded-sm shadow-gold transition-all duration-300 text-xs sm:text-sm tracking-wider active:scale-95 tactile-btn"
              >
                <span>START YOUR INVESTIGATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#how-it-works"
                className="text-xs font-cinematic font-bold text-parchment-dim hover:text-gold tracking-widest uppercase transition flex items-center gap-1.5 py-3 px-4 border border-steel/30 rounded-sm hover:border-gold/40 bg-charcoal/40"
              >
                <span>HOW IT WORKS</span>
                <ArrowRight className="w-3.5 h-3.5 text-gold" />
              </a>
            </div>

            {/* Quick Micro-Stats (Clean Typographic Formulation) */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-steel/20 max-w-md">
              <div>
                <div className="text-[10px] text-parchment-dim typewriter-text uppercase">ACTIVE DOSSIER</div>
                <div className="text-xs sm:text-sm font-cinematic font-bold text-gold">CASE #001 READY</div>
              </div>
              <div>
                <div className="text-[10px] text-parchment-dim typewriter-text uppercase">DETECTIVE STATS</div>
                <div className="text-xs sm:text-sm font-cinematic font-bold text-parchment">4 CORE ATTRIBUTES</div>
              </div>
              <div>
                <div className="text-[10px] text-parchment-dim typewriter-text uppercase">GAMEPLAY ENGINE</div>
                <div className="text-xs sm:text-sm font-cinematic font-bold text-amber-400">QUESTS → CLUES</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Detective Widget matching Mockup 1 */}
          <div className="lg:col-span-6 relative">
            {/* Main Interactive Floating HUD Card */}
            <div className="relative bg-charcoal/95 backdrop-blur-xl border border-gold/40 rounded-sm p-5 sm:p-6 shadow-dossier z-10">
              {/* Card Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-noir/90 border border-gold/30 rounded-sm p-3 mb-5">
                {/* Level */}
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-noir border-2 border-gold text-gold flex flex-col items-center justify-center">
                    <span className="text-[8px] font-cinematic uppercase leading-none">LEVEL</span>
                    <span className="text-xs font-bold font-cinematic leading-none">04</span>
                  </div>
                  <div>
                    <div className="text-xs font-cinematic font-bold text-parchment">
                      {demoXp} <span className="text-[10px] text-gold">XP</span>
                    </div>
                    <div className="w-24 h-1.5 bg-charcoal border border-steel/40 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-gradient-to-r from-gold to-gold-bright" style={{ width: '68%' }} />
                    </div>
                  </div>
                </div>

                {/* Gold & Streak */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-gold">
                    <Coins className="w-4 h-4 text-gold animate-pulse" />
                    <span className="text-xs font-cinematic font-bold">{demoGold}</span>
                    <span className="text-[9px] text-parchment-dim">GOLD</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    <Flame className="w-4 h-4" />
                    <span className="text-xs font-cinematic font-bold">5 DAY</span>
                    <span className="text-[9px] text-parchment-dim">STREAK</span>
                  </div>
                </div>
              </div>

              {/* Grid: Completed Quests (Left) + Confidential Clue Card (Right) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Quests Checklist */}
                <div className="sm:col-span-7 space-y-2">
                  <div className="text-[10px] font-cinematic font-bold text-gold uppercase tracking-wider flex items-center justify-between">
                    <span>LIVE CASEWORK LIST</span>
                    <span className="text-[9px] text-steel">CLICK TO TEST</span>
                  </div>

                  {demoQuests.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => toggleQuest(q.id)}
                      className={`p-2 rounded-sm border flex items-center justify-between gap-2 cursor-pointer transition text-xs ${
                        q.completed
                          ? 'bg-noir/60 border-emerald-500/40 text-parchment-dim'
                          : 'bg-noir border-gold/40 text-parchment hover:border-gold'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-4 h-4 rounded-sm flex items-center justify-center transition ${
                            q.completed
                              ? 'bg-emerald-600 text-noir'
                              : 'border border-steel/60 hover:border-gold'
                          }`}
                        >
                          {q.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`truncate text-[11px] ${q.completed ? 'line-through opacity-70' : ''}`}>
                          {q.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-cinematic text-gold shrink-0">
                        {q.reward.split('/')[1] || '+35G'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Confidential Clue Card (Right) */}
                <div className="sm:col-span-5 bg-[#171411] border border-gold/40 rounded-sm p-3.5 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[8px] font-cinematic text-crimson-bright font-bold">
                    CLUE #07
                  </div>

                  <div>
                    <div className="text-[10px] font-cinematic font-bold text-parchment mb-1">
                      CLUE DOSSIER
                    </div>
                    <div className="text-[10px] typewriter-text text-parchment-dim leading-tight">
                      "At 22:47, a message was deleted from the victim's laptop."
                    </div>
                  </div>

                  <div className="my-2 border-y border-steel/20 py-1.5 flex items-center justify-between text-[9px] typewriter-text text-steel">
                    <span>SOURCE: LAPTOP</span>
                    <span className="text-gold font-bold">HIGH RELIABILITY</span>
                  </div>

                  {/* Stamp */}
                  <div className="stamp-classified text-center py-1 text-[11px] font-black">
                    CONFIDENTIAL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-20 border-t border-steel/20 bg-charcoal/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-[11px] font-cinematic font-bold tracking-widest text-gold uppercase mb-1">
              2 • THE GAMEPLAY LOOP
            </div>
            <h2 className="text-3xl sm:text-4xl font-cinematic font-black text-parchment">
              HOW IT WORKS
            </h2>
            <p className="text-xs sm:text-sm text-parchment-dim typewriter-text mt-2">
              Your real-life productivity is the fuel that powers every forensic discovery, interrogation, and deduction.
            </p>
          </div>

          {/* Interactive Steps on Red Thread */}
          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-10 right-10 h-10 pointer-events-none z-0">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 40">
                <path
                  d="M 20 20 Q 250 5 500 25 T 980 15"
                  fill="none"
                  className="evidence-thread-active"
                />
              </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 relative z-10">
              {steps.map((st, idx) => {
                const isActive = activeStep === idx;
                return (
                  <div
                    key={st.num}
                    onClick={() => {
                      soundEngine.playPaperRustle();
                      setActiveStep(idx);
                    }}
                    className={`bg-noir/90 border rounded-sm p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] ${
                      isActive
                        ? 'border-gold shadow-gold scale-105 ring-1 ring-gold/40'
                        : 'border-steel/30 hover:border-gold/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-cinematic font-black text-gold">{st.num}</span>
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            isActive ? 'bg-crimson animate-ping' : 'bg-steel/40'
                          }`}
                        />
                      </div>
                      <h3 className="text-xs font-cinematic font-bold text-parchment tracking-wider leading-snug">
                        {st.title}
                      </h3>
                    </div>
                    <p className="text-[10px] typewriter-text text-parchment-dim leading-relaxed mt-2">
                      {st.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES */}
      <section id="features" className="relative z-10 py-20 border-t border-steel/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-[11px] font-cinematic font-bold tracking-widest text-gold uppercase mb-1">
              3 • GAMEPLAY SYSTEMS
            </div>
            <h2 className="text-3xl sm:text-4xl font-cinematic font-black text-parchment">
              INVESTIGATIVE CAPABILITIES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Quests as Tactile Paper Casework Docket */}
            <div className="paper-slip rounded-sm p-6 flex flex-col justify-between shadow-xl relative group tactile-card border border-[#d4c5a9]">
              {/* Paperclip */}
              <div className="absolute -top-3 left-6 w-4 h-8 rounded-full border-2 border-slate-600 bg-transparent pointer-events-none opacity-80" />

              <div>
                <div className="flex items-center justify-between pl-6 mb-3">
                  <span className="text-[10px] font-cinematic font-bold text-[#5a422d] uppercase tracking-wider">
                    DOCKET #QC-TASK
                  </span>
                  <span className="stamp-priority text-[9px] px-1.5 py-0.5 bg-red-100/60 rounded">
                    HIGH PRIORITY
                  </span>
                </div>

                <h3 className="text-xl font-cinematic font-black text-[#1a1714] mb-2 tracking-wide">
                  REAL-WORLD QUESTS
                </h3>
                <p className="text-xs text-[#4a3b2c] typewriter-text leading-relaxed">
                  Turn physical objectives into high-stakes casework. Choose tiers E through A to commission daily productivity that produces tangible XP and investigative Gold.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#c5b599] flex items-center justify-between text-[10px] typewriter-text text-[#2b2219]">
                <span className="font-bold">YIELD:</span>
                <span className="font-cinematic font-bold text-[#8c6527]">XP + GOLD + ATTRIBUTE PTS</span>
              </div>
            </div>

            {/* Feature 2: Attributes as Bureau Clearance Dossier */}
            <div className="bg-[#151310] border border-gold/40 rounded-sm p-6 flex flex-col justify-between shadow-dossier relative group tactile-card">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-noir border border-gold/50 flex items-center justify-center text-gold shadow-gold">
                    <Brain className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-[9px] font-cinematic font-bold text-gold uppercase tracking-widest px-2 py-0.5 bg-gold/10 border border-gold/30 rounded">
                    CLEARANCE DOSSIER
                  </span>
                </div>

                <h3 className="text-xl font-cinematic font-black text-parchment mb-2 tracking-wide">
                  DETECTIVE ATTRIBUTES
                </h3>
                <p className="text-xs text-parchment-dim typewriter-text leading-relaxed">
                  Your casework hones four core proficiencies: <strong>Intelligence</strong> (digital forensics), <strong>Perception</strong> (physical clues), <strong>Discipline</strong> (interrogation tenacity), and <strong>Resilience</strong> (undercover pressure).
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-steel/20 flex items-center justify-between text-[10px] typewriter-text text-parchment-dim">
                <span>SYSTEM:</span>
                <span className="font-cinematic font-bold text-gold">UNLOCKS SPECIALIST LEADS</span>
              </div>
            </div>

            {/* Feature 3: Investigation as Crime Scene Evidence Kit */}
            <div className="bg-[#111317] border border-crimson/50 rounded-sm p-6 flex flex-col justify-between shadow-noir relative group tactile-card">
              {/* Evidence Tag */}
              <div className="absolute -top-2.5 right-6 bg-crimson text-parchment text-[8px] font-cinematic font-bold px-2 py-0.5 rounded tracking-widest uppercase shadow-crimson">
                HOTSPOT EXAM
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-noir border border-crimson/50 flex items-center justify-center text-crimson-bright shadow">
                    <Search className="w-5 h-5 text-crimson-bright" />
                  </div>
                  <span className="text-[9px] font-cinematic font-bold text-crimson-bright uppercase tracking-widest">
                    FORENSIC DEPLOYMENT
                  </span>
                </div>

                <h3 className="text-xl font-cinematic font-black text-parchment mb-2 tracking-wide">
                  CRIME SCENE FORENSICS
                </h3>
                <p className="text-xs text-parchment-dim typewriter-text leading-relaxed">
                  Expend earned Gold directly on the 3D crime scene: examine the mahogany desk, recover deleted laptop sectors, and unmask contradictory alibis on the evidence board.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-steel/20 flex items-center justify-between text-[10px] typewriter-text text-parchment-dim">
                <span>ACTION:</span>
                <span className="font-cinematic font-bold text-crimson-bright">PINS EVIDENCE & RED YARN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CASE PREVIEW */}
      <section id="case-preview" className="relative z-10 py-20 border-t border-steel/20 bg-charcoal/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-[11px] font-cinematic font-bold tracking-widest text-gold uppercase mb-1">
              4 • INITIAL CASEFILE
            </div>
            <h2 className="text-3xl sm:text-4xl font-cinematic font-black text-parchment">
              CASE PREVIEW
            </h2>
          </div>

          <div className="max-w-2xl mx-auto manila-folder rounded p-6 sm:p-8 shadow-dossier relative overflow-hidden">
            <div className="absolute top-4 right-4 text-[10px] font-cinematic font-bold px-2 py-0.5 bg-crimson/30 border border-crimson text-parchment rounded">
              UNSOLVED DOSSIER
            </div>

            <div className="text-xs font-cinematic font-bold text-gold tracking-widest uppercase mb-1">
              CASE #001
            </div>

            <h3 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wide mb-3">
              THE BLACKWOOD MURDER
            </h3>

            <p className="text-xs text-parchment-dim typewriter-text leading-relaxed mb-6 border-l-2 border-gold/40 pl-3">
              Lord Arthur Blackwood, patriarch of Blackwood Maritime & Ironworks, was found dead over his mahogany desk. The study door was locked from the inside, his laptop showed a message deleted at 22:47, and the wall safe dial was scratched.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-noir/80 border border-steel/30 rounded p-3 text-center mb-6">
              <div>
                <div className="text-lg font-cinematic font-bold text-gold">4</div>
                <div className="text-[9px] typewriter-text text-parchment-dim">SUSPECTS</div>
              </div>
              <div>
                <div className="text-lg font-cinematic font-bold text-gold">7+</div>
                <div className="text-[9px] typewriter-text text-parchment-dim">CLUES</div>
              </div>
              <div>
                <div className="text-lg font-cinematic font-bold text-gold">3</div>
                <div className="text-[9px] typewriter-text text-parchment-dim">LOCATIONS</div>
              </div>
              <div>
                <div className="text-lg font-cinematic font-bold text-crimson-bright">1</div>
                <div className="text-[9px] typewriter-text text-parchment-dim">CULPRIT</div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleBeginInvestigation}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-bright text-noir font-cinematic font-bold text-xs py-2.5 px-6 rounded-sm shadow-gold transition active:scale-95 tactile-btn"
              >
                <span>OPEN CASEFILE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="relative z-10 py-20 border-t border-steel/30 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-xs font-cinematic font-bold tracking-widest text-gold uppercase mb-2">
            START YOUR INVESTIGATION
          </div>
          <h2 className="text-3xl sm:text-5xl font-cinematic font-black text-parchment tracking-tight mb-4">
            EVERY DAY LEAVES A CLUE.
          </h2>
          <p className="text-xs sm:text-sm text-parchment-dim typewriter-text mb-6">
            Complete your tasks. Follow the clues. Solve the case.
          </p>
          <button
            onClick={handleBeginInvestigation}
            className="bg-gradient-to-r from-gold to-gold-bright hover:from-gold-bright hover:to-gold text-noir font-cinematic font-black py-4 px-10 rounded-sm shadow-gold transition-all duration-300 text-xs sm:text-sm tracking-widest active:scale-95 tactile-btn"
          >
            START YOUR INVESTIGATION
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-steel/20 bg-noir py-8 text-center text-xs text-parchment-dim typewriter-text">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            QUESTCHASE • PRODUCTION-QUALITY GAMIFIED PRODUCTIVITY SYSTEM
          </div>
          <div>
            "Complete your tasks. Follow the clues. Solve the case."
          </div>
        </div>
      </footer>
    </div>
  );
}
