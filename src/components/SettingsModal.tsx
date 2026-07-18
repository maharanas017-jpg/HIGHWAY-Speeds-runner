/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSettings } from '../types';
import { Volume2, VolumeX, ShieldAlert, BookOpen, RotateCcw, X, Check, Heart, ShieldAlert as PrivacyIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { sound } from '../sound';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
  onResetData: () => void;
}

export default function SettingsModal({ settings, onUpdateSettings, onClose, onResetData }: SettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState<'audio' | 'privacy' | 'about'>('audio');

  const toggleSound = () => {
    const updated = { ...settings, soundOn: !settings.soundOn };
    onUpdateSettings(updated);
    sound.updateMuteStates(updated.soundOn, updated.musicOn);
    sound.playCoin();
  };

  const toggleMusic = () => {
    const updated = { ...settings, musicOn: !settings.musicOn };
    onUpdateSettings(updated);
    sound.updateMuteStates(updated.soundOn, updated.musicOn);
    // Sound manager handles starting/stopping when musicOn changes
  };

  const toggleVibration = () => {
    const updated = { ...settings, vibrationOn: !settings.vibrationOn };
    onUpdateSettings(updated);
    sound.playCoin();
    if (updated.vibrationOn && navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white min-h-[420px]"
      >
        
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-slate-800 p-4 bg-slate-950/40">
          <h3 className="text-lg font-bold font-sans flex items-center gap-2">
            ⚙️ GAME PREFERENCES
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex bg-slate-950/80 border-b border-slate-800 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => { sound.playCoin(); setActiveTab('audio'); }}
            className={`flex-1 py-3 text-center transition-all cursor-pointer border-b-2 ${
              activeTab === 'audio' ? 'border-cyan-500 text-cyan-400 bg-slate-900/60' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Audio & Haptics
          </button>
          <button
            onClick={() => { sound.playCoin(); setActiveTab('privacy'); }}
            className={`flex-1 py-3 text-center transition-all cursor-pointer border-b-2 ${
              activeTab === 'privacy' ? 'border-cyan-500 text-cyan-400 bg-slate-900/60' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => { sound.playCoin(); setActiveTab('about'); }}
            className={`flex-1 py-3 text-center transition-all cursor-pointer border-b-2 ${
              activeTab === 'about' ? 'border-cyan-500 text-cyan-400 bg-slate-900/60' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            About Game
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[280px]">
          {activeTab === 'audio' && (
            <div className="flex flex-col gap-5">
              
              {/* Sound FX Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div>
                  <span className="font-bold block text-sm">SOUND EFFECTS</span>
                  <span className="text-[10px] text-slate-400">Crash, dings, engine rumble, sirens, and boosters</span>
                </div>
                <button
                  onClick={toggleSound}
                  className={`w-14 h-8 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${
                    settings.soundOn ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-950 shadow-md transition-transform duration-300 transform ${
                    settings.soundOn ? 'translate-x-6' : 'translate-x-0'
                  }`}>
                    {settings.soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </div>
                </button>
              </div>

              {/* Music Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div>
                  <span className="font-bold block text-sm">SYNTHWAVE MUSIC</span>
                  <span className="text-[10px] text-slate-400">Continuous procedurally synthesized background loops</span>
                </div>
                <button
                  onClick={toggleMusic}
                  className={`w-14 h-8 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${
                    settings.musicOn ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-950 shadow-md transition-transform duration-300 transform ${
                    settings.musicOn ? 'translate-x-6' : 'translate-x-0'
                  }`}>
                    {settings.musicOn ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                </button>
              </div>

              {/* Vibration Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div>
                  <span className="font-bold block text-sm">SIMULATED VIBRATIONS</span>
                  <span className="text-[10px] text-slate-400">Rumble feedback on crash (Mobile WebView devices)</span>
                </div>
                <button
                  onClick={toggleVibration}
                  className={`w-14 h-8 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${
                    settings.vibrationOn ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-950 shadow-md transition-transform duration-300 transform ${
                    settings.vibrationOn ? 'translate-x-6' : 'translate-x-0'
                  }`}>
                    {settings.vibrationOn ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                </button>
              </div>

              {/* Reset Data Button */}
              <div className="border-t border-slate-800/60 pt-4 mt-2 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Danger Zone</span>
                <button
                  onClick={() => {
                    if (confirm('Are you absolutely sure you want to hard reset all game statistics, coins, and unlocked cars? This cannot be undone.')) {
                      onResetData();
                    }
                  }}
                  className="px-4 py-2 bg-rose-950/20 text-rose-400 border border-rose-900/50 hover:bg-rose-900/20 rounded-xl text-xs font-bold tracking-wide active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Hard Reset Profile
                </button>
              </div>

            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="text-xs text-slate-300 flex flex-col gap-3 leading-relaxed">
              <h4 className="font-bold text-white uppercase text-xs flex items-center gap-1 text-cyan-400">
                <PrivacyIcon className="w-4 h-4" /> USER DATA PRIVACY DISCLOSURE
              </h4>
              <p>
                We value your absolute data privacy. This application is an offline, client-side HTML5 game. It utilizes local sandbox storage mechanisms (<code className="font-mono bg-slate-950/80 px-1 py-0.5 rounded text-[10px] text-cyan-300">localStorage</code>) to save high scores, collected currencies, unlocked vehicles, and daily reward streaks directly on your own device.
              </p>
              <p>
                This game does not host remote databases, register user profiles, track geolocation coordinates, access device contacts, read from physical files, or transmit any sensitive telemetry data over external networks.
              </p>
              <p>
                <strong>Mock Advertising Placement:</strong> Mock integration placeholders representing Adsterra banner placements and rewarded loops are visual simulations only and conform to Google Play and Apple Store privacy specifications.
              </p>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="text-xs text-slate-300 flex flex-col gap-3 leading-relaxed">
              <h4 className="font-bold text-white uppercase text-xs text-cyan-400">
                🏎️ ENDLESS SPEEDWAY RACER v1.0.0
              </h4>
              <p>
                A high-octane 2.5D retro perspective pseudo-3D racer built entirely with React, Tailwind, and native HTML5 2D Canvas! Features include procedural Web Audio API synthesizers, smooth speed accelerations, physical vector-driven environments, custom collision math, dynamic rainy/night headlights, and persistent profile garage engines.
              </p>
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center gap-3">
                <Heart className="w-5 h-5 text-red-500 fill-red-500 flex-shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold text-white block">Crafted in Web Container</span>
                  <span className="text-[10px] text-slate-500 block">Optimized for full-speed Android WebViews, PC desktop browsers, and modern iOS Chrome layers.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold rounded-xl text-sm shadow-md active:scale-95 transition-all cursor-pointer border border-cyan-400"
          >
            CONFIRM OPTIONS
          </button>
        </div>

      </motion.div>
    </div>
  );
}
