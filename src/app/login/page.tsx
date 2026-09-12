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
  Phone,
  FileText,
  Key,
  AlertCircle,
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
        router.push('/desk');
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
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-700/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Container Split View matching Reference Image 2 */}
      <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-[#0d0e11] border border-gold/30 rounded-sm shadow-2xl overflow-hidden min-h-[600px]">
        {/* Left Side: Detective Desk Atmosphere & Classified Folder (Cols 1-6) */}
        <div className="lg:col-span-6 bg-[#12100d] p-6 sm:p-10 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-steel/30">
          {/* Desk Lamp Ambient Glow in Top-Left */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

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

          {/* Classified Dossier Graphic on Desk matching Mockup */}
          <div className="my-8 relative z-10">
            <div className="manila-folder p-6 rounded-sm shadow-2xl relative">
              {/* Folder Tab & File ID */}
              <div className="absolute -top-3.5 right-6 bg-[#5a422d] px-3 py-0.5 rounded-t text-[9px] font-cinematic font-bold text-parchment uppercase border-t border-x border-gold/40">
                FILE #QC-00123
              </div>

              {/* Title & Classification */}
              <div className="text-center border-b-2 border-gold/30 pb-4 mb-4">
                <div className="text-xs font-cinematic font-bold text-gold tracking-widest uppercase">
                  METROPOLITAN INVESTIGATION BUREAU
                </div>
                <h2 className="text-2xl font-cinematic font-black text-parchment tracking-wide mt-1">
                  CASE ACCESS
                </h2>
                <div className="text-[11px] typewriter-text text-parchment-dim mt-0.5">
                  IDENTITY VERIFICATION REQUIRED
                </div>
              </div>

              {/* Case Briefing Items */}
              <div className="space-y-2 text-xs typewriter-text text-parchment/90">
                <div className="flex items-start gap-2">
                  <span className="text-crimson font-bold">▶</span>
                  <span>
                    <strong>CLASSIFICATION:</strong> LEVEL 4 EYES ONLY
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-crimson font-bold">▶</span>
                  <span>
                    <strong>INCIDENT:</strong> The Blackwood Manor Homicide
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-crimson font-bold">▶</span>
                  <span>
                    <strong>STATUS:</strong> Forensic investigation underway
                  </span>
                </div>
              </div>

              {/* Red Stamp Seal */}
              <div className="mt-6 flex justify-end">
                <div className="border-2 border-crimson text-crimson-bright font-cinematic font-black text-xs px-3 py-1 uppercase tracking-widest -rotate-6 rounded-sm shadow-crimson">
                  AUTHORIZED PERSONNEL ONLY
                </div>
              </div>
            </div>

            {/* Pinned Suspect Photo Preview (Decorative Noir Depth) */}
            <div className="absolute -bottom-4 -left-3 bg-[#eae0cf] p-1.5 shadow-xl rotate-3 border border-gold/40 w-28 hidden sm:block">
              <div className="bg-[#1a1714] h-20 w-full flex items-center justify-center text-steel-dark text-[9px] font-cinematic">
                <Camera className="w-5 h-5 text-gold/40" />
              </div>
              <div className="text-[8px] text-[#1a1714] font-bold text-center mt-1 typewriter-text">
                SUSPECT #01
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="text-[10px] text-parchment-dim typewriter-text border-t border-steel/20 pt-3 flex items-center justify-between">
            <span>SECURE TERMINAL • MIB-77</span>
            <span>SYSTEM ENCRYPTED</span>
          </div>
        </div>

        {/* Right Side: Paper Dossier Identity Verification Form (Cols 7-12) */}
        <div className="lg:col-span-6 bg-[#f4eee1] p-6 sm:p-10 flex flex-col justify-between text-[#1a1714]">
          <div>
            {/* Form Header */}
            <div className="border-b-2 border-[#2b2219]/20 pb-3 mb-6">
              <div className="text-[10px] font-cinematic font-bold tracking-widest text-[#7f2525] uppercase">
                OFFICIAL BUREAU ACCESS PORTAL
              </div>
              <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-[#1a1714] tracking-tight">
                IDENTITY VERIFICATION
              </h1>
              <p className="text-xs typewriter-text text-[#5a422d] mt-1">
                Enter your registered Bureau email and authorization key to open your case file.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-crimson/15 border-2 border-crimson p-3 rounded-sm text-xs font-bold text-crimson mb-4 flex items-center gap-2 typewriter-text animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bureau Email Address */}
              <div>
                <label className="block text-[11px] font-cinematic font-bold text-[#2b2219] uppercase mb-1">
                  OFFICIAL EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8c7355] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="detective@questchase.agency"
                    className="w-full bg-[#eae0cf] border-2 border-[#8c7355] focus:border-[#2b2219] rounded-sm pl-10 pr-3 py-2.5 text-xs text-[#1a1714] font-bold typewriter-text outline-none transition placeholder:text-[#8c7355]"
                  />
                </div>
              </div>

              {/* Password / Cipher Key */}
              <div>
                <label className="block text-[11px] font-cinematic font-bold text-[#2b2219] uppercase mb-1">
                  CLEARANCE CIPHER KEY (PASSWORD)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8c7355] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter cipher key..."
                    className="w-full bg-[#eae0cf] border-2 border-[#8c7355] focus:border-[#2b2219] rounded-sm pl-10 pr-3 py-2.5 text-xs text-[#1a1714] font-bold typewriter-text outline-none transition placeholder:text-[#8c7355]"
                  />
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between text-xs typewriter-text pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#2b2219] font-bold">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#8c7355] text-[#2b2219] focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
                <Link
                  href="/register"
                  className="text-[#7f2525] underline hover:text-[#2b2219]"
                >
                  New Detective?
                </Link>
              </div>

              {/* Primary Stamped Green/Gold Action Button matching Mockup */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isVerifying || isVerified}
                  className={`w-full py-3.5 px-6 rounded border-2 border-[#3d4f3b] bg-gradient-to-r from-[#203a27] via-[#2c4e36] to-[#203a27] hover:from-[#2a4d33] hover:to-[#2a4d33] text-[#f4ede1] font-cinematic font-black tracking-widest text-sm shadow-md transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 uppercase ${
                    isVerifying ? 'animate-pulse opacity-90' : ''
                  }`}
                >
                  {isVerified ? (
                    <>
                      <Check className="w-5 h-5 text-gold-bright" />
                      <span>IDENTITY VERIFIED</span>
                    </>
                  ) : isVerifying ? (
                    <span>VERIFYING CREDENTIALS...</span>
                  ) : (
                    <>
                      <span>ENTER THE CASE</span>
                      <ArrowRight className="w-4 h-4 text-gold" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Registration Link */}
          <div className="pt-6 mt-6 border-t border-[#8c7355]/40 text-center space-y-2">
            <Link
              href="/register"
              className="text-xs font-cinematic font-bold text-[#2b2219] hover:text-[#7f2525] underline block"
            >
              CREATE DETECTIVE PROFILE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
