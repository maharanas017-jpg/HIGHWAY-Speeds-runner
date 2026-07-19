import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Star, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import { sound } from '../sound';

interface InterstitialAdProps {
  onClose: () => void;
}

export default function AdsterraInterstitial({ onClose }: InterstitialAdProps) {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [countdown]);

  const handleAction = () => {
    sound.playCoin();
    // Simulate opening high-CPM Adsterra direct link
    window.open('https://pl30428819.effectivecpmnetwork.com/7b/2a/cd/7b2acd5ba3c85de99cc26d3288cd3149.js', '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleClose = () => {
    if (canClose) {
      sound.playCoin();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl text-white relative overflow-hidden"
      >
        {/* Neon accent bar at top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-yellow-400"></div>

        {/* Ambient light circles in ad modal */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none"></div>

        {/* Header bar with custom timer */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800/80 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">ADSTERRA PLATFORM</span>
          </div>
          
          <button
            onClick={handleClose}
            disabled={!canClose}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              canClose 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer' 
                : 'bg-slate-900/50 text-slate-500 cursor-not-allowed font-mono'
            }`}
          >
            {canClose ? (
              <span>✕ Skip</span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="animate-spin text-[10px]">⏳</span> Skip in {countdown}s
              </span>
            )}
          </button>
        </div>

        {/* Main Ad Banner Display */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-5 mb-5 relative overflow-hidden flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-purple-600/5 pointer-events-none"></div>
          
          {/* Ad Icon */}
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-2xl shadow-lg border border-cyan-400/20 flex items-center justify-center text-3xl mb-4 animate-bounce">
            🏎️
          </div>

          <h3 className="text-xl font-black font-sans tracking-tight text-white mb-1">
            Cyberpunk Highway Racing 3D
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mb-3">
            Published by Adsterra Premium Games Group
          </p>

          {/* Social Stars & Downloads indicator */}
          <div className="flex items-center gap-3 bg-slate-900/40 px-3.5 py-1.5 rounded-full border border-slate-800/40 mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400" />
              ))}
            </div>
            <span className="text-[10px] text-slate-300 font-bold font-mono">4.9/5 Rating</span>
            <span className="text-slate-600 text-xs">|</span>
            <span className="text-[10px] text-slate-300 font-bold font-mono">5M+ Drives</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-4">
            Unleash real drift physics, unlock crazy hypercars, and claim real coin rewards. Download now to claim your exclusive 10,000 Coin welcome pack!
          </p>

          {/* Security badge and stats */}
          <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-semibold mb-2 uppercase font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Google Safe Checked • No Suspicious Payloads
          </div>
        </div>

        {/* Interactive Action CTA triggers redirect to boost CPM */}
        <button
          onClick={handleAction}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black text-sm rounded-2xl active:scale-95 transition-all cursor-pointer shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 border border-cyan-300/30 uppercase tracking-wider"
        >
          <Play className="w-4 h-4 text-slate-950 fill-slate-950" />
          PLAY NOW / DOWNLOAD FREE
        </button>

        <span className="text-[9px] text-slate-500 block mt-4 font-mono tracking-wide">
          ⚡ Suppressing other ads for {countdown > 0 ? countdown : '0'}s to respect driving focus ⚡
        </span>
      </motion.div>
    </div>
  );
}
