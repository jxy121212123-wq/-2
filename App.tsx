import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Utensils, 
  Dumbbell, 
  Heart, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Scale,
  Sparkles,
  Smile,
  Meh,
  Frown,
  Coffee,
  Settings,
  CheckCircle2,
  Trophy,
  Zap,
  Moon,
  Sun,
  Flame,
  MessageCircle,
  X,
  ArrowRight,
  Info,
  PawPrint,
  ArrowUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyLog, WeightLog, AnimalType, CompanionConfig, PersonalityType, FEELINGS, EXERCISE_OPTIONS, FOOD_OPTIONS, ANIMAL_DATA } from './types';
import { generateEmotionalFeedback, generateWeeklySummary } from './services/geminiService';

const PERSONALITIES: Record<PersonalityType, { name: string, desc: string, color: string }> = {
  strict: { name: '严厉型', desc: '铁血教练，督促你变强', color: 'bg-red-100 text-red-600' },
  happy: { name: '快乐型', desc: '乐天派，开心减脂第一名', color: 'bg-yellow-100 text-yellow-600' },
  gentle: { name: '温柔型', desc: '治愈天使，包容你的所有', color: 'bg-green-100 text-green-600' },
  tsundere: { name: '傲娇型', desc: '口是心非，别扭地关心你', color: 'bg-purple-100 text-purple-600' }
};

