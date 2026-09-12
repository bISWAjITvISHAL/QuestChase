'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { supabaseSignIn, isSupabaseConfigured } from '@/lib/supabase';
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  User,
  Check,
  Search,
  Camera,
  FileText,
  Key,
  AlertCircle,
  Fingerprint,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthenticatedUser, initGame } = useGameStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playTypewriter();
    setIsVerifying(true);
    setErrorMessage('');

    if (!isSupabaseConfigured) {
      setErrorMessage('Database configuration missing. Please verify Supabase environment variables.');
      setIsVerifying(false);
      return;
    }

    try {
      const { user, error } = await supabaseSignIn(email.trim(), password);
      if (error) throw error;
      if (user) {
        setAuthenticatedUser({ id: user.id, email: user.email, name: user.user_metadata?.name || 'Detective' });
        await initGame();
      }

      soundEngine.playStampThud();
      setIsVerified(true);
      setTimeout(() => {
        soundEngine.playPaperRustle();
        router.push('/headquarters');
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Identity verification failed. Please check credentials.';
      setErrorMessage(msg);
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-noir flex items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Dark Vignette & Background Radial Atmosphere */}
      <div className="absolute inset-0 bg-vignette pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Container Split View */}
      <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-[#0d0e11] border border-gold/30 rounded shadow-2xl overflow-hidden min-h-[600px]">
        {/* Left Side: Detective Desk Atmosphere & Classified Folder (Cols 1-6) */}
        <div className="lg:col-span-6 bg-[#111215] p-6 sm:p-10 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-steel/30">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="flex items-center justify-between z-10">
            <Link href="/" className="flex items-center gap-2 group">
              <Shield className="w-5 h-5 text-gold" />
              <span className="font-cinematic font-bold text-lg text-parchment tracking-wider">
                QUESTCHASE
              </span>
            </Link>
            <span className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase bg-crimson/20 border border-crimson/50 px-2 py-0.5 rounded">
              CLASSIFIED QC-77
            </span>
          </div>

          {/* Classified Dossier Graphic */}
          <div className="my-8 relative z-10">
            <div className="bg-[#18191c] border-2 border-gold/40 p-6 rounded shadow-dossier relative">
              {/* Folder Tab */}
              <div className="absolute -top-3.5 right-6 bg-[#2a2b30] px-3 py-0.5 rounded-t text-[9px] font-cinematic font-bold text-gold uppercase border-t border-x border-gold/40">
                DOSSIER #QC-00123
              </div>

              {/* Title & Classification */}
              <div className="text-center border-b border-steel/30 pb-4 mb-4">
                <div className="text-[10px] font-cinematic font-bold text-gold tracking-widest uppercase">
                  METROPOLITAN INVESTIGATION BUREAU
                </div>
                <h2 className="text-2xl font-cinematic font-black text-parchment tracking-wide mt-1">
                  CASE ACCESS TERMINAL
                </h2>
                <div className="text-[11px] typewriter-text text-parchment-dim mt-0.5">
                  COMMISSIONED PERSONNEL CLEARANCE
                </div>
              </div>

              {/* Case Briefing Items */}
              <div className="space-y-2 text-xs typewriter-text text-parchment-dim">
                <div className="flex items-start gap-2">
                  <span className="text-crimson-bright font-bold">▶</span>
                  <span>
                    <strong className="text-parchment">CLASSIFICATION:</strong> LEVEL 4 EYES ONLY
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-crimson-bright font-bold">▶</span>
                  <span>
                    <strong className="text-parchment">ACTIVE INQUEST:</strong> The Blackwood Manor Homicide
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-crimson-bright font-bold">▶</span>
                  <span>
                    <strong className="text-parchment">PROTOCOL:</strong> Productivity converted to forensic evidence
                  </span>
                </div>
              </div>

              {/* Crimson Bureau Stamp */}
              <div className="mt-6 flex justify-end">
                <div className="border-2 border-crimson text-crimson-bright font-cinematic font-black text-xs px-3 py-1 uppercase tracking-widest -rotate-6 rounded shadow-crimson">
                  AUTHORIZED PERSONNEL ONLY
                </div>
              </div>
            </div>

            {/* Suspect Photo Silhouette Preview */}
            <div className="absolute -bottom-4 -left-3 bg-[#1e2024] p-2 shadow-2xl rotate-3 border border-gold/40 w-32 hidden sm:block rounded">
              <div className="bg-[#0b0c0e] h-20 w-full flex flex-col items-center justify-center text-steel text-[9px] font-cinematic border border-steel/30 rounded">
                <Fingerprint className="w-7 h-7 text-gold/50 mb-1" />
                <span className="text-gold font-bold">SUSPECT #01</span>
              </div>
              <div className="text-[8px] text-parchment font-bold text-center mt-1 typewriter-text">
                MV-FILE-EVIDENCE
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="text-[10px] text-parchment-dim typewriter-text border-t border-steel/20 pt-3 flex items-center justify-between">
            <span>SECURE TERMINAL • MIB-77</span>
            <span className="text-gold font-bold">MILITARY-GRADE ENCRYPTION</span>
          </div>
        </div>

        {/* Right Side: Identity Verification Form (Cols 7-12) */}
        <div className="lg:col-span-6 bg-[#141518] p-6 sm:p-10 flex flex-col justify-between text-parchment">
          <div>
            {/* Form Header */}
            <div className="border-b border-steel/30 pb-3 mb-6">
              <div className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase">
                OFFICIAL BUREAU ACCESS PORTAL
              </div>
              <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-tight mt-0.5">
                IDENTITY VERIFICATION
              </h1>
              <p className="text-xs typewriter-text text-parchment-dim mt-1">
                Enter your registered Bureau operative credentials to access your casework desk.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-crimson/20 border border-crimson p-3 rounded text-xs font-bold text-red-300 mb-4 flex items-center gap-2 typewriter-text animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-crimson-bright" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bureau Email Address */}
              <div>
                <label className="block text-[11px] font-cinematic font-bold text-parchment uppercase tracking-wider mb-1.5">
                  OFFICIAL EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="detective@questchase.agency"
                    className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded pl-10 pr-3 py-2.5 text-xs text-parchment font-medium typewriter-text outline-none transition placeholder:text-steel focus:ring-1 focus:ring-gold/30"
                  />
                </div>
              </div>

              {/* Password / Cipher Key */}
              <div>
                <label className="block text-[11px] font-cinematic font-bold text-parchment uppercase tracking-wider mb-1.5">
                  CLEARANCE CIPHER KEY (PASSWORD)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter clearance cipher..."
                    className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded pl-10 pr-3 py-2.5 text-xs text-parchment font-medium typewriter-text outline-none transition placeholder:text-steel focus:ring-1 focus:ring-gold/30"
                  />
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between text-xs typewriter-text pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-parchment-dim hover:text-parchment">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-steel/40 text-gold focus:ring-0 bg-[#0b0c0e]"
                  />
                  <span>Remember clearance</span>
                </label>
                <Link
                  href="/register"
                  className="text-gold hover:text-gold-bright underline"
                >
                  New Detective?
                </Link>
              </div>

              {/* Primary Stamped Action Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isVerifying || isVerified}
                  className={`w-full py-3.5 px-6 rounded bg-gradient-to-r from-gold via-gold-bright to-gold hover:opacity-95 text-noir font-cinematic font-black tracking-widest text-xs shadow-gold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 uppercase tactile-btn ${
                    isVerifying ? 'animate-pulse opacity-90' : ''
                  }`}
                >
                  {isVerified ? (
                    <>
                      <Check className="w-4 h-4 text-noir stroke-[3]" />
                      <span>CLEARANCE CONFIRMED</span>
                    </>
                  ) : isVerifying ? (
                    <span>VERIFYING CREDENTIALS...</span>
                  ) : (
                    <>
                      <span>OPEN THE CASE DESK</span>
                      <ArrowRight className="w-4 h-4 text-noir" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Registration Link */}
          <div className="pt-6 mt-6 border-t border-steel/20 text-center">
            <Link
              href="/register"
              className="text-xs font-cinematic font-bold text-steel hover:text-gold tracking-wider uppercase transition-colors"
            >
              NEED A COMMISSION? ESTABLISH DETECTIVE PROFILE →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
