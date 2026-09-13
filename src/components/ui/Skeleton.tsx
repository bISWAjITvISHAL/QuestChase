'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'gold' | 'noir' | 'crimson';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  style?: React.CSSProperties;
}

export function Skeleton({
  className = '',
  variant = 'default',
  rounded = 'sm',
  style,
}: SkeletonProps) {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  const variantClass = {
    default: 'bg-[#181a1f] border border-steel/20',
    gold: 'bg-[#1c1913] border border-gold/30',
    noir: 'bg-[#0d0e11] border border-steel/30',
    crimson: 'bg-[#1d1212] border border-crimson/30',
  }[variant];

  return (
    <div
      className={`skeleton-shimmer ${variantClass} ${roundedClass} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for Real-World Task / Quest Dockets
 */
export function TaskCardSkeleton() {
  return (
    <div className="bg-[#121316] border border-steel/30 rounded p-4 shadow-dossier flex flex-col justify-between space-y-4">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Skeleton className="h-5 w-20 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>

        {/* Title */}
        <Skeleton className="h-5 w-4/5 mb-2 rounded" />

        {/* Description */}
        <div className="space-y-1.5 mb-3">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-3/4 rounded" />
        </div>

        {/* Reward Chips */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-steel/20">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-steel/20 flex items-center justify-between">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-8 w-28 rounded-sm" variant="gold" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Master Case Archives
 */
export function CaseCardSkeleton() {
  return (
    <div className="bg-[#121316] border-2 border-steel/30 rounded p-6 shadow-dossier flex flex-col justify-between relative space-y-5">
      {/* Dossier Tab */}
      <div className="absolute -top-3.5 right-6">
        <Skeleton className="h-4 w-24 rounded-t" variant="gold" />
      </div>

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between border-b border-steel/20 pb-3 mb-4">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-5 w-36 rounded" />
        </div>

        {/* Title */}
        <Skeleton className="h-7 w-3/4 mb-2 rounded" />
        <Skeleton className="h-3.5 w-32 mb-4 rounded" />

        {/* Synopsis */}
        <div className="space-y-1.5 mb-6 pl-3 border-l-2 border-steel/30 py-2">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-3 gap-2 bg-[#0b0c0e] border border-steel/25 rounded p-3 mb-6">
          <div className="flex flex-col items-center space-y-1">
            <Skeleton className="h-2.5 w-12 rounded" />
            <Skeleton className="h-5 w-8 rounded" />
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Skeleton className="h-2.5 w-16 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Skeleton className="h-2.5 w-14 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 border-t border-steel/20 flex items-center justify-between">
        <Skeleton className="h-3.5 w-28 rounded" />
        <Skeleton className="h-10 w-44 rounded-sm" variant="gold" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Equipment Requisition Locker
 */
export function LockerItemSkeleton() {
  return (
    <div className="bg-[#111317] border border-steel/30 rounded-sm p-5 flex flex-col justify-between space-y-4">
      <div>
        {/* Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>

        {/* Icon & Title */}
        <div className="flex items-start gap-3 mb-2">
          <Skeleton className="w-11 h-11 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
          </div>
        </div>

        {/* Passive Perk Card */}
        <div className="mt-4 bg-[#0b0c0e] border border-steel/30 rounded p-3 space-y-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      </div>

      {/* Purchase Action */}
      <div className="pt-4 border-t border-steel/20">
        <Skeleton className="h-10 w-full rounded-sm" variant="gold" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Investigative Medals & Achievements
 */
export function AchievementCardSkeleton() {
  return (
    <div className="bg-[#111317] border border-steel/30 rounded-sm p-4 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <Skeleton className="w-9 h-9 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>

        <Skeleton className="h-4 w-3/5 mb-1.5 rounded" />
        <Skeleton className="h-3 w-full mb-1 rounded" />
        <Skeleton className="h-3 w-4/5 mb-3 rounded" />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <Skeleton className="h-2.5 w-14 rounded" />
          <Skeleton className="h-2.5 w-10 rounded" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full mb-3" />
        <div className="flex items-center justify-between border-t border-steel/20 pt-2">
          <Skeleton className="h-2.5 w-20 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Account Creation & Commission Operative
 */
export function CommissionOperativeSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="p-4 bg-[#0b0c0e] border border-gold/40 rounded flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" variant="gold" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-cinematic font-bold text-gold uppercase tracking-widest">
              COMMISSIONING OPERATIVE CREDENTIALS...
            </span>
            <span className="text-[9px] typewriter-text text-steel animate-pulse">ENCRYPTING</span>
          </div>
          <Skeleton className="h-2 w-full rounded-full" variant="gold" />
        </div>
      </div>

      {/* Field Skeletons */}
      <div className="space-y-3 pt-2">
        <div className="space-y-1">
          <Skeleton className="h-3 w-36 rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
      </div>

      {/* Attribute Allocation Shimmer */}
      <div className="bg-[#18191c] border border-steel/30 rounded p-3 space-y-2">
        <Skeleton className="h-3 w-48 rounded" variant="gold" />
        <div className="grid grid-cols-4 gap-2">
          <Skeleton className="h-12 rounded" />
          <Skeleton className="h-12 rounded" />
          <Skeleton className="h-12 rounded" />
          <Skeleton className="h-12 rounded" />
        </div>
      </div>

      <Skeleton className="h-12 w-full rounded-sm" variant="gold" />
    </div>
  );
}

/**
 * Skeleton for Login Verification Scanner
 */
export function LoginVerificationSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="p-4 bg-[#0b0c0e] border border-gold/40 rounded flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" variant="gold" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-cinematic font-bold text-gold uppercase tracking-widest">
              AUTHENTICATING CLEARANCE CIPHER...
            </span>
            <span className="text-[9px] typewriter-text text-steel animate-pulse">VERIFYING</span>
          </div>
          <Skeleton className="h-2 w-full rounded-full" variant="gold" />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="space-y-1">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-36 rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>

      <Skeleton className="h-12 w-full rounded-sm" variant="gold" />
    </div>
  );
}

/**
 * Skeleton for Task Creation Modal Submission
 */
export function CreateTaskModalLoadingSkeleton() {
  return (
    <div className="space-y-4 py-2 animate-in fade-in duration-200">
      <div className="p-3.5 bg-[#0b0c0e] border border-gold/40 rounded flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full" variant="gold" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-cinematic font-bold text-gold uppercase tracking-widest">
              ENSCRIBING TO CENTRAL CASEWORK DOCKET...
            </span>
            <span className="text-[9px] typewriter-text text-steel animate-pulse">SAVING</span>
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" variant="gold" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-3 w-44 rounded" />
          <Skeleton className="h-9 w-full rounded" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-36 rounded" />
          <Skeleton className="h-14 w-full rounded" />
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          <Skeleton className="h-10 rounded" />
          <Skeleton className="h-10 rounded" />
          <Skeleton className="h-10 rounded" />
          <Skeleton className="h-10 rounded" />
          <Skeleton className="h-10 rounded" />
          <Skeleton className="h-10 rounded" />
        </div>
        <div className="bg-[#0b0c0e] border border-steel/30 rounded p-3 flex justify-around">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Full Tasks Page (Stats, Filter, Grid)
 */
export function TasksPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/30 pb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-48 rounded" variant="crimson" />
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-3.5 w-96 rounded" />
        </div>
        <Skeleton className="h-10 w-40 rounded-sm" variant="gold" />
      </div>

      {/* Intelligence Ledger / Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-charcoal/80 border border-steel/30 rounded-sm p-3 space-y-1.5">
          <Skeleton className="h-2.5 w-24 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        <div className="bg-charcoal/80 border border-steel/30 rounded-sm p-3 space-y-1.5">
          <Skeleton className="h-2.5 w-24 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        <div className="bg-charcoal/80 border border-steel/30 rounded-sm p-3 space-y-1.5">
          <Skeleton className="h-2.5 w-20 rounded" />
          <Skeleton className="h-6 w-20 rounded" />
        </div>
        <div className="bg-charcoal/80 border border-steel/30 rounded-sm p-3 space-y-1.5">
          <Skeleton className="h-2.5 w-24 rounded" />
          <Skeleton className="h-6 w-20 rounded" />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-charcoal/70 border border-steel/30 p-2.5 rounded-sm">
        <div className="flex gap-1">
          <Skeleton className="h-7 w-16 rounded" />
          <Skeleton className="h-7 w-16 rounded" />
          <Skeleton className="h-7 w-16 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-48 rounded-sm" />
          <Skeleton className="h-7 w-32 rounded-sm" />
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for Evidence Cork Board
 */
export function EvidenceBoardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/30 pb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-48 rounded" variant="crimson" />
          <Skeleton className="h-8 w-72 rounded" />
          <Skeleton className="h-3.5 w-80 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-sm" />
          <Skeleton className="h-10 w-36 rounded-sm" variant="gold" />
        </div>
      </div>

      {/* Cork Board Area */}
      <div className="relative w-full h-[640px] bg-[#1a1714] border-4 border-[#3e2e1e] rounded-sm p-6 overflow-hidden flex flex-col justify-between">
        <div className="grid grid-cols-3 gap-8">
          <Skeleton className="h-36 w-56 rounded-sm" variant="gold" />
          <Skeleton className="h-40 w-60 rounded-sm" variant="noir" />
          <Skeleton className="h-36 w-52 rounded-sm" variant="crimson" />
        </div>
        <div className="grid grid-cols-3 gap-8">
          <Skeleton className="h-40 w-60 rounded-sm" variant="noir" />
          <Skeleton className="h-36 w-56 rounded-sm" variant="gold" />
          <Skeleton className="h-40 w-64 rounded-sm" variant="noir" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for 3D Crime Scene & Forensic Deployment
 */
export function CrimeSceneSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-steel/30 pb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-44 rounded" variant="crimson" />
          <Skeleton className="h-8 w-64 rounded" />
          <Skeleton className="h-3.5 w-96 rounded" />
        </div>
        <Skeleton className="h-10 w-44 rounded-sm" variant="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Scene Viewport */}
        <div className="lg:col-span-8 bg-[#0b0c0e] border border-steel/30 rounded h-[460px] flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <Skeleton className="w-16 h-16 rounded-full mx-auto" variant="gold" />
            <Skeleton className="h-4 w-48 mx-auto rounded" />
            <Skeleton className="h-2 w-64 mx-auto rounded-full" variant="gold" />
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-4 space-y-3">
          <Skeleton className="h-20 w-full rounded" />
          <Skeleton className="h-20 w-full rounded" />
          <Skeleton className="h-20 w-full rounded" />
          <Skeleton className="h-20 w-full rounded" />
        </div>
      </div>
    </div>
  );
}
