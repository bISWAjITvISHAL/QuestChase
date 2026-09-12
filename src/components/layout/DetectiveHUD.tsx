'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import {
  Shield,
  Coins,
  Flame,
  Volume2,
  VolumeX,
  CloudRain,
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

export function DetectiveHUD() {
  const pathname = usePathname();
  const { profile, setProfile, cases, activeCaseId, signOut } = useGameStore();
  const [audioOn, setAudioOn] = useState(profile.settings?.audioEnabled ?? true);
  const [rainOn, setRainOn] = useState(profile.settings?.ambienceEnabled ?? true);

  const currentCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const gold = profile.gold || 0;
  const xpPercentage = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));

  const handleToggleAudio = () => {
    const next = !audioOn;
    setAudioOn(next);
    soundEngine.setSoundEnabled(next);
    setProfile({
      settings: {
        ...profile.settings,
        audioEnabled: next,
      },
    });
  };

  const handleToggleRain = () => {
    const next = !rainOn;
    setRainOn(next);
    soundEngine.setAmbienceEnabled(next);
    setProfile({
      settings: {
        ...profile.settings,
        ambienceEnabled: next,
      },
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0c0d10]/95 backdrop-blur-md border-b border-[#2b241c] px-3 sm:px-6 py-2.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Fedora/Pipe Logo + QuestChase Name */}
        <Link href="/headquarters" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#2a2219] to-noir border border-gold/40 flex items-center justify-center text-gold shadow-md group-hover:scale-105 transition">
            <svg
              className="w-5 h-5 text-gold"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {/* Fedora Hat Silhouette */}
              <path d="M12 2C8.5 2 6 4 4 6c1.5.5 3 .8 5 .9C10 7 11 7 12 7s2 0 3-.1c2-.1 3.5-.4 5-.9-2-2-4.5-4-8-4z" />
              <path d="M2 12c1.5 0 3-.5 4.5-1.2C8 10 9.8 9.5 12 9.5s4 .5 5.5 1.3C19 11.5 20.5 12 22 12c.6 0 1-.4 1-1 0-.3-.1-.6-.3-.8C20.5 8.5 17 8 12 8S3.5 8.5 1.3 10.2c-.2.2-.3.5-.3.8 0 .6.4 1 1 1z" />
              <path d="M6 14v1c0 3.3 2.7 6 6 6s6-2.7 6-6v-1c-1.8 1-3.8 1.5-6 1.5s-4.2-.5-6-1.5z" />
            </svg>
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
              <span className="text-[10px] text-steel typewriter-text">
                ({profile.xp.toLocaleString()} / {profile.xpToNextLevel.toLocaleString()} XP)
              </span>
            </div>
            <div className="w-28 h-1.5 bg-noir border border-steel/40 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-bright transition-all duration-500"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>

          {/* Gold counter */}
          <div className="flex items-center gap-1 bg-noir/90 border border-gold/40 px-2.5 py-1 rounded shadow-noir">
            <div className="text-right">
              <div className="text-[7px] text-steel typewriter-text leading-none uppercase">GOLD</div>
              <div className="text-xs font-cinematic font-bold text-gold leading-none mt-0.5">
                {gold}
              </div>
            </div>
            <Coins className="w-3.5 h-3.5 text-gold animate-pulse ml-0.5" />
          </div>

          {/* Streak counter */}
          <div className="flex items-center gap-1 bg-noir/90 border border-amber-600/40 px-2.5 py-1 rounded shadow-noir">
            <div className="text-right">
              <div className="text-[7px] text-steel typewriter-text leading-none uppercase">STREAK</div>
              <div className="text-xs font-cinematic font-bold text-amber-400 leading-none mt-0.5">
                {profile.streak}D
              </div>
            </div>
            <Flame className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
          </div>

          {/* Audio & Ambience Controls */}
          <div className="hidden lg:flex items-center gap-1 bg-noir border border-steel/40 rounded p-0.5">
            <button
              onClick={handleToggleAudio}
              title={audioOn ? 'Mute Sound FX' : 'Enable Sound FX'}
              className={`p-1 rounded transition ${
                audioOn ? 'text-gold hover:bg-charcoal' : 'text-steel hover:text-parchment'
              }`}
            >
              {audioOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleToggleRain}
              title={rainOn ? 'Mute Rain Ambience' : 'Enable Rain Ambience'}
              className={`p-1 rounded transition ${
                rainOn ? 'text-blue-400 hover:bg-charcoal' : 'text-steel hover:text-parchment'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Profile Avatar / Link */}
          <Link
            href="/character"
            className="w-8 h-8 rounded-full bg-noir border-2 border-gold/60 flex items-center justify-center text-gold hover:scale-105 transition shadow-gold"
            title="Detective Profile"
          >
            <User className="w-4 h-4" />
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            className="p-1.5 rounded bg-noir border border-steel/40 text-steel hover:text-crimson-bright hover:border-crimson/50 transition flex items-center gap-1"
            title="Sign Out of Bureau"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[8px] font-cinematic uppercase tracking-wider">LOGOUT</span>
          </button>
        </div>
      </div>
    </header>
  );
}
