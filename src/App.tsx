/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { PlayerStats, GameSettings } from './types';
import { sound } from './sound';
import Garage from './components/Garage';
import Shop from './components/Shop';
import DailyReward from './components/DailyReward';
import Achievements, { ACHIEVEMENTS } from './components/Achievements';
import Leaderboard from './components/Leaderboard';
import SettingsModal from './components/SettingsModal';
import GameCanvas from './components/GameCanvas';
import NativeBannerAd from './components/NativeBannerAd';
import SocialBarAd from './components/SocialBarAd';
import AdsterraInterstitial from './components/AdsterraInterstitial';

import { 
  Play, ShoppingCart, ShieldAlert, BookOpen, Volume2, VolumeX, Award,
  Trophy, Gift, Sparkles, Settings, Home, ArrowLeft, ArrowRight, Video, RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STATS_KEY = 'highwayspeed_racer_stats_v1';
const SETTINGS_KEY = 'highwayspeed_racer_settings_v1';

const DEFAULT_STATS: PlayerStats = {
  coins: 1000, // Starts with friendly budget to buy first booster
  gems: 10,
  highScore: 0,
  bestDistance: 0,
  totalDistanceDriven: 0,
  totalCoinsCollected: 0,
  obstaclesAvoided: 0,
  unlockedCars: ['sports'],
  activeCar: 'sports',
  inventory: {
    nitro: 3,
    shield: 2,
    coinBooster: 1,
    magnet: 1,
  },
  unlockedSkins: [],
  lastDailyRewardClaimed: null,
  dailyRewardStreak: 0,
};

const DEFAULT_SETTINGS: GameSettings = {
  soundOn: true,
  musicOn: true,
  vibrationOn: true,
};

export default function App() {
  const [view, setView] = useState<'menu' | 'gameplay' | 'garage' | 'shop' | 'rewards' | 'achievements' | 'leaderboard' | 'levels'>('menu');
  const [selectedLevel, setSelectedLevel] = useState<'jungle' | 'mountain' | 'city' | 'desert' | 'rainy' | 'night' | 'all'>('all');
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  // Game over overlay values
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [runScore, setRunScore] = useState(0);
  const [runDistance, setRunDistance] = useState(0);

  // Interstitial fake ad modal
  const [showInterstitial, setShowInterstitial] = useState(false);

  // 1. Initial State Loading from LocalStorage on mount
  useEffect(() => {
    const rawStats = localStorage.getItem(STATS_KEY);
    const rawSettings = localStorage.getItem(SETTINGS_KEY);

    if (rawStats) {
      try {
        const parsed = JSON.parse(rawStats);
        setStats(parsed);
        sound.activeCarId = parsed.activeCar || 'sports';
      } catch (e) {
        setStats(DEFAULT_STATS);
      }
    } else {
      setStats(DEFAULT_STATS);
    }

    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings);
        setSettings(parsed);
        sound.updateMuteStates(parsed.soundOn, parsed.musicOn);
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
      sound.updateMuteStates(DEFAULT_SETTINGS.soundOn, DEFAULT_SETTINGS.musicOn);
    }
  }, []);

  // 2. State Saving
  const updateStats = (newStats: PlayerStats) => {
    // Audit achievements on each update
    const updatedWithAchievements = checkAchievementsOnTheFly(newStats);
    setStats(updatedWithAchievements);
    localStorage.setItem(STATS_KEY, JSON.stringify(updatedWithAchievements));
  };

  const updateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  // Helper to audit completed achievements on the fly
  const checkAchievementsOnTheFly = (currentStats: PlayerStats): PlayerStats => {
    const claimedAchievements = (currentStats as any).claimedAchievements || [];
    
    // Check which achievements are complete but not claimed, let's keep them complete
    return currentStats;
  };

  const handleResetData = () => {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    setStats(DEFAULT_STATS);
    setSettings(DEFAULT_SETTINGS);
    sound.updateMuteStates(DEFAULT_SETTINGS.soundOn, DEFAULT_SETTINGS.musicOn);
    setShowSettings(false);
    alert('All game data and progress have been hard-reset to default!');
  };

  // 3. Navigation actions
  const navigateTo = (targetView: typeof view) => {
    sound.playCoin();
    setView(targetView);
  };

  // Handle crash or game over from within canvas
  const handleRunFinish = (finalScore: number, finalDist: number) => {
    setRunScore(finalScore);
    setRunDistance(finalDist);
    setShowGameOverModal(true);

    // Trigger Adsterra Interstitial Ad on every single crash (Game Over) to maximize CPM earnings
    setTimeout(() => {
      setShowInterstitial(true);
    }, 800);
  };

  const handleCloseGameOver = () => {
    sound.playCoin();
    setShowGameOverModal(false);
    setView('menu');
  };

  const restartFromGameOver = () => {
    sound.playCoin();
    setShowGameOverModal(false);
    setView('gameplay');
  };

  // Claim Daily Rewards Alert Check
  const todayStr = new Date().toDateString();
  const dailyRewardClaimable = stats.lastDailyRewardClaimed !== todayStr;

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col font-sans select-none antialiased text-slate-100 overflow-x-hidden relative">
      
      {/* Absolute Ambient Background Lights */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-12 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Primary Navigation Top bar */}
      <header className="w-full bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl shadow-lg border border-cyan-400/20">
            <Trophy className="w-6 h-6 text-yellow-300 fill-yellow-300/10" />
          </div>
          <div>
            <h1 className="text-lg font-black font-sans tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              HIGHWAY RETRO RACER
            </h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest block">3D Perspective Drive</span>
          </div>
        </div>

        {/* Currency Widget */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl">
            <span className="text-yellow-400 font-mono font-bold text-sm">🪙 {stats.coins.toLocaleString()}</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-mono font-bold text-sm">💎 {stats.gems}</span>
          </div>

          {/* Quick Sound FX toggle on headbar */}
          <button 
            onClick={() => {
              const updated = { ...settings, soundOn: !settings.soundOn };
              updateSettings(updated);
              sound.updateMuteStates(updated.soundOn, updated.musicOn);
              sound.playCoin();
            }}
            className="p-2.5 bg-slate-800/80 border border-slate-700/60 hover:text-white rounded-xl active:scale-95 transition-all cursor-pointer"
          >
            {settings.soundOn ? <Volume2 className="w-4.5 h-4.5 text-cyan-400" /> : <VolumeX className="w-4.5 h-4.5 text-slate-400" />}
          </button>

          {/* Preferences Settings Modal trigger */}
          <button
            onClick={() => { sound.playCoin(); setShowSettings(true); }}
            className="p-2.5 bg-slate-800/80 border border-slate-700/60 hover:text-white rounded-xl active:scale-95 transition-all cursor-pointer"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Responsive Routing Content Frame */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col justify-center items-center z-10">
        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <>
              <SocialBarAd />
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
              >
              {/* Left Column: Visual branding car showcase */}
              <div className="md:col-span-7 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl flex flex-col justify-between min-h-[460px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div>
                  <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 animate-pulse">
                    <Sparkles className="w-4 h-4 text-yellow-400" /> V1.0 - HIGH PERFORMANCE
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black font-sans tracking-tight text-white leading-tight">
                    THE ULTIMATE <br />
                    <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-300 bg-clip-text text-transparent">ENDLESS DRIVER</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed max-w-md">
                    Take command of elite vector sports cars. Avoid road construction, trucks, and falling logs across six high-fidelity scrolling landscapes.
                  </p>
                </div>

                {/* Animated retro visual car rolling loop */}
                <div className="my-6 relative h-28 w-full bg-slate-950/60 border border-slate-800/60 rounded-2xl overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-x-0 bottom-4 h-1.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"></div>
                  {/* Neon lines passing */}
                  <div className="absolute inset-0 flex items-center justify-between opacity-20 pointer-events-none">
                    <div className="w-12 h-0.5 bg-cyan-500 animate-pulse"></div>
                    <div className="w-16 h-0.5 bg-purple-500 animate-pulse"></div>
                  </div>
                  
                  {/* Decorative scrolling car */}
                  <div className="text-center animate-bounce">
                    <span className="text-5xl">🏎️</span>
                    <div className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-2">Active: {stats.activeCar.toUpperCase()} SPEC</div>
                  </div>
                </div>

                {/* Main highscore indicator widget */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Top Score</span>
                    <span className="text-yellow-400 font-mono font-bold block text-lg mt-0.5">{stats.highScore.toLocaleString()}</span>
                  </div>
                  <div className="border-l border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Best Run Distance</span>
                    <span className="text-white font-mono font-semibold block text-lg mt-0.5">{stats.bestDistance.toLocaleString()}m</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Menu Options List */}
              <div className="md:col-span-5 flex flex-col gap-3">
                
                {/* 1. PLAY BUTTON */}
                <button
                  onClick={() => navigateTo('levels')}
                  className="w-full py-4.5 bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:brightness-105 text-slate-950 font-black text-lg rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-cyan-950/30 active:scale-95 transition-all border-b-4 border-cyan-600"
                >
                  <Play className="w-6 h-6 fill-slate-950" /> START HIGHWAY DRIVE
                </button>

                {/* 2. GARAGE BUTTON */}
                <button
                  onClick={() => navigateTo('garage')}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl border border-slate-800 flex items-center justify-between px-6 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏎️</span>
                    <span>VEHICLE GARAGE</span>
                  </div>
                  <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700/60">
                    {stats.unlockedCars.length} / 6 Owned
                  </span>
                </button>

                {/* 3. TUNING SHOP */}
                <button
                  onClick={() => navigateTo('shop')}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl border border-slate-800 flex items-center justify-between px-6 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-cyan-400" />
                    <span>TUNING POWERUP SHOP</span>
                  </div>
                  <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700/60">
                    Buy Boosters
                  </span>
                </button>

                {/* 4. DAILY REWARDS */}
                <button
                  onClick={() => navigateTo('rewards')}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl border border-slate-800 flex items-center justify-between px-6 cursor-pointer active:scale-[0.98] transition-all relative"
                >
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-yellow-400" />
                    <span>7-DAY LOGIN REWARDS</span>
                  </div>
                  {dailyRewardClaimable ? (
                    <span className="bg-rose-500 text-white text-[9px] font-extrabold uppercase px-2 py-1 rounded-full border border-rose-400 animate-pulse">
                      CLAIM READY
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-semibold uppercase">Claimed</span>
                  )}
                </button>

                {/* 5. ACHIEVEMENTS */}
                <button
                  onClick={() => navigateTo('achievements')}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl border border-slate-800 flex items-center justify-between px-6 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-purple-400" />
                    <span>RACING MILESTONES</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Trophies</span>
                </button>

                {/* 6. LEADERBOARDS */}
                <button
                  onClick={() => navigateTo('leaderboard')}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl border border-slate-800 flex items-center justify-between px-6 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>WORLD LEADERBOARDS</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Offline</span>
                </button>

              </div>
            </motion.div>
            </>
          )}

          {view === 'levels' && (
            <motion.div
              key="levels"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl"
            >
              {/* Header card */}
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <button
                    onClick={() => navigateTo('menu')}
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider mb-2 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Main Menu
                  </button>
                  <h2 className="text-2xl md:text-3xl font-black font-sans tracking-tight text-white uppercase">
                    Select Endless Highway
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Choose your favorite driving environment. Each highway features distinct weather, physics feel, and hazards!
                  </p>
                </div>
                <div className="text-[10px] bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 font-extrabold uppercase px-3 py-1.5 rounded-lg">
                  🎯 Endless Mode Enabled
                </div>
              </div>

              {/* Levels Grid layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Level 1: Cyber City */}
                <div 
                  onClick={() => {
                    sound.playCoin();
                    setSelectedLevel('city');
                    setView('gameplay');
                  }}
                  className="group relative bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[170px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-purple-500/15 transition-all"></div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl">🏙️</span>
                      <span className="text-[9px] bg-purple-950 text-purple-400 px-2 py-0.5 rounded font-bold uppercase border border-purple-800/50">CYBER CITY</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base group-hover:text-cyan-400 transition-colors">Neo-City Highway</h3>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed font-sans">
                      Slam into overdrive under colossal neon skyscrapers and metallic bridges.
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Hazard: Skyscrapers</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">DRIVE ▶</span>
                  </div>
                </div>

                {/* Level 2: Snowy Alpine */}
                <div 
                  onClick={() => {
                    sound.playCoin();
                    setSelectedLevel('mountain');
                    setView('gameplay');
                  }}
                  className="group relative bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[170px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-cyan-500/15 transition-all"></div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl">🏔️</span>
                      <span className="text-[9px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase border border-cyan-800/50 font-sans">ALPINE SNOW</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base group-hover:text-cyan-400 transition-colors">Alpine Ridge</h3>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed font-sans">
                      Drift across frozen slopes, pine forests, and heavy falling snow.
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Hazard: Slippery Roads</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">DRIVE ▶</span>
                  </div>
                </div>

                {/* Level 3: Desert Dunes */}
                <div 
                  onClick={() => {
                    sound.playCoin();
                    setSelectedLevel('desert');
                    setView('gameplay');
                  }}
                  className="group relative bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[170px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-amber-500/15 transition-all"></div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl">🌵</span>
                      <span className="text-[9px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-bold uppercase border border-amber-800/50 font-sans">DESERT</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base group-hover:text-cyan-400 transition-colors">Sahara Expressway</h3>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed font-sans">
                      Race past towering saguaro cacti and ancient red sandstone formations.
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Hazard: Sandy Drifts</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">DRIVE ▶</span>
                  </div>
                </div>

                {/* Level 4: Jungle Safari */}
                <div 
                  onClick={() => {
                    sound.playCoin();
                    setSelectedLevel('jungle');
                    setView('gameplay');
                  }}
                  className="group relative bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[170px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-emerald-500/15 transition-all"></div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl">🌴</span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase border border-emerald-800/50 font-sans">RAINFOREST</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base group-hover:text-cyan-400 transition-colors">Amazon Safari</h3>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed font-sans font-medium">
                      Speed along a leafy, high-canopy dirt highway with dense green flora.
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Hazard: Narrow Lanes</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">DRIVE ▶</span>
                  </div>
                </div>

                {/* Level 5: Monsoon Express */}
                <div 
                  onClick={() => {
                    sound.playCoin();
                    setSelectedLevel('rainy');
                    setView('gameplay');
                  }}
                  className="group relative bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[170px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-blue-500/15 transition-all"></div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl">🌧️</span>
                      <span className="text-[9px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded font-bold uppercase border border-blue-800/50 font-sans">MONSOON</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base group-hover:text-cyan-400 transition-colors">Rainy Monsoon</h3>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed font-sans font-medium">
                      Fight wet asphalt hydroplaning and intense rainstorms on this dark route.
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Hazard: Poor Visibility</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">DRIVE ▶</span>
                  </div>
                </div>

                {/* Level 6: Endless Mashup */}
                <div 
                  onClick={() => {
                    sound.playCoin();
                    setSelectedLevel('all');
                    setView('gameplay');
                  }}
                  className="group relative bg-gradient-to-br from-slate-900/50 via-slate-900/30 to-purple-950/20 hover:from-slate-900/70 hover:to-purple-900/30 border border-purple-800/60 hover:border-purple-400/80 rounded-2xl p-5 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[170px]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-tr from-cyan-500/10 to-purple-500/15 rounded-full blur-[35px] pointer-events-none"></div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl">⭐</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-extrabold uppercase border border-purple-500/50 animate-pulse font-sans">CHALLENGE</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base group-hover:text-purple-400 transition-colors font-sans">Infinite Horizon</h3>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed font-sans">
                      The ultimate dynamic speedway. Seamlessly shifts between all environments as you advance!
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] text-purple-400 font-extrabold uppercase tracking-wider flex items-center justify-between">
                    <span>Hazard: All Combined</span>
                    <span className="text-purple-400 group-hover:translate-x-1 transition-transform">DRIVE NOW ▶</span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {view === 'gameplay' && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl"
            >
              <GameCanvas
                stats={stats}
                settings={settings}
                selectedLevel={selectedLevel}
                onUpdateStats={updateStats}
                onGameOver={handleRunFinish}
                onBackToMenu={() => setView('menu')}
              />
            </motion.div>
          )}

          {view === 'garage' && (
            <motion.div
              key="garage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <Garage
                stats={stats}
                onUpdateStats={updateStats}
                onBack={() => setView('menu')}
              />
            </motion.div>
          )}

          {view === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <Shop
                stats={stats}
                onUpdateStats={updateStats}
                onBack={() => setView('menu')}
              />
            </motion.div>
          )}

          {view === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <DailyReward
                stats={stats}
                onUpdateStats={updateStats}
                onBack={() => setView('menu')}
              />
            </motion.div>
          )}

          {view === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <Achievements
                stats={stats}
                onUpdateStats={updateStats}
                onBack={() => setView('menu')}
              />
            </motion.div>
          )}

          {view === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <Leaderboard
                stats={stats}
                onBack={() => setView('menu')}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Display native banner ad in the Garage view as requested */}
        {view === 'garage' && <NativeBannerAd />}
      </main>

      {/* 4. Global Settings Options Modal Trigger Popup */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={updateSettings}
            onClose={() => setShowSettings(false)}
            onResetData={handleResetData}
          />
        )}
      </AnimatePresence>

      {/* 5. Game Over / Score Review Dialog Popup */}
      <AnimatePresence>
        {showGameOverModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center shadow-2xl text-white relative overflow-hidden"
            >
              {/* Retro top decoration stripe */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-yellow-400"></div>

              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 inline-block mb-3">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-3xl font-black font-sans tracking-wide">VEHICLE WRECKED!</h2>
              <p className="text-xs text-slate-400 mt-1">You crashed on the dynamic speedway</p>

              {/* Grid Statistics results */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center my-6">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Run Score</span>
                  <span className="text-yellow-400 font-mono font-bold block text-xl mt-0.5">{runScore.toLocaleString()}</span>
                </div>
                <div className="border-l border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Distance driven</span>
                  <span className="text-white font-mono font-semibold block text-xl mt-0.5">{runDistance.toLocaleString()}m</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={restartFromGameOver}
                  className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl active:scale-95 transition-all cursor-pointer shadow border border-cyan-300"
                >
                  DRIVE AGAIN
                </button>
                
                <button
                  onClick={handleCloseGameOver}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl active:scale-95 transition-all cursor-pointer text-xs"
                >
                  Return to Main Menu
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Adsterra Interstitial Ad Popup on Game Over Screen */}
      <AnimatePresence>
        {showInterstitial && (
          <AdsterraInterstitial onClose={() => setShowInterstitial(false)} />
        )}
      </AnimatePresence>

      {/* Primary Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 px-6 py-4 flex justify-between items-center text-xs text-slate-500 z-10">
        <div>
          © 2026 Endless Speedway Racer. All Rights Reserved.
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { sound.playCoin(); setShowSettings(true); }}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>|</span>
          <button 
            onClick={() => { sound.playCoin(); setShowSettings(true); }}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            About
          </button>
        </div>
      </footer>

    </div>
  );
}
