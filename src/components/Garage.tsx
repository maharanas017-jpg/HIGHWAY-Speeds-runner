/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CarConfig, PlayerStats } from '../types';
import { Check, Lock, Star, ChevronLeft, ChevronRight, Zap, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { sound } from '../sound';

interface GarageProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onBack: () => void;
}

export const CARS: CarConfig[] = [
  {
    id: 'sports',
    name: 'Nebula Sports',
    price: 0,
    color: '#ff2a2a',
    secondaryColor: '#1a1a1a',
    speed: 6,
    handling: 7,
    drift: 6,
    description: 'High agility and responsive steering, excellent for tight jungle corners.',
  },
  {
    id: 'suv',
    name: 'Atlas SUV',
    price: 1500,
    color: '#faba13',
    secondaryColor: '#332200',
    speed: 5,
    handling: 6,
    drift: 4,
    description: 'Heavy robust body with superior shield integration. Able to smash road debris easily.',
  },
  {
    id: 'muscle',
    name: 'Apex Muscle',
    price: 3000,
    color: '#00cc66',
    secondaryColor: '#002211',
    speed: 7,
    handling: 5,
    drift: 9,
    description: 'Classic high-torque muscle beast. Exceptional drifts and raw top-end velocity.',
  },
  {
    id: 'police',
    name: 'Interdictor Police',
    price: 5000,
    color: '#0f172a',
    secondaryColor: '#ffffff',
    speed: 8,
    handling: 8,
    drift: 7,
    description: 'Pursuit-grade enforcer with dual flashing warning sirens. Speeds through city traffic.',
  },
  {
    id: 'super',
    name: 'Apex Hyperion',
    price: 8000,
    color: '#06b6d4',
    secondaryColor: '#1e1b4b',
    speed: 9,
    handling: 9,
    drift: 8,
    description: 'Advanced hypercar built with aerodynamic carbon composites. Blazing fast acceleration.',
  },
  {
    id: 'formula',
    name: 'Formula Mach 1',
    price: 12000,
    color: '#c084fc',
    secondaryColor: '#1e013a',
    speed: 10,
    handling: 10,
    drift: 9,
    description: 'The ultimate downforce machine. Perfect high-speed precision handling and zero-latency drift control.',
  },
];

