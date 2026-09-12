'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import {
  Compass,
  CheckSquare,
  FolderArchive,
  Search,
  Share2,
  User,
  Package,
  Award,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export function CommandBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeCaseId } = useGameStore();
  const currentCaseId = activeCaseId || 'case_001';

  // Don't render on landing or login page
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const navItems = [
    { label: 'DESK', href: '/headquarters', altHref: '/desk', icon: Compass },
    { label: 'TASKS', href: '/tasks', icon: CheckSquare },
    { label: 'CASES', href: '/cases', icon: FolderArchive },
    { label: 'SCENE', href: `/investigate/${currentCaseId}`, icon: Search, matchPrefix: '/investigate' },
    { label: 'BOARD', href: `/board/${currentCaseId}`, icon: Share2, matchPrefix: '/board' },
    { label: 'DOSSIER', href: '/character', icon: User },
    { label: 'LOCKER', href: '/locker', icon: Package },
  ];

  return (
    <nav
      aria-label="Detective Command Dock"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-full px-2"
    >
      <div className="flex items-center gap-1 bg-[#0f1013]/95 backdrop-blur-lg border border-gold/40 rounded-full px-3 py-1.5 shadow-dossier overflow-x-auto max-w-[96vw] scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.altHref && pathname === item.altHref) ||
            (item.matchPrefix && pathname.startsWith(item.matchPrefix));

          return (
            <button
              key={item.label}
              onClick={() => {
                soundEngine.playPaperRustle();
                router.push(item.href);
              }}
              title={item.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-150 whitespace-nowrap tactile-btn ${
                isActive
                  ? 'bg-gold text-noir font-bold font-cinematic shadow-gold scale-105'
                  : 'text-parchment-dim hover:text-parchment hover:bg-noir/60 font-cinematic'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-[11px] tracking-wider">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
