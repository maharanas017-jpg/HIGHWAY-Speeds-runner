/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats } from '../types';
import { Gift, Check, Lock, Star, Sparkles, Calendar, Zap, Shield, Magnet } from 'lucide-react';
import { motion } from 'motion/react';
import { sound } from '../sound';

interface DailyRewardProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onBack: () => void;
}

interface RewardItem {
  day: number;
  label: string;
  coins: number;
  gems: number;
  items?: { nitro?: number; shield?: number; magnet?: number; coinBooster?: number };
  description: string;
}

const REWARDS_LIST: RewardItem[] = [
  { day: 1, label: 'Starter Package', coins: 150, gems: 0, description: '🪙 150 Coins' },
  { day: 2, label: 'Double Boost', coins: 300, gems: 0, description: '🪙 300 Coins' },
  { day: 3, label: 'Gems Spark', coins: 0, gems: 3, description: '💎 3 Gems' },
  { day: 4, label: 'Road Warrior', coins: 600, gems: 0, description: '🪙 600 Coins' },
  { day: 5, label: 'Shield & Magnet Pack', coins: 200, gems: 0, items: { shield: 1, magnet: 1 }, description: '🛡️ Shield + 🧲 Magnet' },
  { day: 6, label: 'Deep Gems Bundle', coins: 0, gems: 8, description: '💎 8 Gems' },
  { day: 7, label: 'Ultimate Highway Box', coins: 1500, gems: 15, items: { nitro: 2, shield: 1 }, description: '🪙 1.5k + 💎 15 + ⚡ Nitro' },
];

