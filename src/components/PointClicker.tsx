import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Award } from 'lucide-react';

interface PointClickerProps {
  clickPower: number;
  points: number;
  level: number;
  experience: number;
  onEarnPoints: (amount: number, expAmount: number) => void;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
}

export default function PointClicker({
  clickPower,
  points,
  level,
  experience,
  onEarnPoints
}: PointClickerProps) {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isPressing, setIsPressing] = useState(false);
  const clickCounterRef = useRef(0);
  const nextLevelExp = level * 100;
  const expPercent = Math.min(100, Math.floor((experience / nextLevelExp) * 100));

  const handleOrbClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Determine coordinate relative to the clicked button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Increment click count & generate unique ID
    const newId = ++clickCounterRef.current;
    const randomOffset = (Math.random() - 0.5) * 40;

    const newFloat: FloatingText = {
      id: newId,
      x: x + randomOffset,
      y: y - 20,
      text: `+${clickPower} P`
    };

    setFloatingTexts((prev) => [...prev, newFloat]);

    // Perform earning (Click Power as Points, and standard click gives Click Power as EXP or similar)
    onEarnPoints(clickPower, clickPower); // clickPower amount of points, and clickPower amount of XP

    // Remove float after animation completes
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== newId));
    }, 1000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between min-h-[420px] relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.03),transparent_60%)] pointer-events-none" />

      {/* Header section with level bar */}
      <div className="w-full relative z-10">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-500" />
            <span>경험치 및 레벨</span>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            LV. {level}
          </span>
        </div>

        {/* Custom animated XP bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${expPercent}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-400 font-mono">
          <span>{experience} XP</span>
          <span>{nextLevelExp} XP</span>
        </div>
      </div>

      {/* Core clicking interactive area */}
      <div className="relative my-8 z-10">
        {/* Decorative rotating background circles */}
        <div className="absolute -inset-8 bg-indigo-50/40 rounded-full blur-xl animate-pulse pointer-events-none" />
        <div className="absolute -inset-4 border border-dashed border-indigo-100/80 rounded-full animate-[spin_40s_linear_infinite] pointer-events-none" />

        <button
          id="btn_point_clicker_orb"
          onClick={handleOrbClick}
          onMouseDown={() => setIsPressing(true)}
          onMouseUp={() => setIsPressing(false)}
          onMouseLeave={() => setIsPressing(false)}
          className="relative w-44 h-44 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all shadow-xl hover:shadow-indigo-200 hover:shadow-2xl focus:outline-none select-none"
          style={{
            transform: isPressing ? 'scale(0.92)' : 'scale(1)',
          }}
        >
          {/* Inner glass layer */}
          <div className="absolute inset-1.5 rounded-full bg-black/5 backdrop-blur-sm border border-white/10" />

          {/* Core content */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{ rotate: isPressing ? 15 : 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Zap className="w-10 h-10 text-amber-300 drop-shadow-md mb-1 animate-pulse" />
            </motion.div>
            <span className="text-xl font-extrabold tracking-tight">TAB ME!</span>
            <span className="text-[11px] text-indigo-100 font-medium opacity-90 mt-1">
              +{clickPower} P / Tab
            </span>
          </div>

          {/* Floating point numbers overlay */}
          <AnimatePresence>
            {floatingTexts.map((f) => (
              <motion.span
                key={f.id}
                initial={{ opacity: 1, scale: 0.8, y: f.y }}
                animate={{ opacity: 0, scale: 1.4, y: f.y - 120 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute text-xl font-black text-amber-300 drop-shadow-md pointer-events-none font-mono"
                style={{ left: f.x }}
              >
                {f.text}
              </motion.span>
            ))}
          </AnimatePresence>
        </button>
      </div>

      {/* Footer statistics indicator */}
      <div className="w-full border-t border-slate-50 pt-4 relative z-10 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>오브를 터치해 즉시 포인트를 누적해보세요!</span>
        </div>
      </div>
    </div>
  );
}
