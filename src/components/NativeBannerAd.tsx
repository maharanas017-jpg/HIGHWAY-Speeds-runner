import { useEffect, useRef, useState } from 'react';

export default function NativeBannerAd() {
  const adLoadedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    if (adLoadedRef.current) return;
    adLoadedRef.current = true;

    // Dynamically insert the script tag to safely load the Native Banner Ad
    const script = document.createElement('script');
    script.src = 'https://pl30428820.effectivecpmnetwork.com/4d1e66fb44a6974f669030ed9b37fd75/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    script.onload = () => {
      setStatus('loaded');
    };

    script.onerror = (e) => {
      console.warn('Native banner ad script failed to load. Ad-blocker may be active.', e);
      setStatus('error');
    };

    document.body.appendChild(script);

    return () => {
      // Clean up script reference safely if needed
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
      {/* Visual background ambient accent */}
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-cyan-500/5 rounded-full blur-[30px] pointer-events-none"></div>
      <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/5 rounded-full blur-[30px] pointer-events-none"></div>

      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mb-3 block font-mono">
        ⚡ SPONSORED NATIVE BANNER ⚡
      </span>
      
      {/* Targeted ad container element */}
      <div 
        id="container-4d1e66fb44a6974f669030ed9b37fd75" 
        className="min-h-[120px] w-full flex items-center justify-center text-center text-xs text-slate-400 font-mono"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xl animate-bounce">🚗</span>
            <span>Loading advertisement...</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-1.5 p-3 text-slate-500">
            <span className="text-lg">🛡️</span>
            <span>Sponsored content blocked or currently unavailable.</span>
          </div>
        )}
        {status === 'loaded' && (
          <div className="text-[10px] text-slate-500 italic">
            Ad displayed securely.
          </div>
        )}
      </div>
    </div>
  );
}
