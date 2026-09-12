'use client';

import React, { useState } from 'react';
import { GameShell } from '@/components/layout/GameShell';
import { useGameStore } from '@/lib/store';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import {
  Package,
  Search,
  Camera,
  Watch,
  Key,
  Shield,
  FileText,
  Coins,
  Check,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

const GEAR_ICONS: Record<string, React.ElementType> = {
  Search,
  Camera,
  Watch,
  Key,
  Shield,
  FileText,
};

export default function LockerPage() {
  const { equipment, profile, purchaseEquipment, toggleEquipItem } = useGameStore();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const gold = profile.gold || 0;

  const handlePurchase = async (itemId: string) => {
    setPurchasingId(itemId);
    soundEngine.playTypewriter();
    try {
      const success = await purchaseEquipment(itemId);
      if (!success) {
        setFeedback('INSUFFICIENT GOLD: Complete casework quests to earn Gold.');
        setTimeout(() => setFeedback(null), 4000);
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const handleToggle = (itemId: string) => {
    soundEngine.playPaperRustle();
    toggleEquipItem(itemId);
  };

  return (
    <GameShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-steel/30 pb-4">
          <div>
            <div className="text-[10px] font-cinematic font-bold tracking-widest text-crimson-bright uppercase">
              EQUIPMENT LOCKER • FIELD ARMORY & PERKS
            </div>
            <h1 className="text-2xl sm:text-3xl font-cinematic font-black text-parchment tracking-wide">
              INVESTIGATIVE GEAR
            </h1>
            <p className="text-xs text-parchment-dim typewriter-text mt-1">
              Requisition specialized forensic tools using earned Gold to gain passive bonuses and investigation perks.
            </p>
          </div>

          {/* Gold Balance Display */}
          <div className="bg-charcoal border border-gold/40 rounded px-3 py-2 flex items-center gap-2 self-start sm:self-auto shadow-noir">
            <Coins className="w-5 h-5 text-gold animate-pulse" />
            <div className="text-left">
              <div className="text-[9px] text-parchment-dim typewriter-text">AVAILABLE GOLD</div>
              <div className="text-sm font-bold text-gold font-cinematic">
                {gold} GOLD
              </div>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="bg-crimson/20 border border-crimson text-red-200 px-4 py-2.5 rounded-sm text-xs typewriter-text animate-in fade-in">
            {feedback}
          </div>
        )}

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item) => {
            const Icon = GEAR_ICONS[item.iconName] || Package;
            const itemCost = item.costGold || 100;
            const canAfford = gold >= itemCost;

            return (
              <div
                key={item.id}
                className={`parchment-card rounded-sm p-5 flex flex-col justify-between transition-all duration-300 ${
                  item.isEquipped
                    ? 'border-gold shadow-gold bg-charcoal/90'
                    : item.isUnlocked
                    ? 'border-steel/50 bg-charcoal/60'
                    : 'border-steel/30 opacity-75'
                }`}
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-cinematic font-bold text-gold px-2 py-0.5 rounded border border-gold/30 bg-noir">
                      {item.category}
                    </span>

                    {item.isEquipped ? (
                      <span className="text-[10px] font-cinematic font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded">
                        EQUIPPED
                      </span>
                    ) : item.isUnlocked ? (
                      <span className="text-[10px] font-cinematic font-bold text-parchment-dim bg-noir border border-steel/40 px-2 py-0.5 rounded">
                        IN LOCKER
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-cinematic font-bold text-amber-400 bg-noir border border-gold/30 px-2 py-0.5 rounded">
                        <Coins className="w-3 h-3" /> {itemCost} GOLD
                      </span>
                    )}
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className={`p-2.5 rounded border ${
                        item.isUnlocked
                          ? 'bg-noir border-gold/40 text-gold shadow-noir'
                          : 'bg-noir/50 border-steel/30 text-steel'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-cinematic font-bold text-parchment">
                        {item.name}
                      </h3>
                      <div className="text-[10px] text-parchment-dim typewriter-text mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {/* Passive Perk Card */}
                  <div className="mt-4 bg-noir/80 border border-gold/20 rounded p-2.5 text-xs typewriter-text space-y-1">
                    <div className="text-[10px] font-cinematic font-bold text-gold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> PASSIVE PERK:
                    </div>
                    <p className="text-parchment-dim leading-relaxed text-[11px]">
                      {item.perkDescription}
                    </p>

                    {item.attributeBonuses && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(item.attributeBonuses).map(([attr, bonus]) => (
                          <span
                            key={attr}
                            className="text-[9px] font-cinematic font-bold text-parchment bg-charcoal px-1.5 py-0.5 rounded border border-steel/40 uppercase"
                          >
                            +{bonus} {attr}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase / Equip Action Button */}
                <div className="pt-4 mt-4 border-t border-steel/20">
                  {!item.isUnlocked ? (
                    <AnimatedButton
                      onClick={() => handlePurchase(item.id)}
                      disabled={!canAfford}
                      loading={purchasingId === item.id}
                      loadingText="REQUISITIONING..."
                      variant="gold"
                      className="w-full min-h-[44px] text-xs font-cinematic font-bold tracking-wider uppercase flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 inline mr-1" />
                      <span>REQUISITION ({itemCost} GOLD)</span>
                    </AnimatedButton>
                  ) : (
                    <AnimatedButton
                      onClick={() => handleToggle(item.id)}
                      variant={item.isEquipped ? 'ghost' : 'gold'}
                      className={`w-full min-h-[44px] text-xs font-cinematic font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 ${
                        item.isEquipped
                          ? 'border border-steel/40 text-parchment hover:bg-charcoal'
                          : ''
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 inline mr-1" />
                      <span>{item.isEquipped ? 'UNEQUIP GEAR' : 'EQUIP TO LOADOUT'}</span>
                    </AnimatedButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