export default function DailyReward({ stats, onUpdateStats, onBack }: DailyRewardProps) {
  const [demoMode, setDemoMode] = React.useState(false);
  const todayStr = new Date().toDateString();

  // Determine which day is next to claim
  // streak is from 0 to 6 (representing Day 1 to Day 7)
  const lastClaimed = stats.lastDailyRewardClaimed;
  const canClaimToday = lastClaimed !== todayStr || demoMode;
  
  // Current active reward day index (0 to 6)
  const activeDayIndex = stats.dailyRewardStreak % 7;

  const handleClaim = () => {
    if (!canClaimToday) return;

    sound.playGem(); // Play high-quality sound

    const currentReward = REWARDS_LIST[activeDayIndex];
    
    // Add rewards to player stats
    const currentInventory = { ...stats.inventory };
    if (currentReward.items) {
      if (currentReward.items.nitro) currentInventory.nitro += currentReward.items.nitro;
      if (currentReward.items.shield) currentInventory.shield += currentReward.items.shield;
      if (currentReward.items.magnet) currentInventory.magnet += currentReward.items.magnet;
      if (currentReward.items.coinBooster) currentInventory.coinBooster += currentReward.items.coinBooster;
    }

    const newStats: PlayerStats = {
      ...stats,
      coins: stats.coins + currentReward.coins,
      gems: stats.gems + currentReward.gems,
      inventory: currentInventory,
      lastDailyRewardClaimed: todayStr,
      dailyRewardStreak: stats.dailyRewardStreak + 1,
    };

    onUpdateStats(newStats);
  };

  // Resets claims for testing
  const resetDailyForDemo = () => {
    sound.playCrash();
    const newStats: PlayerStats = {
      ...stats,
      lastDailyRewardClaimed: null,
      dailyRewardStreak: 0,
    };
    onUpdateStats(newStats);
  };

  return (
    <div id="daily_reward_panel" className="relative w-full max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden p-6 text-white flex flex-col min-h-[500px]">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-sans flex items-center gap-2">
            <Gift className="text-yellow-400" />
            7-DAY DAILY REWARDS
          </h2>
          <p className="text-xs text-slate-400">Log in every day to collect coins, gems, and elite booster inventory</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Demo Toggle */}
          <button 
            onClick={() => setDemoMode(!demoMode)}
            className={`px-3 py-1 rounded text-[10px] uppercase tracking-wide font-bold border transition-all cursor-pointer ${
              demoMode ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            Demo Mode: {demoMode ? 'ON (No Time Lock)' : 'OFF'}
          </button>
          <button 
            onClick={resetDailyForDemo}
            className="px-3 py-1 bg-rose-950/30 text-rose-400 border border-rose-800/50 hover:bg-rose-900/20 rounded text-[10px] uppercase font-bold tracking-wide active:scale-95 transition-all cursor-pointer"
          >
            Reset Streak
          </button>
        </div>
      </div>

      {/* Main Claim Container */}
      <div className="bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 relative animate-bounce">
            <Gift className="w-12 h-12 text-yellow-400" />
            <Sparkles className="absolute top-1 right-1 w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">Today's Reward (Day {activeDayIndex + 1})</span>
            <h3 className="text-xl font-bold font-sans mt-0.5">{REWARDS_LIST[activeDayIndex].label}</h3>
            <p className="text-xs text-slate-400 mt-1">{REWARDS_LIST[activeDayIndex].description}</p>
          </div>
        </div>

        <div>
          {canClaimToday ? (
            <button
              onClick={handleClaim}
              className="px-8 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-yellow-950/20 border border-yellow-300 active:scale-95 transition-all flex items-center gap-2 cursor-pointer text-base"
            >
              <Calendar className="w-5 h-5" /> CLAIM REWARD
            </button>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <span className="px-6 py-3 bg-slate-800 text-slate-500 border border-slate-700/60 font-bold rounded-xl text-sm flex items-center gap-2 select-none">
                <Check className="w-4 h-4 text-emerald-500" /> CLAIMED TODAY
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Next reward unlocks in tomorrow's login</span>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Calendar Grid */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
        {REWARDS_LIST.map((reward, idx) => {
          const isClaimed = idx < activeDayIndex;
          const isActive = idx === activeDayIndex;
          const isFuture = idx > activeDayIndex;

          let cardBg = 'bg-slate-950/40 border-slate-900';
          let textColor = 'text-slate-500';

          if (isActive) {
            cardBg = 'bg-slate-950/80 border-yellow-500/60 ring-1 ring-yellow-500/30';
            textColor = 'text-yellow-400';
          } else if (isClaimed) {
            cardBg = 'bg-slate-900/30 border-emerald-500/20';
            textColor = 'text-emerald-400';
          }

          return (
            <div
              key={reward.day}
              className={`p-4 rounded-xl border flex flex-col justify-between items-center text-center relative ${cardBg} transition-all duration-300`}
            >
              {/* Day Badge */}
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isActive ? 'text-yellow-400' : isClaimed ? 'text-emerald-500' : 'text-slate-500'}`}>
                Day {reward.day}
              </span>

              {/* Day Visual Core */}
              <div className="my-3">
                {isClaimed ? (
                  <div className="p-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <Check className="w-6 h-6 text-emerald-500" />
                  </div>
                ) : isActive ? (
                  <div className="p-2 bg-yellow-500/10 rounded-full border border-yellow-500/20 animate-pulse">
                    <Gift className="w-6 h-6 text-yellow-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-slate-900 rounded-full border border-slate-800">
                    <Lock className="w-6 h-6 text-slate-600" />
                  </div>
                )}
              </div>

              {/* Day Reward Value */}
              <div className="mt-2 flex flex-col items-center">
                <span className={`text-xs font-bold ${isActive ? 'text-white' : isClaimed ? 'text-slate-300 font-medium' : 'text-slate-600'}`}>
                  {reward.coins > 0 ? `🪙 ${reward.coins}` : reward.gems > 0 ? `💎 ${reward.gems}` : '🎁 Bundle'}
                </span>
                <span className="text-[8px] text-slate-500 mt-0.5 min-h-[12px] truncate w-full text-center">
                  {reward.items ? 'Boosters' : reward.day === 7 ? 'Legendary' : 'Coins/Gems'}
                </span>
              </div>

              {/* Glow accent for today */}
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-yellow-500 rounded-b-xl"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Return */}
      <div className="border-t border-slate-800 pt-4 mt-auto flex justify-end">
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white rounded-xl text-sm font-semibold active:scale-95 transition-all cursor-pointer"
        >
          Return to Menu
        </button>
      </div>

    </div>
  );
}
