'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { supabaseSignUp, isSupabaseConfigured } from '@/lib/supabase';
import { Shield, Mail, Lock, ArrowRight, UserCheck, Check, AlertCircle } from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuthenticatedUser, initGame } = useGameStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
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
      const { user, error } = await supabaseSignUp(email.trim(), password, name.trim());
      if (error) throw error;
      if (user) {
        setAuthenticatedUser({ id: user.id, email: user.email, name: name.trim() });
        await initGame();
      }

      soundEngine.playStampThud();
      setIsRegistered(true);

      setTimeout(() => {
        soundEngine.playPaperRustle();
        router.push('/desk');
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

      <div className="relative z-10 max-w-xl w-full bg-[#f4ede1] text-[#1a1714] p-6 sm:p-10 rounded-sm shadow-2xl border-4 border-[#2b2219]">
        {/* Header */}
        <div className="text-center border-b-2 border-t-2 border-[#2b2219] py-3 mb-6">
          <div className="w-12 h-12 mx-auto mb-2 bg-[#2b2219] rounded-full flex items-center justify-center text-gold shadow">
            <Shield className="w-6 h-6 text-gold" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-[#1a1714] tracking-wider uppercase">
            ESTABLISH DETECTIVE PROFILE
          </h1>
          <div className="text-[10px] typewriter-text text-[#5a422d] uppercase tracking-widest mt-0.5">
            QUESTCHASE BUREAU • COMMISSION DOCKET
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-500 rounded text-red-800 text-xs typewriter-text flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-cinematic font-bold text-[#2b2219] uppercase tracking-wider mb-1">
              DETECTIVE / OPERATIVE NAME
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-[#8c7355] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Inspector Alex Thorne"
                className="w-full bg-[#eae0cf] border-2 border-[#8c7355] focus:border-[#2b2219] rounded-sm pl-10 pr-3 py-2.5 text-xs text-[#1a1714] font-bold typewriter-text outline-none transition placeholder:text-[#8c7355]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-cinematic font-bold text-[#2b2219] uppercase tracking-wider mb-1">
              OFFICIAL BUREAU EMAIL
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

          <div>
            <label className="block text-xs font-cinematic font-bold text-[#2b2219] uppercase tracking-wider mb-1">
              CLEARANCE CIPHER KEY (PASSWORD)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8c7355] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters..."
                className="w-full bg-[#eae0cf] border-2 border-[#8c7355] focus:border-[#2b2219] rounded-sm pl-10 pr-3 py-2.5 text-xs text-[#1a1714] font-bold typewriter-text outline-none transition placeholder:text-[#8c7355]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isRegistering || isRegistered}
              className={`w-full py-3.5 px-6 rounded border-2 border-[#3d4f3b] bg-gradient-to-r from-[#203a27] via-[#2c4e36] to-[#203a27] hover:from-[#2a4d33] hover:to-[#2a4d33] text-[#f4ede1] font-cinematic font-black tracking-widest text-sm shadow-md transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 uppercase ${
                isRegistering ? 'animate-pulse opacity-90' : ''
              }`}
            >
              {isRegistered ? (
                <>
                  <Check className="w-5 h-5 text-gold-bright" />
                  <span>COMMISSION APPROVED</span>
                </>
              ) : isRegistering ? (
                <span>COMMISSIONING OPERATIVE...</span>
              ) : (
                <>
                  <span>COMMISSION DETECTIVE</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#8c7355]/40 text-center">
          <Link
            href="/login"
            className="text-xs font-cinematic font-bold text-[#2b2219] hover:text-[#7f2525] underline"
          >
            ALREADY COMMISSIONED? LOG IN TO BUREAU
          </Link>
        </div>
      </div>
    </div>
  );
}
