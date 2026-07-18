/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats, LeaderboardEntry } from '../types';
import { Trophy, Award, Search, User, Compass, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { sound } from '../sound';

interface LeaderboardProps {
  stats: PlayerStats;
  onBack: () => void;
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'ViperSlick', score: 14500, distance: 3420, car: 'Formula Mach 1', date: '2026-07-10' },
  { name: 'NeonRider', score: 11200, distance: 2890, car: 'Apex Hyperion', date: '2026-07-12' },
  { name: 'SpeedSlayer', score: 9800, distance: 2210, car: 'Interdictor Police', date: '2026-07-15' },
  { name: 'RoadGlider', score: 7200, distance: 1640, car: 'Apex Muscle', date: '2026-07-11' },
  { name: 'DriftDemon', score: 5400, distance: 1250, car: 'Nebula Sports', date: '2026-07-16' },
  { name: 'TarmacTornado', score: 3800, distance: 910, car: 'Atlas SUV', date: '2026-07-14' },
];

export default function Leaderboard({ stats, onBack }: LeaderboardProps) {
  
  // Memoize or compute the merged leaderboard sorted by score
  const sortedEntries = React.useMemo(() => {
    // Merge user's actual stats as an entry
    const userCarName = stats.activeCar === 'sports' ? 'Nebula Sports' 
                      : stats.activeCar === 'suv' ? 'Atlas SUV'
                      : stats.activeCar === 'muscle' ? 'Apex Muscle'
                      : stats.activeCar === 'police' ? 'Interdictor Police'
                      : stats.activeCar === 'super' ? 'Apex Hyperion'
                      : 'Formula Mach 1';

    const userEntry: LeaderboardEntry = {
      name: 'You (Champion)',
      score: stats.highScore,
      distance: stats.bestDistance,
      car: userCarName,
      date: new Date().toISOString().split('T')[0],
      isUser: true,
    };

    // Filter out bots with duplicate names or merge
    const mergedList = [...DEFAULT_LEADERBOARD, userEntry];
    
    // Sort descending by score
    return mergedList.sort((a, b) => b.score - a.score);
  }, [stats.highScore, stats.bestDistance, stats.activeCar]);

  return (
    <div id="leaderboard_panel" className="relative w-full max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden p-6 text-white flex flex-col min-h-[500px]">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-sans flex items-center gap-2">
            <Trophy className="text-yellow-400" />
            WORLD LEADERBOARDS
          </h2>
          <p className="text-xs text-slate-400">Competing offline with elite speedway champions</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300">
          🏆 Personal Best: <strong className="text-yellow-400 ml-1 font-mono font-bold">{stats.highScore.toLocaleString()} pts</strong>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="flex-1 bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden flex flex-col">
        {/* Table Head */}
        <div className="grid grid-cols-12 gap-2 bg-slate-900/70 p-3 text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4 pl-2">Driver</div>
          <div className="col-span-3 text-right">Distance (m)</div>
          <div className="col-span-2 pl-4">Equipped Car</div>
          <div className="col-span-2 text-right pr-2">Score</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto max-h-[320px] custom-scrollbar">
          {sortedEntries.map((entry, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const isUser = entry.isUser;

            let rowBg = 'hover:bg-slate-900/20';
            if (isUser) {
              rowBg = 'bg-cyan-500/10 border-y border-cyan-500/20 hover:bg-cyan-500/15';
            }

            return (
              <div
                key={`${entry.name}-${idx}`}
                className={`grid grid-cols-12 gap-2 p-3 text-sm items-center border-b border-slate-900 transition-colors ${rowBg}`}
              >
                {/* Rank Medal */}
                <div className="col-span-1 flex justify-center">
                  {rank === 1 ? (
                    <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-md shadow-yellow-500/20">
                      1
                    </span>
                  ) : rank === 2 ? (
                    <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-md shadow-slate-400/20">
                      2
                    </span>
                  ) : rank === 3 ? (
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center text-xs shadow-md shadow-amber-700/20">
                      3
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono font-bold text-xs">{rank}</span>
                  )}
                </div>

                {/* Driver Name */}
                <div className="col-span-4 pl-2 flex items-center gap-2">
                  {isUser ? (
                    <div className="p-1 bg-cyan-500/20 rounded-md border border-cyan-500/30">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  ) : (
                    <div className="p-1 bg-slate-800 rounded-md border border-slate-700">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                  <span className={`font-semibold truncate ${isUser ? 'text-cyan-400' : 'text-slate-200'}`}>
                    {entry.name}
                  </span>
                </div>

                {/* Distance Driven */}
                <div className="col-span-3 text-right font-mono text-slate-400">
                  {entry.distance.toLocaleString()}m
                </div>

                {/* Equipped Car */}
                <div className="col-span-2 pl-4 text-xs text-slate-400 truncate font-semibold">
                  {entry.car}
                </div>

                {/* Score */}
                <div className="col-span-2 text-right pr-2 font-mono font-bold text-yellow-400">
                  {entry.score.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Warning Footer */}
      <div className="mt-4 bg-slate-950/20 rounded-lg p-3 text-[10px] text-slate-500 text-center leading-relaxed">
        Offline Leaderboards persist on-device. Connect to Google Play Services or Game Center (WebView APK export) for real-time cloud leaderboards and Android competitive matches.
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
