'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import {
  Shield,
  Coins,
  Flame,
  Volume2,
  VolumeX,
  MapPin,
  Compass,
  CheckSquare,
  Share2,
  FolderArchive,
  User,
  Package,
  Sparkles,
  Search,
  LogOut,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { AnimatedProgressBar } from '@/components/ui/AnimatedProgressBar';
import { calculateXpForLevel } from '@/lib/initialData';

export function DetectiveHUD() {
  const pathname = usePathname();
  const { profile, setProfile, cases, activeCaseId, signOut } = useGameStore();

  const audioOn = profile.settings?.audioEnabled ?? true;

  const currentCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const gold = profile.gold || 0;
  const xpNeeded = profile.xpToNextLevel || calculateXpForLevel(profile.level);
  const xpPercentage = Math.min(100, Math.max(0, Math.round(((profile.xp || 0) / (xpNeeded || 100)) * 100)));

  const handleToggleAudio = () => {
    const next = !audioOn;
    setProfile({
      settings: {
        ...profile.settings,
        audioEnabled: next,
      },
    });
    if (next) {
      soundEngine.playStampThud();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0c0d10]/95 backdrop-blur-md border-b border-[#2b241c] px-3 sm:px-6 py-2 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Official QuestChase Emblem Logo + Name */}
        <Link
          href="/headquarters"
          className="flex items-center gap-2.5 group shrink-0 min-h-[44px] py-1 rounded focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gold/60 flex items-center justify-center bg-noir shadow-gold group-hover:scale-105 transition duration-150 shrink-0">
            <Image
              src="/logo.png"
              alt="QuestChase Detective Bureau Emblem"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-cinematic font-bold text-sm sm:text-base text-parchment tracking-wider leading-none">
              QuestChase
            </span>
            <span className="text-[8px] text-gold font-cinematic uppercase tracking-widest mt-0.5">
              Detective Bureau
            </span>
          </div>
        </Link>

        {/* Center: Case Header */}
        <div className="flex flex-col items-center text-center truncate px-2">
          <div className="text-[8px] sm:text-[9px] font-cinematic font-bold text-crimson-bright tracking-widest uppercase">
            {currentCase.code}
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <h1 className="text-xs sm:text-sm font-cinematic font-bold text-parchment tracking-wider truncate">
              {currentCase.title}
            </h1>
            <div className="hidden sm:flex w-3.5 h-3.5 rounded-full bg-gold/20 border border-gold/40 items-center justify-center text-gold shrink-0">
              <MapPin className="w-2 h-2" />
            </div>
          </div>
        </div>

        {/* Right: Level, XP Bar, Gold, Streak, Audio & Profile */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Level & XP bar (Desktop) */}
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-xs font-cinematic font-bold text-parchment">
              <span>LEVEL {profile.level}</span>
              <span className="text-[10px] text-steel typewriter-text flex items-center gap-0.5">
                (<AnimatedNumber value={profile.xp} /> / {xpNeeded.toLocaleString()} XP)
              </span>
            </div>
            <div className="w-32 mt-1">
              <AnimatedProgressBar
                percentage={xpPercentage}
                height="h-1.5"
                ariaLabel="Detective clearance level progress"
              />
            </div>
          </div>

          {/* Gold counter with AnimatedNumber */}
          <div className="flex items-center gap-1 bg-noir/90 border border-gold/40 px-2.5 py-1 min-h-[38px] rounded shadow-noir">
            <div className="text-right">
              <div className="text-[7px] text-steel typewriter-text leading-none uppercase">GOLD</div>
              <div className="text-xs font-cinematic font-bold text-gold leading-none mt-0.5">
                <AnimatedNumber value={gold} />
              </div>
            </div>
            <Coins className="w-3.5 h-3.5 text-gold animate-pulse ml-0.5 shrink-0" />
          </div>

          {/* Streak counter */}
          <div className="flex items-center gap-1 bg-noir/90 border border-amber-600/40 px-2.5 py-1 min-h-[38px] rounded shadow-noir">
            <div className="text-right">
              <div className="text-[7px] text-steel typewriter-text leading-none uppercase">STREAK</div>
              <div className="text-xs font-cinematic font-bold text-amber-400 leading-none mt-0.5">
                {profile.streak}D
              </div>
            </div>
            <Flame className="w-3.5 h-3.5 text-amber-500 ml-0.5 shrink-0" />
          </div>

          {/* Audio SFX Controls */}
          <div className="hidden sm:flex items-center bg-noir border border-steel/40 rounded p-0.5">
            <button
              onClick={handleToggleAudio}
              title={audioOn ? 'Sound Effects: ON (Click to Mute)' : 'Sound Effects: MUTED (Click to Unmute)'}
              aria-label={audioOn ? 'Mute Sound Effects' : 'Enable Sound Effects'}
              className={`px-2.5 py-1.5 rounded transition cursor-pointer min-h-[32px] flex items-center gap-1.5 text-[11px] font-cinematic ${
                audioOn ? 'text-gold hover:bg-charcoal' : 'text-steel hover:text-parchment'
              }`}
            >
              {audioOn ? <Volume2 className="w-3.5 h-3.5 text-gold" /> : <VolumeX className="w-3.5 h-3.5 text-steel" />}
              <span className="text-[9px] uppercase tracking-wider">{audioOn ? 'SFX ON' : 'MUTED'}</span>
            </button>
          </div>

          {/* Profile Avatar / Link with 44px touch target */}
          <Link
            href="/character"
            className="w-9 h-9 rounded-full bg-noir border-2 border-gold/60 flex items-center justify-center text-gold hover:scale-105 active:scale-95 transition shadow-gold min-w-[36px] min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            title="Detective Profile"
            aria-label="View Detective Dossier & Profile"
          >
            <User className="w-4 h-4" />
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            className="px-2 py-1.5 min-h-[38px] rounded bg-noir border border-steel/40 text-steel hover:text-crimson-bright hover:border-crimson/50 active:scale-95 transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
            title="Sign Out of Bureau"
            aria-label="Sign Out of Bureau"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[8px] font-cinematic uppercase tracking-wider">LOGOUT</span>
          </button>
        </div>
      </div>
    </header>
  );
}
