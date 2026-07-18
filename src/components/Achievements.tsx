/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats, AchievementConfig, AchievementProgress } from '../types';
import { Trophy, Check, Compass, Star, ShoppingBag, Shield, Route } from 'lucide-react';
import { motion } from 'motion/react';
import { sound } from '../sound';

interface AchievementsProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onBack: () => void;
}

export const ACHIEVEMENTS: AchievementConfig[] = [
  {
    id: 'dist_1km',
    title: 'Highway Cruiser',
    description: 'Drive a total of 1 km (1,000 meters) cumulative distance.',
    target: 1000,
    type: 'distance',
    reward: 250,
  },
  {
    id: 'coins_500',
    title: 'Gold Harvester',
    description: 'Collect a total of 500 golden coins during your drives.',
    target: 500,
    type: 'coins',
    reward: 350,
  },
  {
    id: 'avoid_100',
    title: 'Apex Dodge Master',
    description: 'Successfully bypass 100 obstacle barriers or traffic vehicles.',
    target: 100000, // Wait, let's keep it reasonable or adjust to make it fun. Let's say target is 100 obstacles bypassed!
    type: 'obstacles',
    reward: 300,
  },
  {
    id: 'cars_5',
    title: 'Fleet Commander',
    description: 'Unlock 5 unique high-performance vehicles in your garage.',
    target: 5,
    type: 'cars_unlocked',
    reward: 600,
  },
  {
    id: 'score_10k',
    title: 'Grand Master Racer',
    description: 'Reach a peak high score of 10,000 points on a single run.',
    target: 10000,
    type: 'score',
    reward: 500,
  },
];

// Re-write the avoid_100 target to actually match user request: "Avoid 100 obstacles"
ACHIEVEMENTS[2].target = 100;

export default function Achievements({ stats, onUpdateStats, onBack }: AchievementsProps) {
  
  // Helper to calculate current value based on stats
  const getCurrentValue = (type: string): number => {
    switch (type) {
      case 'distance':
        return Math.floor(stats.totalDistanceDriven);
      case 'coins':
        return stats.totalCoinsCollected;
      case 'obstacles':
        return stats.obstaclesAvoided;
      case 'cars_unlocked':
        return stats.unlockedCars.length;
      case 'score':
        return stats.highScore;
      default:
        return 0;
    }
  };

  const handleClaimReward = (id: string, reward: number) => {
    sound.playGem(); // Claim chime
    
    // Add coins and mark as claimed
    const newUnlockedSkins = [...(stats.unlockedSkins || [])];
    
    // If we've completed and want to persist
    const currentClaimedList = (stats as any).claimedAchievements || [];
    const newClaimedList = [...currentClaimedList, id];

    const newStats: PlayerStats = {
      ...stats,
      coins: stats.coins + reward,
      // Store in customized sub-structure dynamically since our standard interface allows expansion
      ...({ claimedAchievements: newClaimedList } as any)
    };

    onUpdateStats(newStats);
  };

  const isClaimed = (id: string): boolean => {
    const list = (stats as any).claimedAchievements || [];
    return list.includes(id);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'distance':
        return <Route className="w-6 h-6 text-cyan-400" />;
      case 'coins':
        return <Star className="w-6 h-6 text-yellow-400" />;
      case 'obstacles':
        return <Shield className="w-6 h-6 text-rose-400" />;
      case 'cars_unlocked':
        return <ShoppingBag className="w-6 h-6 text-purple-400" />;
      case 'score':
        return <Trophy className="w-6 h-6 text-amber-400" />;
      default:
        return <Trophy className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div id="achievements_panel" className="relative w-full max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden p-6 text-white flex flex-col min-h-[500px]">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-sans flex items-center gap-2">
            <Trophy className="text-yellow-400" />
            RACING ACHIEVEMENTS
          </h2>
          <p className="text-xs text-slate-400">Achieve legendary status on the asphalt and claim free coin bundles</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
          <span className="text-yellow-400 font-bold">🪙 {stats.coins.toLocaleString()}</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-bold">💎 {stats.gems}</span>
        </div>
      </div>

      {/* Achievements List */}
      <div className="flex-1 flex flex-col gap-4 my-2 pr-1 max-h-[420px] overflow-y-auto custom-scrollbar">
        {ACHIEVEMENTS.map((ach) => {
          const current = getCurrentValue(ach.type);
          const percent = Math.min(100, Math.floor((current / ach.target) * 100));
          const completed = current >= ach.target;
          const claimed = isClaimed(ach.id);

          return (
            <div
              key={ach.id}
              className={`p-4 bg-slate-950/55 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                completed ? 'border-emerald-500/20' : 'border-slate-800/80'
              }`}
            >
              {/* Left Column (Icon + Metadata) */}
              <div className="flex items-start gap-4 flex-1 w-full">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 mt-0.5">
                  {renderIcon(ach.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {ach.title}
                    {completed && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3 h-3" /> Complete
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
                  
                  {/* Progress Meter */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 min-w-[50px] text-right">
                      {current.toLocaleString()} / {ach.target.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column (Claim Button / Indicator) */}
              <div className="sm:pl-4 sm:border-l sm:border-slate-800/80 min-w-[120px] w-full sm:w-auto flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2">
                <div className="text-center sm:text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Reward</span>
                  <span className="text-yellow-400 font-mono font-bold">🪙 {ach.reward}</span>
                </div>

                {claimed ? (
                  <span className="px-3 py-1.5 bg-slate-900/60 text-slate-500 text-xs font-bold rounded-lg border border-slate-800 flex items-center gap-1 select-none">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> CLAIMED
                  </span>
                ) : completed ? (
                  <button
                    onClick={() => handleClaimReward(ach.id, ach.reward)}
                    className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer border border-yellow-300 shadow active:scale-95 transition-all animate-pulse"
                  >
                    CLAIM REWARD
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-slate-900/20 text-slate-600 text-xs font-semibold rounded-lg border border-slate-800/40 select-none">
                    IN PROGRESS
                  </span>
                )}
              </div>

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
