/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats, PowerUpConfig } from '../types';
import { ShoppingBag, Star, Zap, Shield, Sparkles, Magnet } from 'lucide-react';
import { motion } from 'motion/react';
import { sound } from '../sound';

interface ShopProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onBack: () => void;
}

export const POWERUPS: PowerUpConfig[] = [
  {
    id: 'nitro',
    name: 'Nitro Boost',
    price: 200,
    description: 'Instantly accelerate to extreme velocities. Makes you invincible to crashes and drains obstacle cars!',
    icon: 'zap',
    duration: 5,
  },
  {
    id: 'shield',
    name: 'Defensive Shield',
    price: 150,
    description: 'Creates a magnetic energy field around your car. Absorbs one crash collision completely!',
    icon: 'shield',
    duration: 10,
  },
  {
    id: 'coinBooster',
    name: 'Double Coin Booster',
    price: 250,
    description: 'Multiplies all collected coins by 2x for a short period of time. Build wealth fast!',
    icon: 'sparkles',
    duration: 15,
  },
  {
    id: 'magnet',
    name: 'Coin Magnet',
    price: 180,
    description: 'Generates a strong magnetic pull that sweeps all coins within a wide radius towards your car!',
    icon: 'magnet',
    duration: 12,
  },
];

export default function Shop({ stats, onUpdateStats, onBack }: ShopProps) {
  
  const handlePurchase = (id: string, price: number) => {
    if (stats.coins < price) return;

    sound.playShield(); // Purchase chime
    
    // Update inventory counter
    const currentInventory = { ...stats.inventory };
    if (id === 'nitro') currentInventory.nitro += 1;
    else if (id === 'shield') currentInventory.shield += 1;
    else if (id === 'coinBooster') currentInventory.coinBooster += 1;
    else if (id === 'magnet') currentInventory.magnet += 1;

    const newStats: PlayerStats = {
      ...stats,
      coins: stats.coins - price,
      inventory: currentInventory,
    };

    onUpdateStats(newStats);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'zap':
        return <Zap className="w-8 h-8 text-yellow-400" />;
      case 'shield':
        return <Shield className="w-8 h-8 text-cyan-400" />;
      case 'sparkles':
        return <Sparkles className="w-8 h-8 text-purple-400" />;
      case 'magnet':
        return <Magnet className="w-8 h-8 text-rose-400" />;
      default:
        return <ShoppingBag className="w-8 h-8 text-slate-400" />;
    }
  };

  return (
    <div id="shop_panel" className="relative w-full max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden p-6 text-white flex flex-col min-h-[500px]">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-sans flex items-center gap-2">
            <ShoppingBag className="text-cyan-400" />
            TUNING & POWERUP SHOP
          </h2>
          <p className="text-xs text-slate-400">Upgrade your dynamic boosters for endless races</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
          <span className="text-yellow-400 font-bold">🪙 {stats.coins.toLocaleString()}</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-bold">💎 {stats.gems}</span>
        </div>
      </div>

      {/* Grid of Powerups */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
        {POWERUPS.map((item) => {
          // Get current quantity in stock/inventory
          let quantity = 0;
          if (item.id === 'nitro') quantity = stats.inventory.nitro;
          else if (item.id === 'shield') quantity = stats.inventory.shield;
          else if (item.id === 'coinBooster') quantity = stats.inventory.coinBooster;
          else if (item.id === 'magnet') quantity = stats.inventory.magnet;

          const canAfford = stats.coins >= item.price;

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              className="bg-slate-950/60 rounded-xl border border-slate-800 p-5 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Card Accent Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    {renderIcon(item.icon)}
                  </div>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-semibold border border-slate-700">
                    Owned: <strong className="text-white ml-0.5">{quantity}</strong>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-wide">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[48px]">
                  {item.description}
                </p>
                
                <div className="mt-2.5 inline-block text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-900/40 px-2 py-0.5 rounded border border-slate-800/80">
                  Duration: {item.duration} seconds
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between">
                <span className="text-yellow-400 font-bold text-base">
                  🪙 {item.price}
                </span>
                <button
                  onClick={() => handlePurchase(item.id, item.price)}
                  disabled={!canAfford}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    canAfford
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer border border-cyan-300 shadow-md shadow-cyan-950/20 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  Purchase Booster
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bonus / Coin Skins Upgrade Information */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 mt-0.5">
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200">Need more Coins?</h4>
            <p className="text-xs text-slate-400">Complete Achievements, collect Daily Rewards, or look out for Gold Magnets on the highway!</p>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-semibold self-end sm:self-center">
          Pro Tip: Use the Double Coin Booster during high speed nitro bursts!
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
