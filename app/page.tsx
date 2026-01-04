'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { FitnessLog } from '@/types/fitness';
import { 
  Activity, 
  Flame, 
  Dumbbell, 
  Scale, 
  Calendar, 
  Plus, 
  TrendingUp, 
  PieChart, 
  Home, 
  CheckCircle2, 
  ChevronRight,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- 0. 配置 ---
// 单用户模式的固定 ID
const MY_USER_ID = 'myself'; 

// --- 1. UI 组件定义 ---

const LiquidBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen w-full bg-[#0f172a] text-white relative overflow-hidden font-sans selection:bg-pink-500 selection:text-white">
    {/* 背景光斑：这些会让顶部和底部呈现紫色/蓝色的流光效果 */}
    <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] animate-pulse" />
    <div className="fixed bottom-[10%] right-[-5%] w-80 h-80 bg-blue-600/30 rounded-full blur-[100px] animate-pulse delay-1000" />
    <div className="fixed top-[40%] left-[30%] w-64 h-64 bg-pink-500/20 rounded-full blur-[80px] animate-pulse delay-700" />
    
    {/* 内容容器：使用 safe-area padding 避免内容被刘海遮挡 */}
    <div className="relative z-10 max-w-md mx-auto h-full min-h-screen flex flex-col pb-24 pt-[env(safe-area-inset-top)] px-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      {children}
    </div>
  </div>
);

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg rounded-3xl p-5 ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', onClick, type = "button", disabled = false }: any) => {
  const baseStyle = "w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform active:scale-95 shadow-lg backdrop-blur-sm flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-600 text-white border border-white/20 shadow-blue-500/20",
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/20"
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, icon: Icon }: any) => (
  <div className="mb-4 group">
    <label className="block text-sm text-blue-200/80 mb-2 ml-1">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-300/50">
        {Icon && <Icon size={18} />}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-black/20 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50 focus:bg-black/30 transition-all"
      />
    </div>
  </div>
);

// --- 2. 辅助函数 ---

