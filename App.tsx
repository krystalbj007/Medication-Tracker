
import React, { useState, useEffect, useCallback } from 'react';
import { Pill, Settings, History, Heart, Info, X, Sparkles } from 'lucide-react';
import FloatingWidget from './components/FloatingWidget';
import HistoryChart from './components/HistoryChart';
import { MedicationLog, MedicationSettings, AIAdvice } from './types';
import { getAIHealthAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [logs, setLogs] = useState<MedicationLog[]>(() => {
    const saved = localStorage.getItem('medflow_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<MedicationSettings>(() => {
    const saved = localStorage.getItem('medflow_settings');
    // 如果没有保存的设置，使用默认值
    if (!saved) {
      return {
        name: '各种维生素',
        type: '日常保健药',
        intervalHours: 6,
        lastDoseTime: null
      };
    }
    return JSON.parse(saved);
  });

  const [isMini, setIsMini] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  // 初始化获取一次建议
  useEffect(() => {
    const fetchInitialAdvice = async () => {
      setIsLoadingAdvice(true);
      try {
        const advice = await getAIHealthAdvice("日常问候", logs);
        setAiAdvice(advice);
      } catch (err) {
        setAiAdvice({ message: "准备好了吗？开启今天的健康之旅吧！", type: 'encouragement' });
      } finally {
        setIsLoadingAdvice(false);
      }
    };
    fetchInitialAdvice();
  }, []);

  useEffect(() => {
    localStorage.setItem('medflow_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('medflow_settings', JSON.stringify(settings));
  }, [settings]);

  // 处理吃药打卡
  const handleCheckIn = useCallback(async () => {
    const now = Date.now();
    const newLog: MedicationLog = {
      id: now.toString(),
      timestamp: now,
      medicineName: settings.name,
      medicineType: settings.type
    };

    setLogs(prev => [newLog, ...prev]);
    setSettings(prev => ({ ...prev, lastDoseTime: now }));

    setIsLoadingAdvice(true);
    try {
      const advice = await getAIHealthAdvice(`${settings.type}: ${settings.name}`, [newLog, ...logs]);
      setAiAdvice(advice);
    } catch (err) {
      console.error('Advice fetch error:', err);
    } finally {
      setIsLoadingAdvice(false);
    }
  }, [settings, logs]);

  // 联动逻辑：根据类型自动匹配默认备注
  const handleTypeChange = (type: string) => {
    let defaultName = settings.name;
    if (type === '生病吃药') {
      defaultName = '一天三次';
    } else if (type === '日常保健药') {
      defaultName = '各种维生素';
    } else if (type === '没事儿想吃药') {
      defaultName = '随便吃吃';
    }

    setSettings(prev => ({ 
      ...prev, 
      type, 
      name: defaultName 
    }));
  };

  const updateSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSettings(prev => ({
      ...prev,
      name: formData.get('name') as string,
      intervalHours: Number(formData.get('interval'))
    }));
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-12 pb-32">
      <header className="w-full max-w-4xl flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">MedFlow</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-sm font-medium text-gray-500">Hello Vincent 祝你身体倍儿棒！</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-3 hover:bg-white glass rounded-2xl transition-all text-gray-400 hover:text-indigo-600 shadow-sm border border-transparent hover:border-indigo-100"
        >
          <Settings className="w-6 h-6" />
        </button>
      </header>

      {!isMini && (
        <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 flex justify-center">
            <FloatingWidget 
              settings={settings} 
              onCheckIn={handleCheckIn} 
              onTypeChange={handleTypeChange}
              isMini={false} 
              toggleMini={() => setIsMini(true)} 
            />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className={`glass p-6 rounded-[2rem] border-l-4 transition-all duration-500 ${isLoadingAdvice ? 'animate-pulse opacity-70' : 'opacity-100'} ${aiAdvice?.type === 'warning' ? 'border-amber-400' : 'border-indigo-500 shadow-sm'}`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl transition-colors ${aiAdvice?.type === 'warning' ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                  {isLoadingAdvice ? (
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
                  ) : (
                    <Heart className={`w-5 h-5 ${aiAdvice?.type === 'warning' ? 'text-amber-500' : 'text-indigo-600'}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm mb-1 flex items-center gap-2">
                    健康助手
                    {isLoadingAdvice && <span className="text-[10px] text-indigo-400 font-normal">正在思考...</span>}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed min-h-[1.25rem]">
                    {aiAdvice?.message || "正在加载今日健康建议..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-6 rounded-[2rem] border border-white/60">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-2">今日已吃</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-800">
                    {logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
                  </span>
                  <span className="text-gray-400 font-bold">次</span>
                </div>
              </div>
              <div className="glass p-6 rounded-[2rem] border border-white/60">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-2">累计次数</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-800">{logs.length}</span>
                  <span className="text-gray-400 font-bold">次</span>
                </div>
              </div>
            </div>

            <div className="glass p-8 rounded-[2rem] border border-white/60 flex-1 overflow-hidden flex flex-col min-h-[350px]">
              <h3 className="text-gray-800 font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <History className="w-5 h-5 text-indigo-500" />
                </div>
                打卡记录
              </h3>
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <Info className="w-10 h-10 mb-2 opacity-10" />
                    <p className="text-sm font-medium">暂无记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.slice(0, 15).map(log => (
                      <div key={log.id} className="flex justify-between items-center group relative p-1 rounded-2xl transition-colors hover:bg-slate-50/50">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-8 bg-indigo-100 group-hover:bg-indigo-500 rounded-full transition-colors" />
                          <div>
                            <p className="text-sm font-bold text-gray-800">{log.medicineType}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-700 tabular-nums bg-white border border-slate-100 px-3 py-1 rounded-lg">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-12">
            <HistoryChart logs={logs} />
          </div>
        </main>
      )}

      {isMini && (
        <FloatingWidget 
          settings={settings} 
          onCheckIn={handleCheckIn} 
          onTypeChange={handleTypeChange}
          isMini={true} 
          toggleMini={() => setIsMini(false)} 
        />
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="glass w-full max-w-md p-8 rounded-[3rem] shadow-2xl relative animate-scale-in">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-rose-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Settings className="w-6 h-6 text-indigo-500" />
              </div>
              设置
            </h2>
            <form onSubmit={updateSettings} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">常用备注</label>
                <input 
                  name="name" 
                  defaultValue={settings.name}
                  key={settings.name} // 使用 key 强制重新渲染，确保联动时默认值更新
                  className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all"
                  placeholder="例如：餐后半小时"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">提醒间隔 (小时)</label>
                <input 
                  name="interval" 
                  type="number"
                  defaultValue={settings.intervalHours}
                  className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                保存设置
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
