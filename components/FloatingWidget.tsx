
import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle, Clock, Maximize2, ChevronDown } from 'lucide-react';
import { MedicationSettings } from '../types';

interface FloatingWidgetProps {
  settings: MedicationSettings;
  onCheckIn: () => void;
  onTypeChange: (type: string) => void;
  isMini: boolean;
  toggleMini: () => void;
}

const MED_TYPES = ['生病吃药', '日常保健药', '没事儿想吃药'];

const FloatingWidget: React.FC<FloatingWidgetProps> = ({ 
  settings, 
  onCheckIn, 
  onTypeChange,
  isMini, 
  toggleMini 
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!settings.lastDoseTime) {
        setTimeLeft('请开始记录');
        setPercent(0);
        return;
      }

      const now = Date.now();
      const nextDoseTime = settings.lastDoseTime + (settings.intervalHours * 60 * 60 * 1000);
      const diff = nextDoseTime - now;

      if (diff <= 0) {
        setTimeLeft('时间到了！');
        setPercent(100);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        
        const totalDuration = settings.intervalHours * 60 * 60 * 1000;
        const elapsed = now - settings.lastDoseTime;
        setPercent(Math.min(100, (elapsed / totalDuration) * 100));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings]);

  // Mini Mode (Floating Bubble)
  if (isMini) {
    return (
      <div 
        className="fixed bottom-6 right-6 glass p-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce-subtle cursor-pointer transition-all hover:scale-105 z-50 border border-white/40"
        onClick={onCheckIn}
      >
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
            <circle className="text-gray-200" strokeWidth="4" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
            <circle 
              className="text-indigo-500 transition-all duration-500" 
              strokeWidth="4" 
              strokeDasharray={125.6} 
              strokeDashoffset={125.6 - (125.6 * percent) / 100} 
              strokeLinecap="round" 
              stroke="currentColor" 
              fill="transparent" 
              r="20" 
              cx="24" 
              cy="24" 
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Pill className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        <div className="flex flex-col pr-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Next</span>
          <span className="text-sm font-bold text-gray-800 tabular-nums">{timeLeft}</span>
        </div>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleMini(); }}
          className="p-1 hover:bg-indigo-50 rounded-full text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Large Mode (Main Card)
  return (
    <div className="glass p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden transition-all">
      <div className="flex flex-col items-center gap-6">
        {/* Medication Type Selector */}
        <div className="w-full relative px-2 mt-2">
           <div className="flex items-center gap-2 mb-2 ml-1">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">选择提醒类型</span>
           </div>
           <div className="relative group">
              <select 
                value={settings.type} 
                onChange={(e) => onTypeChange(e.target.value)}
                className="w-full appearance-none bg-indigo-50/50 border border-indigo-100 text-indigo-700 py-4 px-5 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all cursor-pointer"
              >
                {MED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-indigo-400">
                <ChevronDown className="w-5 h-5" />
              </div>
           </div>
        </div>

        {/* Circular Timer Visualization */}
        <div className="relative w-56 h-56">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle className="text-gray-100/50" strokeWidth="8" stroke="currentColor" fill="transparent" r="88" cx="100" cy="100" />
            <circle 
              className="text-indigo-500 transition-all duration-1000" 
              strokeWidth="10" 
              strokeDasharray={552.9} 
              strokeDashoffset={552.9 - (552.9 * percent) / 100} 
              strokeLinecap="round" 
              stroke="currentColor" 
              fill="transparent" 
              r="88" 
              cx="100" 
              cy="100" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Clock className="w-8 h-8 text-indigo-200 mb-2 animate-pulse" />
            <span className="text-4xl font-black text-gray-800 tabular-nums tracking-tighter">{timeLeft}</span>
            <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">距离下次吃药</span>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">{settings.type}</h2>
          <p className="text-indigo-400 text-sm font-medium mt-1 uppercase tracking-widest">{settings.name}</p>
        </div>

        {/* Check-in Button */}
        <div className="w-full pt-2 flex justify-center">
           <button 
            type="button"
            onClick={onCheckIn}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-8 rounded-[2rem] shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            <CheckCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-lg">打卡吃药</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingWidget;