export default function App() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [config, setConfig] = useState<CompanionConfig | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLogging, setIsLogging] = useState(false);
  const [isWeighting, setIsWeighting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<{ summaryText: string, moodKeywords: string[], exerciseBenefits: string } | null>(null);
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenSettingsHint');
    if (!hasSeenHint && config) {
      setShowSettingsHint(true);
    }
  }, [config]);

  // Form states
  const [food, setFood] = useState('');
  const [foodOption, setFoodOption] = useState('');
  const [exercise, setExercise] = useState('');
  const [exerciseOption, setExerciseOption] = useState('');
  const [feeling, setFeeling] = useState('');
  const [feelingNote, setFeelingNote] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [skipWeight, setSkipWeight] = useState(false);

  // Onboarding states
  const [tempConfig, setTempConfig] = useState<CompanionConfig>({
    animal: 'cat',
    personality: 'happy',
    weightFrequency: 7
  });

  useEffect(() => {
    fetchConfig();
    fetchLogs();
    fetchWeights();
  }, []);

  const fetchConfig = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data) {
      setConfig(data);
      setTempConfig(data);
    } else {
      setShowOnboarding(true);
    }
  };

  const fetchLogs = async () => {
    const res = await fetch('/api/logs');
    const data = await res.json();
    setLogs(data);
  };

  const fetchWeights = async () => {
    const res = await fetch('/api/weight');
    const data = await res.json();
    setWeights(data);
  };

  const handleSaveConfig = async () => {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tempConfig)
    });
    await fetchConfig();
    setShowOnboarding(false);
    setIsConfiguring(false);
  };

  const handleSaveLog = async () => {
    setLoading(true);
    const feedback = await generateEmotionalFeedback(
      food, 
      exercise, 
      feeling, 
      config?.personality, 
      config?.animal,
      FOOD_OPTIONS.find(o => o.value === foodOption)?.label,
      EXERCISE_OPTIONS.find(o => o.value === exerciseOption)?.label,
      feelingNote
    );
    
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: selectedDate,
        food,
        foodOption,
        exercise,
        exerciseOption,
        feeling,
        feelingNote,
        feedback
      })
    });
    
    await fetchLogs();
    setIsLogging(false);
    setLoading(false);
    setShowFeedback(feedback);
    setFood('');
    setFoodOption('');
    setExercise('');
    setExerciseOption('');
    setFeeling('');
    setFeelingNote('');
  };

  const handleSaveWeight = async () => {
    if (skipWeight) {
      setIsWeighting(false);
      setSkipWeight(false);
      return;
    }
    if (!weightInput) return;
    await fetch('/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: selectedDate,
        weight: parseFloat(weightInput)
      })
    });
    await fetchWeights();
    setIsWeighting(false);
    setWeightInput('');
  };

  const handleGenerateSummary = async () => {
    if (!config) return;
    setLoading(true);
    const last7Days = logs.slice(0, 7);
    const last7Weights = weights.slice(0, 7);
    const summary = await generateWeeklySummary(last7Days, last7Weights, config.personality, config.animal);
    setWeeklySummary(summary);
    setLoading(false);
  };

  const currentLog = logs.find(l => l.date === selectedDate);
  const currentWeight = weights.find(w => w.date === selectedDate);

  // Calendar logic
  const [viewDate, setViewDate] = useState(new Date());
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1);
    return d.toISOString().split('T')[0];
  });

  // Animal state logic
  const getAnimalState = (date: string) => {
    const log = logs.find(l => l.date === date);
    if (!log) return 'resting';
    if (log.food && log.exercise) return 'busy';
    if (log.food) return 'eating';
    if (log.exercise) return 'exercising';
    return 'resting';
  };

  const getAnimalEmoji = (animal: AnimalType, state: string) => {
    const base = ANIMAL_DATA[animal].icon;
    switch (state) {
      case 'eating': return `${base} 🍱`;
      case 'exercising': return `${base} 🏃`;
      case 'busy': return `${base} 💪`;
      default: return base;
    }
  };

  const getStreak = () => {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (logs.some(l => l.date === dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {onboardingStep === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-xl text-center space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-4xl font-display font-bold text-pink-500">欢迎来到「萌萌动」</h1>
                <div className="space-y-2 text-gray-500 leading-relaxed">
                  <p>这里不计算卡路里</p>
                  <p>没有严格计划</p>
                  <p>不催促你变瘦</p>
                  <p className="font-bold text-pink-400">只记录你认真生活的每一天。</p>
                </div>
              </div>
              <button 
                onClick={() => setOnboardingStep(2)}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
              >
                🌿 我想试试
              </button>
            </motion.div>
          )}

          {onboardingStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-xl text-center space-y-8"
            >
              <h2 className="text-2xl font-bold text-gray-800">在这里，我们相信——</h2>
              <div className="space-y-6 text-lg text-gray-600">
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>偶尔放飞也没关系</motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>有低落的日子很正常</motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="font-bold text-pink-400">减肥是长期，不是竞赛</motion.p>
              </div>
              <button 
                onClick={() => setOnboardingStep(3)}
                className="w-full btn-primary py-4 text-lg"
              >
                嗯，我也想这样
              </button>
            </motion.div>
          )}

          {onboardingStep === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-xl space-y-8"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-display font-bold text-pink-500">选一个陪你慢慢变好的小动物吧 🐾</h1>
                <p className="text-gray-400">它不会监督你，只会陪你。</p>
              </div>

              <div className="space-y-6">
                <section>
                  <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">1. 选择小伙伴</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(ANIMAL_DATA) as AnimalType[]).map(a => (
                      <button
                        key={a}
                        onClick={() => setTempConfig({ ...tempConfig, animal: a })}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${tempConfig.animal === a ? 'border-pink-400 bg-pink-50 scale-105' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <span className="text-3xl">{ANIMAL_DATA[a].icon}</span>
                        <span className="text-xs font-medium">{ANIMAL_DATA[a].name}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">2. 陪伴风格</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(PERSONALITIES) as PersonalityType[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setTempConfig({ ...tempConfig, personality: p })}
                        className={`p-4 rounded-2xl border-2 transition-all text-left space-y-1 ${tempConfig.personality === p ? 'border-pink-400 bg-pink-50' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">{PERSONALITIES[p].name}</span>
                          {tempConfig.personality === p && <CheckCircle2 size={14} className="text-pink-400" />}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">{PERSONALITIES[p].desc}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">3. 称重频率</label>
                  <div className="flex gap-2">
                    {[1, 3, 7, 15].map(f => (
                      <button
                        key={f}
                        onClick={() => setTempConfig({ ...tempConfig, weightFrequency: f })}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all text-sm font-bold ${tempConfig.weightFrequency === f ? 'border-pink-400 bg-pink-50 text-pink-500' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                      >
                        {f === 1 ? '每天' : `${f}天`}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <button 
                onClick={() => {
                  handleSaveConfig();
                  setShowWelcome(true);
                }}
                className="w-full btn-primary py-4 text-lg"
              >
                开启快乐减脂之旅 ✨
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-xl text-center space-y-8"
        >
          <div className="text-6xl animate-bounce">{ANIMAL_DATA[config?.animal || 'cat'].icon}</div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-pink-500">欢迎来到萌萌动！</h2>
            <p className="text-gray-600 leading-relaxed">
              我是你的伙伴 <span className="font-bold text-pink-400">{ANIMAL_DATA[config?.animal || 'cat'].name}</span>！<br/>
              我会陪你记录每天的饮食、运动和心情。<br/>
              别担心，我不是来监督你的，我是来陪你一起感受生活的痕迹的。
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-left p-4 bg-gray-50 rounded-2xl">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-500">1</div>
              <p className="text-xs text-gray-500">点击“记一下”记录每天的小确幸</p>
            </div>
            <div className="flex items-center gap-3 text-left p-4 bg-gray-50 rounded-2xl">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">2</div>
              <p className="text-xs text-gray-500">每隔几天记一次体重，看看身体的变化</p>
            </div>
            <div className="flex items-center gap-3 text-left p-4 bg-gray-50 rounded-2xl">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500">3</div>
              <p className="text-xs text-gray-500">日历会记录你的心情，色彩斑斓才是生活</p>
            </div>
          </div>
          <button 
            onClick={() => setShowWelcome(false)}
            className="w-full btn-primary py-4"
          >
            我知道啦，出发！ 🚀
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] pb-24 font-sans">
      {/* Header */}
      <header className="p-6 flex justify-between items-center relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="text-4xl bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-pink-50">
            {getAnimalEmoji(config?.animal || 'cat', getAnimalState(new Date().toISOString().split('T')[0]))}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-pink-500">萌萌动</h1>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PERSONALITIES[config?.personality || 'happy'].color}`}>
                {PERSONALITIES[config?.personality || 'happy'].name}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold">
                <Flame size={10} /> {getStreak()}
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="relative">
          <button 
            onClick={() => {
              setIsConfiguring(true);
              setShowSettingsHint(false);
              localStorage.setItem('hasSeenSettingsHint', 'true');
            }}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm border border-pink-50 hover:bg-pink-50 hover:text-pink-400 transition-all group"
          >
            <PawPrint size={24} className="group-hover:scale-110 transition-transform" />
          </button>

          <AnimatePresence>
            {showSettingsHint && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-0 right-full mr-4 w-40 bg-white border-2 border-pink-200 p-3 rounded-[1.5rem] shadow-xl z-30 flex flex-col items-center gap-2"
              >
                <div className="absolute top-4 -right-2 w-4 h-4 bg-white border-r-2 border-t-2 border-pink-200 rotate-45" />
                <div className="flex items-center gap-2">
                  <span className="text-xl animate-bounce">🐶</span>
                  <p className="text-[10px] font-bold text-pink-500 leading-tight">点我选教练呀！</p>
                </div>
                <button 
                  onClick={() => {
                    setShowSettingsHint(false);
                    localStorage.setItem('hasSeenSettingsHint', 'true');
                  }}
                  className="text-[9px] bg-pink-100 text-pink-500 px-2 py-1 rounded-full font-bold hover:bg-pink-200 transition-colors"
                >
                  好哒 ~
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 space-y-6">
        {/* Calendar Card */}
        <section className="cute-card overflow-hidden relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold flex items-center gap-2 text-pink-500">
              <CalendarIcon size={18} />
              {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1.5 hover:bg-pink-50 rounded-full transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1.5 hover:bg-pink-50 rounded-full transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold mb-3 text-gray-300 uppercase tracking-widest">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
            {calendarDays.map(date => {
              const log = logs.find(l => l.date === date);
              const weight = weights.find(w => w.date === date);
              const isSelected = selectedDate === date;
              const isToday = new Date().toISOString().split('T')[0] === date;
              const feelingObj = FEELINGS.find(f => f.value === log?.feeling);
              
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all group
                    ${isSelected ? 'bg-pink-400 text-white shadow-lg scale-110 z-10' : feelingObj ? feelingObj.color : 'bg-white'}
                    ${isToday && !isSelected ? 'border-2 border-pink-200' : ''}
                    ${!isSelected && !feelingObj ? 'hover:bg-pink-50' : ''}
                  `}
                >
                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                    {date.split('-')[2]}
                  </span>
                  
                  <div className="absolute top-1 right-1 flex flex-col items-end">
                    {weight && <span className={`text-[8px] font-bold ${isSelected ? 'text-white' : 'text-blue-500'}`}>{weight.weight}</span>}
                  </div>

                  <div className="mt-0.5 h-4 flex items-center justify-center">
                    {feelingObj ? (
                      <span className="text-[10px]">{feelingObj.icon}</span>
                    ) : log ? (
                      <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-pink-300'}`} />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected Day Info */}
        <AnimatePresence mode="wait">
          <motion.section
            key={selectedDate}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-end px-2">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedDate === new Date().toISOString().split('T')[0] ? '今天' : selectedDate}
                </h3>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={handleGenerateSummary}
                    className="text-[10px] font-bold text-pink-400 flex items-center gap-1 hover:underline"
                  >
                    <Sparkles size={10} /> 生成周总结
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsWeighting(true)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-500 px-4 py-2 rounded-2xl hover:bg-blue-100 transition-all active:scale-95"
                >
                  <Scale size={14} /> 记体重
                </button>
                <button 
                  onClick={() => setIsLogging(true)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-pink-50 text-pink-500 px-4 py-2 rounded-2xl hover:bg-pink-100 transition-all active:scale-95"
                >
                  <Plus size={14} /> 记一下
                </button>
              </div>
            </div>

            {currentLog ? (
              <div className="space-y-4">
                <div className="cute-card bg-gradient-to-br from-pink-50 to-white border-none relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 text-8xl opacity-10 rotate-12 transition-transform group-hover:rotate-0">
                    {ANIMAL_DATA[config?.animal || 'cat'].icon}
                  </div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="text-5xl animate-bounce">
                      {getAnimalEmoji(config?.animal || 'cat', getAnimalState(selectedDate))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-yellow-400" />
                        <span className="font-bold text-pink-500">
                          {ANIMAL_DATA[config?.animal || 'cat'].name}的悄悄话
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600 font-medium">
                        {currentLog.feedback}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="cute-card p-5 flex flex-col items-center text-center group hover:bg-orange-50 transition-colors">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Utensils className="text-orange-400" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 mb-1 uppercase tracking-wider">吃了什么</span>
                    <p className="text-sm font-bold text-gray-700">
                      {FOOD_OPTIONS.find(o => o.value === currentLog.foodOption)?.icon} {FOOD_OPTIONS.find(o => o.value === currentLog.foodOption)?.label || '正常吃'}
                    </p>
                    {currentLog.food && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{currentLog.food}</p>}
                  </div>
                  <div className="cute-card p-5 flex flex-col items-center text-center group hover:bg-green-50 transition-colors">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Dumbbell className="text-green-400" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 mb-1 uppercase tracking-wider">做了运动</span>
                    <p className="text-sm font-bold text-gray-700">
                      {EXERCISE_OPTIONS.find(o => o.value === currentLog.exerciseOption)?.icon} {EXERCISE_OPTIONS.find(o => o.value === currentLog.exerciseOption)?.label || '休息日~'}
                    </p>
                    {currentLog.exercise && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{currentLog.exercise}</p>}
                  </div>
                </div>

                <div className="cute-card p-5 flex items-center gap-4 group hover:bg-red-50 transition-colors">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">今日感受</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{FEELINGS.find(f => f.value === currentLog.feeling)?.icon}</span>
                      <p className="text-sm font-bold text-gray-700">
                        {FEELINGS.find(f => f.value === currentLog.feeling)?.label || currentLog.feeling || '平平淡淡的一天~'}
                      </p>
                    </div>
                    {currentLog.feelingNote && <p className="text-[10px] text-gray-400 mt-1 italic">"{currentLog.feelingNote}"</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="cute-card py-16 flex flex-col items-center justify-center text-gray-300 border-dashed border-2 bg-transparent">
                <div className="text-6xl mb-6 opacity-20 grayscale">
                  {ANIMAL_DATA[config?.animal || 'cat'].icon}
                </div>
                <p className="font-bold">今天还没有记录哦，快来记一下吧~</p>
              </div>
            )}

            {currentWeight && (
              <div className="cute-card p-6 bg-blue-50/50 border-blue-100 flex justify-between items-center shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Scale className="text-blue-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">体重记录</span>
                    <p className="text-sm font-bold text-blue-600">离目标又近了一步！</p>
                  </div>
                </div>
                <span className="text-3xl font-display font-bold text-blue-500">{currentWeight.weight} <small className="text-xs font-sans">kg</small></span>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      {/* Logging Modal */}
      <AnimatePresence>
        {isLogging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-display font-bold text-pink-500 flex items-center gap-2">
                  <Sparkles size={24} /> 记录快乐瞬间
                </h2>
                <button onClick={() => setIsLogging(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">✕</button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                <section>
                  <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">今天吃得开心吗？</label>
                  <div className="grid grid-cols-3 gap-3">
                    {FOOD_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => setFoodOption(o.value)}
                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${foodOption === o.value ? 'border-orange-400 bg-orange-50' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <span className="text-2xl">{o.icon}</span>
                        <span className="text-[10px] font-bold">{o.label}</span>
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    placeholder="分享一下今天的美味吧..."
                    className="w-full mt-3 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 text-sm"
                  />
                </section>

                <section>
                  <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">今天身体动起来了吗？</label>
                  <div className="grid grid-cols-3 gap-3">
                    {EXERCISE_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => setExerciseOption(o.value)}
                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${exerciseOption === o.value ? 'border-green-400 bg-green-50' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <span className="text-2xl">{o.icon}</span>
                        <span className="text-[10px] font-bold">{o.label}</span>
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    value={exercise}
                    onChange={(e) => setExercise(e.target.value)}
                    placeholder="记录下流汗的快乐时刻..."
                    className="w-full mt-3 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-200 text-sm"
                  />
                </section>

                <section>
                  <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">此刻想对自己说什么？</label>
                  <div className="grid grid-cols-4 gap-2">
                    {FEELINGS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setFeeling(f.value)}
                        className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${feeling === f.value ? 'border-pink-400 bg-pink-50' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <span className="text-xl">{f.icon}</span>
                        <span className="text-[9px] font-bold truncate w-full text-center">{f.label}</span>
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={feelingNote}
                    onChange={(e) => setFeelingNote(e.target.value)}
                    placeholder="把这一刻的心情写下来吧..."
                    className="w-full mt-3 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pink-200 text-sm min-h-[80px]"
                  />
                </section>
              </div>

              <button 
                onClick={handleSaveLog}
                disabled={loading}
                className="btn-primary w-full py-5 text-xl flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>保存这份快乐 <Sparkles size={22} /></>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weight Modal */}
      <AnimatePresence>
        {isWeighting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-[3rem] p-10 space-y-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Scale size={40} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-blue-500">记录体重</h2>
                <p className="text-xs text-gray-400 mt-1">每{config?.weightFrequency}天记录一次最科学哦</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Info size={18} className="text-blue-400" />
                    <span className="text-sm font-medium text-blue-600">今天不想称？</span>
                  </div>
                  <button 
                    onClick={() => setSkipWeight(!skipWeight)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${skipWeight ? 'bg-blue-400' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${skipWeight ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {!skipWeight && (
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.1"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      placeholder="0.0"
                      className="w-full text-5xl font-display font-bold text-center p-6 border-b-4 border-blue-50 focus:border-blue-400 focus:outline-none bg-transparent"
                    />
                    <span className="absolute right-2 bottom-8 text-gray-300 font-bold">kg</span>
                  </div>
                )}
                
                <p className="text-center text-xs text-gray-400">
                  {skipWeight ? '没关系，休息一下，下次再称也行哦~' : `建议每${config?.weightFrequency}天称一次，不要有压力哦~`}
                </p>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsWeighting(false)} className="flex-1 py-4 text-gray-400 font-bold text-lg">取消</button>
                <button onClick={handleSaveWeight} className="flex-1 py-4 bg-blue-400 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-500 transition-all active:scale-95 text-lg">保存</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isConfiguring && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-display font-bold text-pink-500">修改小伙伴</h2>
                <button onClick={() => setIsConfiguring(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">✕</button>
              </div>

              <div className="space-y-6">
                <section>
                  <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">更换伙伴</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(ANIMAL_DATA) as AnimalType[]).map(a => (
                      <button
                        key={a}
                        onClick={() => setTempConfig({ ...tempConfig, animal: a })}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${tempConfig.animal === a ? 'border-pink-400 bg-pink-50 scale-105' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <span className="text-3xl">{ANIMAL_DATA[a].icon}</span>
                        <span className="text-xs font-medium">{ANIMAL_DATA[a].name}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">陪伴风格</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(PERSONALITIES) as PersonalityType[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setTempConfig({ ...tempConfig, personality: p })}
                        className={`p-4 rounded-2xl border-2 transition-all text-left space-y-1 ${tempConfig.personality === p ? 'border-pink-400 bg-pink-50' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">{PERSONALITIES[p].name}</span>
                          {tempConfig.personality === p && <CheckCircle2 size={14} className="text-pink-400" />}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">{PERSONALITIES[p].desc}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <button 
                onClick={handleSaveConfig}
                className="w-full btn-primary py-4 text-lg"
              >
                保存修改 ✨
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Card (炸裂效果) */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-pink-500/20 backdrop-blur-xl z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-yellow-400 to-pink-400" />
              <div className="text-7xl mb-4 animate-bounce">
                {ANIMAL_DATA[config?.animal || 'cat'].icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-pink-500">
                  {ANIMAL_DATA[config?.animal || 'cat'].name}的悄悄话
                </h3>
                <p className="text-gray-600 leading-relaxed italic">
                  "{showFeedback}"
                </p>
              </div>
              <button 
                onClick={() => setShowFeedback(null)}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2"
              >
                收到啦，我会加油的！ <Heart size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Summary Modal */}
      <AnimatePresence>
        {weeklySummary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setWeeklySummary(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-pink-100 rounded-3xl flex items-center justify-center text-4xl">
                  {ANIMAL_DATA[config?.animal || 'cat'].icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">本周生活痕迹</h3>
                  <p className="text-sm text-pink-400 font-bold">由{ANIMAL_DATA[config?.animal || 'cat'].name}为你总结</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-pink-50/50 p-5 rounded-[2rem] border border-pink-100">
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    "{weeklySummary.summaryText}"
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">本周心情关键词</h4>
                  <div className="flex flex-wrap gap-2">
                    {weeklySummary.moodKeywords.map(kw => (
                      <span key={kw} className="px-3 py-1 bg-white border border-pink-100 text-pink-500 rounded-full text-xs font-bold shadow-sm">
                        # {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">体重变化趋势</h4>
                  <div className="h-48 w-full bg-gray-50 rounded-3xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weights.slice(-7).reverse().map(w => ({ date: w.date.split('-').slice(1).join('/'), weight: w.weight }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                        <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#ec4899' }}
                        />
                        <Line type="monotone" dataKey="weight" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">运动带来的变化</h4>
                  <div className="bg-green-50 p-5 rounded-[2rem] border border-green-100">
                    <div className="flex items-start gap-3">
                      <Zap className="text-green-500 shrink-0 mt-1" size={18} />
                      <p className="text-sm text-green-700 leading-relaxed">
                        {weeklySummary.exerciseBenefits}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setWeeklySummary(null)}
                className="w-full btn-primary py-4"
              >
                收下这份鼓励 ✨
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
