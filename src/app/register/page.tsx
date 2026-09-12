'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { supabaseSignUp, isSupabaseConfigured } from '@/lib/supabase';
import { Shield, Mail, Lock, ArrowRight, UserCheck, Check, AlertCircle, Fingerprint, Award } from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

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
    soundEngine.playTypewriter();
    setIsRegistering(true);
    setErrorMessage('');

    if (!isSupabaseConfigured) {
      setErrorMessage('Database configuration missing. Please verify Supabase environment variables.');
      setIsRegistering(false);
      return;
    }

    try {
      const { user, session, error } = await supabaseSignUp(email.trim(), password, name.trim());
      if (error) throw error;

      if (user && !session) {
        setIsRegistered(true);
        setRequiresEmailConfirmation(true);
        soundEngine.playStampThud();
        return;
      }

      if (user) {
        setAuthenticatedUser({ id: user.id, email: user.email, name: name.trim() });
        await initGame();
      }

      soundEngine.playStampThud();
      setIsRegistered(true);

      setTimeout(() => {
        soundEngine.playPaperRustle();
        router.push('/headquarters');
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please check your credentials.';
      setErrorMessage(msg);
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-noir flex items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-vignette pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full bg-[#121316] text-parchment p-6 sm:p-10 rounded shadow-2xl border-2 border-gold/40">
        {/* Header */}
        <div className="text-center border-b border-steel/30 pb-5 mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-[#1c1d22] border-2 border-gold/60 rounded-full flex items-center justify-center text-gold shadow-gold">
            <Shield className="w-7 h-7 text-gold" />
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

        {requiresEmailConfirmation ? (
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