export default function Garage({ stats, onUpdateStats, onBack }: GarageProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const activeCar = CARS[currentIndex];

  const handleNext = () => {
    sound.playCoin();
    setCurrentIndex((prev) => (prev + 1) % CARS.length);
  };

  const handlePrev = () => {
    sound.playCoin();
    setCurrentIndex((prev) => (prev - 1 + CARS.length) % CARS.length);
  };

  const isUnlocked = stats.unlockedCars.includes(activeCar.id);
  const isEquipped = stats.activeCar === activeCar.id;
  const canAfford = stats.coins >= activeCar.price;

  const handleUnlock = () => {
    if (isUnlocked || !canAfford) return;
    
    sound.playShield(); // Unlock chime
    const updatedUnlocked = [...stats.unlockedCars, activeCar.id];
    const newStats: PlayerStats = {
      ...stats,
      coins: stats.coins - activeCar.price,
      unlockedCars: updatedUnlocked,
      activeCar: activeCar.id,
    };
    
    // Track achievements
    let totalUnlocked = updatedUnlocked.length;
    // Check if unlock 5 cars achievement triggered
    
    onUpdateStats(newStats);
  };

  const handleEquip = () => {
    sound.playCoin();
    const newStats: PlayerStats = {
      ...stats,
      activeCar: activeCar.id,
    };
    sound.activeCarId = activeCar.id;
    onUpdateStats(newStats);
  };

  // Styled vector previews representing our awesome cars
  const renderCarVector = (id: string, color: string, secColor: string) => {
    switch (id) {
      case 'formula':
        return (
          <div className="relative w-64 h-32 flex items-center justify-center">
            {/* Rear wing */}
            <div className="absolute top-2 left-6 w-8 h-12 bg-gray-800 rounded-sm border-r-4 border-purple-500"></div>
            {/* Front wing */}
            <div className="absolute bottom-2 right-4 w-12 h-4 bg-gray-800 rounded-sm"></div>
            {/* Main body */}
            <div className="absolute w-44 h-8 rounded-full shadow-lg" style={{ backgroundColor: color }}></div>
            {/* Cockpit */}
            <div className="absolute top-1/2 left-24 w-14 h-6 bg-black rounded-t-xl -translate-y-1/2 flex items-center justify-center border-t border-purple-300">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div> {/* Helmet */}
            </div>
            {/* Left wheels */}
            <div className="absolute top-0 left-10 w-10 h-6 bg-zinc-900 rounded-md border-b-2 border-zinc-700"></div>
            <div className="absolute top-0 right-8 w-8 h-5 bg-zinc-900 rounded-md border-b-2 border-zinc-700"></div>
            {/* Right wheels */}
            <div className="absolute bottom-0 left-10 w-10 h-6 bg-zinc-900 rounded-md border-t-2 border-zinc-700"></div>
            <div className="absolute bottom-0 right-8 w-8 h-5 bg-zinc-900 rounded-md border-t-2 border-zinc-700"></div>
          </div>
        );
      case 'police':
        return (
          <div className="relative w-64 h-32 flex items-center justify-center">
            {/* Wheels */}
            <div className="absolute top-2 left-10 w-10 h-6 bg-zinc-900 rounded-md shadow-inner"></div>
            <div className="absolute top-2 right-10 w-10 h-6 bg-zinc-900 rounded-md shadow-inner"></div>
            <div className="absolute bottom-2 left-10 w-10 h-6 bg-zinc-900 rounded-md shadow-inner"></div>
            <div className="absolute bottom-2 right-10 w-10 h-6 bg-zinc-900 rounded-md shadow-inner"></div>
            {/* Shadows */}
            <div className="absolute -bottom-1 w-52 h-6 bg-black/30 blur-md rounded-full"></div>
            {/* Car body */}
            <div className="absolute w-48 h-18 rounded-xl shadow-lg border border-slate-700 flex flex-col justify-between overflow-hidden" style={{ backgroundColor: color }}>
              <div className="h-1/2 w-full bg-white"></div> {/* White doors / top stripe */}
              <div className="h-1/2 w-full" style={{ backgroundColor: color }}></div>
            </div>
            {/* Roof & Siren */}
            <div className="absolute top-1/2 left-1/2 w-20 h-10 bg-slate-900/90 rounded-md -translate-x-1/2 -translate-y-1/2 border border-slate-400 flex items-center justify-center">
              {/* Siren Lights */}
              <div className="flex gap-2">
                <div className="w-3 h-2 bg-blue-600 rounded-full animate-ping"></div>
                <div className="w-3 h-2 bg-red-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            {/* Headlights */}
            <div className="absolute right-4 top-6 w-3 h-3 bg-yellow-200 rounded-full shadow-lg opacity-80"></div>
            <div className="absolute right-4 bottom-6 w-3 h-3 bg-yellow-200 rounded-full shadow-lg opacity-80"></div>
          </div>
        );
      case 'suv':
        return (
          <div className="relative w-64 h-32 flex items-center justify-center">
            {/* Wheels */}
            <div className="absolute top-1 left-8 w-12 h-7 bg-zinc-900 rounded-md"></div>
            <div className="absolute top-1 right-8 w-12 h-7 bg-zinc-900 rounded-md"></div>
            <div className="absolute bottom-1 left-8 w-12 h-7 bg-zinc-900 rounded-md"></div>
            <div className="absolute bottom-1 right-8 w-12 h-7 bg-zinc-900 rounded-md"></div>
            {/* Shadow */}
            <div className="absolute -bottom-2 w-56 h-8 bg-black/40 blur-md rounded-full"></div>
            {/* SUV body */}
            <div className="absolute w-48 h-22 rounded-lg shadow-lg flex items-center justify-center border-t-4 border-amber-300" style={{ backgroundColor: color }}>
              {/* Roofrack */}
              <div className="absolute top-2 w-24 h-2 bg-zinc-800 rounded-full"></div>
              <div className="text-[10px] text-amber-950 font-bold opacity-75">4x4 TRUCK</div>
            </div>
            {/* Cabin */}
            <div className="absolute top-1/2 left-20 w-18 h-12 bg-zinc-900/95 rounded-lg -translate-y-1/2 border border-amber-400"></div>
          </div>
        );
      case 'super':
        return (
          <div className="relative w-64 h-32 flex items-center justify-center">
            {/* Wheels */}
            <div className="absolute top-3 left-10 w-10 h-5 bg-zinc-900 rounded-md"></div>
            <div className="absolute top-3 right-10 w-10 h-5 bg-zinc-900 rounded-md"></div>
            <div className="absolute bottom-3 left-10 w-10 h-5 bg-zinc-900 rounded-md"></div>
            <div className="absolute bottom-3 right-10 w-10 h-5 bg-zinc-900 rounded-md"></div>
            {/* Shadow */}
            <div className="absolute -bottom-1 w-52 h-4 bg-black/35 blur-md rounded-full"></div>
            {/* Spoiler */}
            <div className="absolute top-1/2 -left-4 w-6 h-18 bg-zinc-800 rounded-sm -translate-y-1/2 border-l-4 border-cyan-400"></div>
            {/* Car body */}
            <div className="absolute w-48 h-14 rounded-r-3xl rounded-l-md shadow-lg border-b border-r border-cyan-300/40" style={{ backgroundColor: color }}></div>
            {/* Super Glass */}
            <div className="absolute top-1/2 left-18 w-20 h-8 bg-zinc-900/90 rounded-r-xl rounded-l-md -translate-y-1/2 border border-cyan-400 flex items-center justify-end pr-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
            </div>
          </div>
        );
      case 'muscle':
        return (
          <div className="relative w-64 h-32 flex items-center justify-center">
            {/* Wheels */}
            <div className="absolute top-2 left-10 w-11 h-6 bg-zinc-900 rounded-md"></div>
            <div className="absolute top-2 right-10 w-11 h-6 bg-zinc-900 rounded-md"></div>
            <div className="absolute bottom-2 left-10 w-11 h-6 bg-zinc-900 rounded-md"></div>
            <div className="absolute bottom-2 right-10 w-11 h-6 bg-zinc-900 rounded-md"></div>
            {/* Shadow */}
            <div className="absolute -bottom-1 w-52 h-5 bg-black/30 blur-md rounded-full"></div>
            {/* Muscle body */}
            <div className="absolute w-48 h-17 rounded-md shadow-lg flex flex-col justify-center gap-1 overflow-hidden" style={{ backgroundColor: color }}>
              {/* Racing Stripes */}
              <div className="h-2 w-full bg-white opacity-90"></div>
              <div className="h-1 w-full bg-transparent"></div>
              <div className="h-2 w-full bg-white opacity-90"></div>
            </div>
            {/* Cabin */}
            <div className="absolute top-1/2 left-22 w-16 h-11 bg-zinc-900/95 rounded-md -translate-y-1/2 border border-emerald-400"></div>
          </div>
        );
      default: // sports
        return (
          <div className="relative w-64 h-32 flex items-center justify-center">
            {/* Wheels */}
            <div className="absolute top-2 left-10 w-10 h-6 bg-zinc-900 rounded-md"></div>
            <div className="absolute top-2 right-10 w-10 h-6 bg-zinc-900 rounded-md"></div>
            <div className="absolute bottom-2 left-10 w-10 h-6 bg-zinc-900 rounded-md"></div>
            <div className="absolute bottom-2 right-10 w-10 h-6 bg-zinc-900 rounded-md"></div>
            {/* Shadow */}
            <div className="absolute -bottom-1 w-50 h-5 bg-black/30 blur-md rounded-full"></div>
            {/* Body */}
            <div className="absolute w-46 h-16 rounded-2xl shadow-lg border-b border-red-500" style={{ backgroundColor: color }}></div>
            {/* Cabin */}
            <div className="absolute top-1/2 left-16 w-16 h-10 bg-zinc-900/90 rounded-xl -translate-y-1/2 border border-red-400"></div>
          </div>
        );
    }
  };

  return (
    <div id="garage_panel" className="relative w-full max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden p-6 text-white flex flex-col min-h-[500px]">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-sans flex items-center gap-2">
            <Sparkles className="text-yellow-400" />
            VIRTUAL GARAGE
          </h2>
          <p className="text-xs text-slate-400">Equip and upgrade your dream cars</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
          <span className="text-yellow-400 font-bold">🪙 {stats.coins.toLocaleString()}</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-bold">💎 {stats.gems}</span>
        </div>
      </div>

      {/* Main Car Display Slider */}
      <div className="flex-1 flex flex-col md:flex-row items-center gap-8 justify-center my-4">
        
        {/* Left Arrow */}
        <button 
          onClick={handlePrev}
          className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 text-slate-300" />
        </button>

        {/* Center Card */}
        <div className="flex-1 max-w-md bg-slate-950/80 rounded-2xl border border-slate-800 p-6 flex flex-col items-center relative min-h-[350px] justify-between">
          
          {/* Tag Overlay */}
          <div className="absolute top-4 left-4">
            {isEquipped ? (
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/30">
                Active Vehicle
              </span>
            ) : isUnlocked ? (
              <span className="bg-blue-500/20 text-blue-400 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-blue-500/30">
                Unlocked
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-400 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>

          {/* Car Graphic Display */}
          <div className="my-6 py-6 flex items-center justify-center w-full bg-slate-900/50 rounded-xl min-h-[140px] border border-slate-800/80">
            <motion.div
              key={activeCar.id}
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="flex justify-center"
            >
              {renderCarVector(activeCar.id, activeCar.color, activeCar.secondaryColor)}
            </motion.div>
          </div>

          {/* Name & Details */}
          <div className="text-center w-full">
            <h3 className="text-xl font-bold tracking-wide font-sans">{activeCar.name}</h3>
            <p className="text-xs text-slate-400 mt-1.5 px-4 min-h-[40px] leading-relaxed">
              {activeCar.description}
            </p>
          </div>

          {/* Action Trigger Button */}
          <div className="w-full mt-6">
            {isEquipped ? (
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 transition-all border border-emerald-500">
                <Check className="w-5 h-5" /> EQUIPPED
              </button>
            ) : isUnlocked ? (
              <button 
                onClick={handleEquip}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-slate-600 active:scale-95 transition-all shadow-md"
              >
                SELECT VEHICLE
              </button>
            ) : (
              <button
                onClick={handleUnlock}
                disabled={!canAfford}
                className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${
                  canAfford 
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 cursor-pointer shadow-yellow-900/20 border border-yellow-400' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <Lock className="w-4 h-4" /> UNLOCK FOR 🪙 {activeCar.price.toLocaleString()}
              </button>
            )}
          </div>

        </div>

        {/* Right Arrow */}
        <button 
          onClick={handleNext}
          className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 text-slate-300" />
        </button>

        {/* Vehicle Performance Specifications */}
        <div className="w-full md:w-80 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1">
            <Zap className="w-4 h-4 text-cyan-400" /> Engine Specs
          </h4>
          
          {/* Speed Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>TOP SPEED</span>
              <span className="font-bold text-red-400">{activeCar.speed}/10</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${activeCar.speed * 10}%` }}></div>
            </div>
          </div>

          {/* Handling Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>HANDLING AGILITY</span>
              <span className="font-bold text-cyan-400">{activeCar.handling}/10</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${activeCar.handling * 10}%` }}></div>
            </div>
          </div>

          {/* Drift Control Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>DRIFT ANGLE</span>
              <span className="font-bold text-purple-400">{activeCar.drift}/10</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${activeCar.drift * 10}%` }}></div>
            </div>
          </div>

          {/* Special Ability Banner */}
          <div className="mt-2 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 leading-relaxed flex gap-2">
            <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <span className="font-bold block text-white mb-0.5">Special Attribute:</span>
              {activeCar.id === 'sports' && 'Standard balance, stable aerodynamics.'}
              {activeCar.id === 'suv' && 'Heavy Weight: Resists crashes with obstacles 15% better and is wider.'}
              {activeCar.id === 'muscle' && 'High Torque: Rapid recover from deceleration and larger nitro bursts.'}
              {activeCar.id === 'police' && 'Emergency Siren: Activates sirens that slightly pushes adjacent civilian traffic away.'}
              {activeCar.id === 'super' && 'Supercharged: Multiplies nitro speed and coin collector radius.'}
              {activeCar.id === 'formula' && 'Aerodynamic Downforce: Instant steering turns and higher passive coin magnet range.'}
            </div>
          </div>
        </div>

      </div>

      {/* Back Button */}
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
