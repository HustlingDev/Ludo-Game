import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(15);
  const [loadingText, setLoadingText] = useState('Starting game engine...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const steps = [
      { delay: 350, progress: 45, text: 'Connecting real-time match servers...' },
      { delay: 850, progress: 75, text: 'Synchronizing UGX Arena stakes...' },
      { delay: 1400, progress: 100, text: 'Welcome to Ludo Royale!' },
    ];

    const timeouts = steps.map((step) =>
      setTimeout(() => {
        setProgress(step.progress);
        setLoadingText(step.text);
      }, step.delay)
    );

    const finishTimeout = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onComplete, 400);
    }, 2000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(finishTimeout);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      id="splash-screen"
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white select-none cursor-pointer transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top subtle badge */}
      <div className="pt-6 relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-semibold tracking-wider uppercase">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Live Multiplayer Gaming</span>
      </div>

      {/* Center Hero: Standard Ludo Icon, Title & Slogan */}
      <div className="flex flex-col items-center text-center space-y-4 relative z-10 my-auto">
        {/* Ludo Standard Logo with glow and pulse */}
        <div id="splash-logo" className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/40 bg-slate-950 flex items-center justify-center">
            <img
              src="/icon.png"
              alt="Ludo Royale"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if icon hasn't loaded yet
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            {/* Fallback Icon if image loading */}
            <div className="absolute inset-0 flex items-center justify-center text-5xl">
              🎲
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
            LUDO ROYALE
          </h1>
          
          {/* Prominent Slogan: "Win real Cash" */}
          <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/60 shadow-lg shadow-amber-500/10">
            <span className="text-base sm:text-lg font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              Win real Cash
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Loading Progress & Status */}
      <div className="w-full max-w-xs space-y-3 pb-8 relative z-10">
        {/* Animated Progress Bar */}
        <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="truncate">{loadingText}</span>
          <span className="font-mono text-amber-400 font-bold ml-2">{progress}%</span>
        </div>

        <button
          id="splash-continue-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 transition"
        >
          Tap to Play
        </button>
      </div>
    </div>
  );
};
