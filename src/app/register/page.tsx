'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { supabaseSignUp, isSupabaseConfigured } from '@/lib/supabase';
import { Shield, Mail, Lock, ArrowRight, UserCheck, Check, AlertCircle, Fingerprint, Award } from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';
import { CommissionOperativeSkeleton } from '@/components/ui/Skeleton';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuthenticatedUser, initGame } = useGameStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMessage('All credentials and operative signature are required.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Clearance key must be at least 6 characters in length.');
      return;
    }

    setErrorMessage('');
    setIsRegistering(true);
    soundEngine.playClick();

    if (!isSupabaseConfigured) {
      // Offline / guest mock registration
      setTimeout(async () => {
        setIsRegistering(false);
        setIsRegistered(true);
        soundEngine.playSolveMystery();
        await initGame();
        setTimeout(() => {
          router.push('/headquarters');
        }, 1200);
      }, 1000);
      return;
    }

    try {
      const { user, session } = await supabaseSignUp(email.trim(), password, name.trim());
      setIsRegistering(false);

      if (session && user) {
        soundEngine.playSolveMystery();
        setIsRegistered(true);
        setAuthenticatedUser(user);
        await initGame();
        setTimeout(() => {
          router.push('/headquarters');
        }, 1200);
      } else if (user && !session) {
        soundEngine.playStampThud();
        setIsRegistered(true);
        setRequiresEmailConfirmation(true);
      }
    } catch (err: unknown) {
      setIsRegistering(false);
      const message = err instanceof Error ? err.message : 'Registration failed. Please check your credentials.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-noir text-parchment flex items-center justify-center p-4 relative overflow-hidden">
      {/* Noir background vignette */}
      <div className="absolute inset-0 bg-vignette pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full bg-[#121316] text-parchment p-6 sm:p-10 rounded shadow-2xl border-2 border-gold/40">
        {/* Header */}
        <div className="text-center border-b border-steel/30 pb-5 mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-noir border-2 border-gold/60 rounded-full overflow-hidden flex items-center justify-center text-gold shadow-gold">
            <Image
              src="/logo.png"
              alt="QuestChase Bureau Emblem"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase mb-1">
            COMMISSION DOCKET • FORM QC-01
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wider uppercase">
            COMMISSION OPERATIVE
          </h1>
          <p className="text-xs typewriter-text text-parchment-dim mt-1 max-w-md mx-auto">
            Establish your official QuestChase Bureau service dossier. Earn rank, investigate crime scenes, and deduce the truth.
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-crimson/20 border border-crimson rounded text-red-200 text-xs typewriter-text flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-crimson-bright shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isRegistering ? (
          <CommissionOperativeSkeleton />
        ) : requiresEmailConfirmation ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold">
              <Mail className="w-6 h-6 text-gold animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-cinematic font-bold text-parchment uppercase tracking-wide">
                DISPATCH TRANSMITTED TO YOUR INBOX
              </h2>
              <p className="text-xs text-parchment-dim typewriter-text max-w-md mx-auto">
                A verification dispatch has been sent to <span className="text-gold font-bold">{email}</span>.
                Please verify your email to activate your clearance badge, then proceed to the bureau login desk.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-gradient-to-r from-gold to-gold-bright text-noir font-cinematic font-bold text-xs uppercase tracking-wider hover:opacity-95 transition"
            >
              <span>PROCEED TO CASE DESK LOGIN</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-1.5">
              DETECTIVE / OPERATIVE NAME *
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Inspector Alex Thorne"
                className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded pl-10 pr-3 py-2.5 text-xs text-parchment font-medium typewriter-text outline-none transition placeholder:text-steel focus:ring-1 focus:ring-gold/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider mb-1.5">
              OFFICIAL BUREAU EMAIL *
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-cinematic font-bold text-parchment uppercase tracking-wider">
                CLEARANCE CIPHER (PASSWORD) *
              </label>
              <span className="text-[10px] typewriter-text text-steel">Choose a password for your case desk</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password for your case desk (min 6 chars)..."
                className="w-full bg-[#0b0c0e] border border-steel/40 focus:border-gold rounded pl-10 pr-3 py-2.5 text-xs text-parchment font-medium typewriter-text outline-none transition placeholder:text-steel focus:ring-1 focus:ring-gold/30"
              />
            </div>
          </div>

          {/* Core Attribute Preview */}
          <div className="bg-[#18191c] border border-steel/30 rounded p-3 text-[10px] typewriter-text">
            <div className="text-gold font-cinematic font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-gold" />
              <span>INITIAL COMMENCEMENT ATTRIBUTES:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-[#0b0c0e] p-1.5 rounded border border-steel/20">
                <span className="text-steel">INTELLIGENCE</span>
                <div className="text-parchment font-bold text-xs">LVL 1</div>
              </div>
              <div className="bg-[#0b0c0e] p-1.5 rounded border border-steel/20">
                <span className="text-steel">PERCEPTION</span>
                <div className="text-parchment font-bold text-xs">LVL 1</div>
              </div>
              <div className="bg-[#0b0c0e] p-1.5 rounded border border-steel/20">
                <span className="text-steel">DISCIPLINE</span>
                <div className="text-parchment font-bold text-xs">LVL 1</div>
              </div>
              <div className="bg-[#0b0c0e] p-1.5 rounded border border-steel/20">
                <span className="text-steel">RESILIENCE</span>
                <div className="text-parchment font-bold text-xs">LVL 1</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isRegistering || isRegistered}
              className={`w-full py-3.5 px-6 rounded bg-gradient-to-r from-gold via-gold-bright to-gold hover:opacity-95 text-noir font-cinematic font-black tracking-widest text-xs shadow-gold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 uppercase tactile-btn ${
                isRegistering ? 'animate-pulse opacity-90' : ''
              }`}
            >
              {isRegistered ? (
                <>
                  <Check className="w-4 h-4 text-noir stroke-[3]" />
                  <span>COMMISSION APPROVED</span>
                </>
              ) : isRegistering ? (
                <span>COMMISSIONING OPERATIVE...</span>
              ) : (
                <>
                  <span>RECEIVE BADGE & ENTER BUREAU</span>
                  <ArrowRight className="w-4 h-4 text-noir" />
                </>
              )}
            </button>
          </div>
        </form>
        )}

        <div className="mt-6 pt-4 border-t border-steel/20 text-center">
          <Link
            href="/login"
            className="text-xs font-cinematic font-bold text-steel hover:text-gold tracking-wider uppercase transition-colors"
          >
            ALREADY COMMISSIONED? SIGN IN TO CASE DESK →
          </Link>
        </div>
      </div>
    </div>
  );
}
