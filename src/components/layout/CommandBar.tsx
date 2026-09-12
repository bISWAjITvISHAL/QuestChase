'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
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

const NAV_ITEMS = [
  { label: 'DESK', href: '/desk', icon: Compass },
  { label: 'TASK DOCKET', href: '/tasks', icon: CheckSquare },
  { label: 'CASE ARCHIVE', href: '/cases', icon: FolderArchive },
  { label: 'CRIME SCENE', href: '/investigate/case_001', icon: Search },
  { label: 'EVIDENCE BOARD', href: '/board/case_001', icon: Share2 },
  { label: 'DOSSIER', href: '/character', icon: User },
  { label: 'LOCKER', href: '/locker', icon: Package },
  { label: 'ACHIEVEMENTS', href: '/achievements', icon: Award },
];

export function CommandBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't render on landing or login page
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <nav
      aria-label="Detective Navigation"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-full px-2"
    >
      <div className="flex items-center gap-1 bg-charcoal/95 backdrop-blur-lg border border-gold/40 rounded-full px-3 py-1.5 shadow-dossier overflow-x-auto max-w-[95vw]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href.includes('/investigate') && pathname.startsWith('/investigate')) ||
            (item.href.includes('/board') && pathname.startsWith('/board'));

          return (
            <button
              key={item.href}
              onClick={() => {
                soundEngine.playPaperRustle();
                router.push(item.href);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-gold text-noir font-bold font-cinematic shadow-gold scale-105'
                  : 'text-parchment-dim hover:text-parchment hover:bg-noir/60 font-cinematic'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px] tracking-wider">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