const calculateStreak = (logs: FitnessLog[]) => {
    if (!logs || logs.length === 0) return 0;
    const uniqueDates = [...new Set(logs.map(l => new Date(l.date).toDateString()))];
    const today = new Date().toDateString();
    let streak = 0;
    let currentCheck = new Date();
    if (!uniqueDates.includes(today)) {
        currentCheck.setDate(currentCheck.getDate() - 1);
    }
    for (let i = 0; i < uniqueDates.length + 1; i++) {
        const checkStr = currentCheck.toDateString();
        if (uniqueDates.includes(checkStr)) {
            streak++;
            currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
};

// --- 3. 主应用组件 ---

export default function FitnessApp() {
  const [logs, setLogs] = useState<FitnessLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Form State
  const [currentView, setCurrentView] = useState<'home' | 'add' | 'analytics'>('home');
  const [duration, setDuration] = useState('');
  const [type, setType] = useState<'cardio' | 'strength'>('cardio');
  const [calories, setCalories] = useState('');
  const [weight, setWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHeight, setUserHeight] = useState('175');

  // 初始化：直接拉取数据，无需登录
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('fitness_logs')
        .select('*')
        .eq('user_id', MY_USER_ID) // 只获取“我”的数据
        .order('date', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newLog = {
        user_id: MY_USER_ID, // 写入时使用固定 ID
        date: new Date().toISOString(),
        checked_in: true,
        duration: duration ? parseInt(duration) : 0,
        type,
        calories: calories ? parseInt(calories) : 0,
        weight: weight ? parseFloat(weight) : null,
      };

      const { error } = await supabase.from('fitness_logs').insert([newLog]);
      if (error) throw error;

      await fetchLogs(); // 刷新数据
      setDuration('');
      setCalories('');
      setWeight('');
      setType('cardio');
      setCurrentView('home');
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这条记录吗?')) {
        const { error } = await supabase.from('fitness_logs').delete().eq('id', id);
        if (error) {
            alert("删除失败: " + error.message);
        } else {
            fetchLogs();
        }
    }
  };

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const totalDays = logs.length;
    const goal = 100;
    const progress = Math.min((totalDays / goal) * 100, 100);
    const totalCalories = logs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
    const totalDuration = logs.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const currentStreak = calculateStreak(logs);
    const weightHistory = logs
      .filter(l => l.weight)
      .map(l => ({ 
        date: new Date(l.date).toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'}), 
        weight: l.weight 
      }))
      .reverse();
    const cardioCount = logs.filter(l => l.type === 'cardio').length;
    const strengthCount = logs.filter(l => l.type === 'strength').length;
    const badges = [
        { id: 1, name: "起步", desc: "完成第 1 次打卡", icon: "🚀", unlocked: totalDays >= 1 },
        { id: 2, name: "周达人", desc: "累计打卡 7 天", icon: "🔥", unlocked: totalDays >= 7 },
        { id: 3, name: "坚持不懈", desc: "连续打卡 3 天", icon: "⚡", unlocked: currentStreak >= 3 },
        { id: 4, name: "燃烧者", desc: "总消耗 > 3000 千卡", icon: "🌋", unlocked: totalCalories > 3000 },
        { id: 5, name: "力量之王", desc: "5 次力量训练", icon: "🦍", unlocked: strengthCount >= 5 },
        { id: 6, name: "半程", desc: "完成 50 天目标", icon: "🏆", unlocked: totalDays >= 50 },
    ];
    const today = new Date();
    const heatmapData = [];
    for (let i = 27; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayStr = d.toDateString();
        const hasLog = logs.some(l => new Date(l.date).toDateString() === dayStr);
        heatmapData.push({ date: d, active: hasLog });
    }
    return { totalDays, goal, progress, totalCalories, totalDuration, weightHistory, cardioCount, strengthCount, currentStreak, badges, heatmapData };
  }, [logs]);

  // BMI Helper
  const getBMI = () => {
    if (!stats.weightHistory.length || !userHeight) return { val: 0, label: '未知' };
    const latestWeight = stats.weightHistory[stats.weightHistory.length - 1].weight as number;
    const h = parseFloat(userHeight) / 100;
    const bmi = (latestWeight / (h * h)).toFixed(1);
    let label = '正常';
    if (parseFloat(bmi) < 18.5) label = '偏瘦';
    else if (parseFloat(bmi) >= 24 && parseFloat(bmi) < 28) label = '超重';
    else if (parseFloat(bmi) >= 28) label = '肥胖';
    return { val: bmi, label };
  };
  const bmiData = getBMI();

  // --- Views ---

  const HomeView = () => (
    <div className="space-y-6 pt-6 px-5 animate-fadeIn">
      <div className="flex justify-between items-center mb-2">
        <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-pink-200">2026 健身挑战</h1>
            <p className="text-blue-200/60 text-sm">每天进步一点点</p>
        </div>
        <div className="bg-white/10 p-2 rounded-full border border-white/10">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center font-bold text-xs">
                 ME
             </div>
        </div>
      </div>

      <GlassCard className="relative overflow-hidden min-h-[240px] flex flex-col justify-center items-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
        <div className="relative z-10 text-center w-full">
          <div className="absolute top-0 left-0 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1 border border-white/10 shadow-lg">
             <Zap size={12} className="text-yellow-400 fill-yellow-400" />
             <span className="text-xs font-bold text-white">{stats.currentStreak} 天连胜</span>
          </div>
          <div className="w-32 h-32 mx-auto rounded-full border-8 border-white/5 flex items-center justify-center relative mt-2">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeDasharray="264" strokeDashoffset={264 - (264 * stats.progress) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out"/>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{stats.totalDays}</span>
                <span className="text-[10px] text-blue-200 uppercase tracking-widest">Days</span>
            </div>
          </div>
          <p className="mt-4 text-blue-100/80 text-sm font-medium">
            距离 100 天目标还有 <span className="text-white font-bold">{stats.goal - stats.totalDays}</span> 天
          </p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
         <GlassCard className="flex flex-col items-center justify-center py-6 gap-2">
            <Flame className="text-orange-400" size={24} />
            <span className="text-2xl font-bold">{stats.totalCalories}</span>
            <span className="text-xs text-white/50">Kcal 消耗</span>
         </GlassCard>
         <GlassCard className="flex flex-col items-center justify-center py-6 gap-2">
            <Activity className="text-emerald-400" size={24} />
            <span className="text-2xl font-bold">{Math.round(stats.totalDuration / 60)}h</span>
            <span className="text-xs text-white/50">运动时长</span>
         </GlassCard>
      </div>

      <div className="pt-2">
        <h3 className="text-sm text-white/60 mb-3 px-1">最近 28 天状态</h3>
        <div className="grid grid-cols-7 gap-2">
            {stats.heatmapData.map((day, i) => (
                <div key={i} className={`aspect-square rounded-md transition-all duration-500 ${day.active ? 'bg-gradient-to-tr from-green-400 to-green-600 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-white/5'}`} />
            ))}
        </div>
      </div>
    </div>
  );

  const AddView = () => (
    <div className="pt-6 px-5 h-full flex flex-col animate-fadeIn">
        <div className="flex items-center mb-6">
            <button onClick={() => setCurrentView('home')} className="p-2 -ml-2 text-white/60 hover:text-white">
                <ChevronRight className="rotate-180" />
            </button>
            <h2 className="text-2xl font-bold ml-2">今日打卡</h2>
        </div>
        <GlassCard className="flex-1 flex flex-col">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-full text-green-400"><CheckCircle2 size={24} /></div>
                        <div><p className="font-bold">确认健身</p><p className="text-xs text-white/50">今日必填项</p></div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                </div>
                <div className="space-y-4">
                    <p className="text-sm font-medium text-white/60 uppercase tracking-wider pl-1">详细记录 (选填)</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setType('cardio')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${type === 'cardio' ? 'bg-blue-600/30 border-blue-400 text-white' : 'bg-black/20 border-transparent text-white/40'}`}>
                            <Activity size={24} /><span className="text-sm font-medium">有氧</span>
                        </button>
                        <button type="button" onClick={() => setType('strength')} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${type === 'strength' ? 'bg-purple-600/30 border-purple-400 text-white' : 'bg-black/20 border-transparent text-white/40'}`}>
                            <Dumbbell size={24} /><span className="text-sm font-medium">力量</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="时长 (分钟)" type="number" placeholder="30" icon={Calendar} value={duration} onChange={(e:any) => setDuration(e.target.value)} />
                        <Input label="消耗 (千卡)" type="number" placeholder="200" icon={Flame} value={calories} onChange={(e:any) => setCalories(e.target.value)} />
                    </div>
                    <Input label="今日体重 (kg)" type="number" placeholder="65.5" icon={Scale} value={weight} onChange={(e:any) => setWeight(e.target.value)} />
                </div>
                <div className="mt-auto pt-6">
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '保存中...' : '完成打卡'}</Button>
                </div>
            </form>
        </GlassCard>
    </div>
  );

  const AnalyticsView = () => (
    <div className="pt-6 px-5 space-y-6 pb-24 animate-fadeIn">
        <h2 className="text-2xl font-bold">数据分析</h2>
        <div className="grid grid-cols-2 gap-4">
             <GlassCard className="flex flex-col items-center justify-center gap-2">
                 <div className="relative w-16 h-16">
                     <PieChart className="text-purple-400 absolute inset-0 m-auto" size={24} />
                     <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-blue-500/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        <path className="text-purple-500" strokeDasharray={`${(stats.strengthCount / (stats.totalDays || 1)) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                     </svg>
                 </div>
                 <div className="text-center">
                     <span className="text-xs text-white/50">有氧 vs 力量</span>
                     <p className="text-sm font-bold">{stats.cardioCount} : {stats.strengthCount}</p>
                 </div>
             </GlassCard>
             <GlassCard className="flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                     <span className="text-xs text-white/60">BMI 指数</span>
                     <Info size={12} className="text-white/40"/>
                </div>
                <div className="text-center mb-2">
                    <span className="text-3xl font-bold text-white">{bmiData.val}</span>
                    <span className={`text-xs ml-1 px-1.5 py-0.5 rounded ${bmiData.label === '正常' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{bmiData.label}</span>
                </div>
                <div className="relative border-t border-white/10 pt-2">
                    <input type="number" value={userHeight} onChange={(e) => setUserHeight(e.target.value)} className="w-full bg-transparent text-center text-sm focus:outline-none text-blue-300 placeholder-white/20" placeholder="身高 cm" />
                </div>
             </GlassCard>
        </div>
        <GlassCard>
            <div className="flex items-center gap-2 mb-4"><Scale className="text-blue-400" size={20} /><h3 className="font-semibold">体重趋势</h3></div>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.weightHistory}>
                        <defs><linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient></defs>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} labelStyle={{ color: '#ccc' }} />
                        <Area type="monotone" dataKey="weight" stroke="#8884d8" fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
        <div className="space-y-3">
             <div className="flex items-center gap-2 px-1"><Award className="text-yellow-400" size={20} /><h3 className="font-semibold">成就徽章</h3></div>
             <div className="grid grid-cols-3 gap-3">
                 {stats.badges.map((badge) => (
                     <div key={badge.id} className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-center p-2 border transition-all duration-300 ${badge.unlocked ? 'bg-white/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-black/20 border-white/5 opacity-50 grayscale'}`}>
                         <div className="text-2xl mb-1 filter drop-shadow-md">{badge.icon}</div>
                         <p className="text-[10px] font-bold text-white/90">{badge.name}</p>
                     </div>
                 ))}
             </div>
        </div>
        <div className="space-y-4 pt-4">
            <h3 className="font-semibold px-1">历史记录</h3>
            {logs.map((log) => (
                <div key={log.id} className="relative group">
                    <GlassCard className="flex items-center justify-between p-4 py-3">
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-white/30 w-8 text-center">{new Date(log.date).getDate()}<span className="block text-[8px] uppercase">{new Date(log.date).toLocaleDateString('en-US', {month: 'short'})}</span></span>
                            <div className="h-8 w-[1px] bg-white/10"></div>
                            <div>
                                <p className="font-medium text-sm text-white/90">{log.type === 'strength' ? 'Strength Training' : 'Cardio Session'}</p>
                                <p className="text-xs text-white/40">{log.duration ? `${log.duration} min` : 'No duration'} {log.weight && ` · ${log.weight}kg`}</p>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }} className="text-red-400/50 hover:text-red-400 p-2">×</button>
                    </GlassCard>
                </div>
            ))}
        </div>
    </div>
  );

  const NavBar = () => (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full p-2 flex items-center shadow-2xl pointer-events-auto">
            <button onClick={() => setCurrentView('home')} className={`p-4 rounded-full transition-all duration-300 ${currentView === 'home' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}><Home size={24} /></button>
            <button onClick={() => setCurrentView('add')} className={`mx-2 p-4 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/40 transform transition-transform hover:scale-110 active:scale-95 border border-white/20`}><Plus size={28} /></button>
            <button onClick={() => setCurrentView('analytics')} className={`p-4 rounded-full transition-all duration-300 ${currentView === 'analytics' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}><TrendingUp size={24} /></button>
        </div>
    </div>
  );

  if (loading) return <LiquidBackground><div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div></LiquidBackground>;

  return (
    <LiquidBackground>
      {currentView === 'home' && <HomeView />}
      {currentView === 'add' && <AddView />}
      {currentView === 'analytics' && <AnalyticsView />}
      <NavBar />
    </LiquidBackground>
  );
}
