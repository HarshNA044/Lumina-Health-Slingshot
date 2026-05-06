import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MealLog, Habit, WeightLog, WaterLog, UserProfile } from '../types';
import { getHealthInsights } from '../lib/gemini';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Sparkles, 
  History, 
  ChevronRight, 
  Star,
  Activity,
  Flame,
  Utensils,
  Scale,
  Droplet,
  Zap,
  Ruler
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface DashboardProps {
  user: User;
  profile: UserProfile | null;
}

export default function Dashboard({ user, profile }: DashboardProps) {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [waterLog, setWaterLog] = useState<WaterLog | null>(null);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const mealsQuery = query(
      collection(db, 'meals'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsubscribeMeals = onSnapshot(mealsQuery, (snapshot) => {
      setMeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'meals'));

    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'habits'));

    const weightQuery = query(
      collection(db, 'weightLogs'), 
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(5)
    );
    const unsubscribeWeight = onSnapshot(weightQuery, (snapshot) => {
      setWeightLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'weightLogs'));

    const today = format(new Date(), 'yyyy-MM-dd');
    const waterQuery = query(
      collection(db, 'waterLogs'),
      where('userId', '==', user.uid),
      where('date', '==', today)
    );
    const unsubscribeWater = onSnapshot(waterQuery, (snapshot) => {
      if (!snapshot.empty) {
        setWaterLog({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as WaterLog);
      } else {
        setWaterLog(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'waterLogs'));

    return () => {
      unsubscribeMeals();
      unsubscribeHabits();
      unsubscribeWeight();
      unsubscribeWater();
    };
  }, [user.uid]);

  const generateInsights = async () => {
    if (meals.length === 0 && weightLogs.length === 0) return;
    setLoadingInsights(true);
    try {
      const res = await getHealthInsights(meals, habits, weightLogs);
      setInsights(res);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if ((meals.length > 0 || weightLogs.length > 0) && !insights) {
      generateInsights();
    }
  }, [meals, weightLogs]);

  const avgScore = meals.length > 0 
    ? (meals.reduce((acc, m) => acc + m.healthScore, 0) / meals.length).toFixed(1)
    : '0';

  const totalCalories = meals.reduce((acc, m) => acc + (m.calories || 0), 0);

  const bmi = (profile?.weight && profile?.height) 
    ? (profile.weight / (Math.pow(profile.height / 100, 2))).toFixed(1)
    : '--';

  const getBmiStatus = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return { label: 'Unknown', color: 'text-ink/20' };
    if (num < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
    if (num < 25) return { label: 'Healthy', color: 'text-green-500' };
    if (num < 30) return { label: 'Overweight', color: 'text-yellow-500' };
    return { label: 'Obese', color: 'text-red-500' };
  };

  const bmiStatus = getBmiStatus(bmi);

  const getRankInfo = (points: number) => {
    if (points < 500) return { rank: 'Novice', icon: Zap, progress: (points / 500) * 100, next: 500 };
    if (points < 2000) return { rank: 'Pathfinder', icon: Star, progress: ((points - 500) / 1500) * 100, next: 2000 };
    if (points < 5000) return { rank: 'Luminous', icon: Sparkles, progress: ((points - 2000) / 3000) * 100, next: 5000 };
    return { rank: 'Radiant', icon: TrendingUp, progress: 100, next: 10000 };
  };

  const rankInfo = getRankInfo(profile?.points || 0);

  return (
    <div className="space-y-8">
      <header className="space-y-8">
        <div className="relative h-64 rounded-[3rem] overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2000" 
            alt="Healthy Lifestyle" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent p-12 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h1 className="font-display text-5xl text-white">
                Welcome back, <span className="italic">{user.displayName?.split(' ')[0]}</span>.
              </h1>
              <p className="text-white/80 max-w-lg">Your body is your temple. Here's how you're nurturing it today.</p>
            </motion.div>
          </div>
        </div>

        <div className="flex justify-between items-end px-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink/30">Your Statistics</span>
            <h2 className="text-2xl font-bold italic">Healthy Overview</h2>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex -space-x-4">
              {meals.slice(0, 3).map((m, i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-primary/10 overflow-hidden shadow-sm">
                  {m.imageUrl ? (
                    <img src={m.imageUrl} alt="Meal" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/40">
                      <Utensils size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-[2.5rem] p-8 bg-primary text-white shadow-2xl shadow-primary/30 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <rankInfo.icon size={120} />
          </div>
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Star size={24} />
              </div>
              <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Rank: {rankInfo.rank}
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Lumina Points</div>
                <div className="text-6xl font-display italic font-bold">{profile?.points || 0}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <span>Progress to Next Rank</span>
                  <span>{Math.round(rankInfo.progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${rankInfo.progress}%` }}
                    className="h-full bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 bg-white border-ink/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-accent/20 text-accent rounded-2xl">
              <Activity size={24} />
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${bmiStatus.color}`}>
              {bmiStatus.label}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Body Mass Index</div>
            <div className="text-5xl font-display italic font-bold">{bmi}</div>
            <div className="text-xs font-medium text-ink/40">Based on {profile?.height}cm / {profile?.weight}kg</div>
          </div>
        </div>

        <div className="glass-card p-8 bg-white border-ink/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-400/10 text-blue-500 rounded-2xl">
              <Droplet size={24} />
            </div>
            <div className="h-2 w-12 bg-warm rounded-full overflow-hidden">
               <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, ((waterLog?.amount || 0) / 8) * 100)}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Water Consumed</div>
            <div className="text-5xl font-display italic font-bold">
              {waterLog ? waterLog.amount : '0'}
              <span className="text-sm font-sans not-italic text-ink/20 ml-2">/ 8</span>
            </div>
            <div className="text-xs font-medium text-ink/40">Glasses today</div>
          </div>
        </div>

        <div className="glass-card p-8 bg-white border-ink/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Health Score</div>
            <div className="text-5xl font-display italic font-bold">{avgScore}</div>
            <div className="text-xs font-medium text-ink/40">Meal average</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Behavioral Insights Section */}
        <section className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="text-primary" />
              <h2 className="text-2xl font-bold italic">Smart Patterns</h2>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink/40 bg-warm px-3 py-1 rounded-full">
              Experimental AI Beta
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card p-8 bg-white border-ink/5">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40 mb-4">Mood Correlation</h3>
              <div className="space-y-4">
                {meals.some(m => m.mood) ? (
                  <p className="text-sm italic text-ink/60">
                    Lumina noticed you tend to eat <span className="text-primary font-bold">higher calorie meals</span> when you're feeling <span className="text-accent font-bold">Stressed</span>.
                  </p>
                ) : (
                  <p className="text-sm text-ink/20">Log moods with your meals to unlock emotional eating analysis.</p>
                )}
              </div>
            </div>

            <div className="glass-card p-8 bg-white border-ink/5">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40 mb-4">Prime Environment</h3>
              <div className="space-y-4">
                {meals.some(m => m.location) ? (
                  <p className="text-sm italic text-ink/60">
                    Your highest health score meals happen at <span className="text-primary font-bold">Home</span>. Busy days at the <span className="text-accent font-bold">Office</span> lead to skipping greens.
                  </p>
                ) : (
                  <p className="text-sm text-ink/20">Log your location to track how your environment affects your choices.</p>
                )}
              </div>
            </div>

            <div className="glass-card p-8 bg-white border-ink/5">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40 mb-4">Reward Path</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-ink/40">Healthy Streak</span>
                  <span className="text-xs font-bold text-emerald-500">+40 pts</span>
                </div>
                <div className="h-1 bg-warm rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-3/4" />
                </div>
                <p className="text-[10px] text-ink/30 italic">3 more consistent meals until Pathfinder rank.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Insights Section */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-primary" />
            <h2 className="text-2xl font-bold italic">AI Insights</h2>
            {loadingInsights && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={16} className="text-ink/20" /></motion.div>}
          </div>

          <div className="glass-card p-8 bg-primary/[0.03] border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] -rotate-12 translate-x-8 -translate-y-8">
              <Sparkles size={200} />
            </div>
            
            <div className="prose prose-ink max-w-none prose-sm sm:prose-base relative z-10">
              {insights ? (
                <div className="markdown-body text-ink/80 leading-relaxed italic">
                  <ReactMarkdown>{insights}</ReactMarkdown>
                </div>
              ) : meals.length > 0 ? (
                <p className="text-ink/40 italic">Lumina is gathering its thoughts...</p>
              ) : (
                <p className="text-ink/40 italic">Log some meals to unlock personalized AI insights.</p>
              )}
            </div>

            {insights && (
              <button 
                onClick={generateInsights}
                className="mt-6 text-xs font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-all flex items-center gap-2"
              >
                Refresh Insights <ChevronRight size={14} />
              </button>
            )}
          </div>
        </section>

        {/* History Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <History className="text-ink/60" />
            <h2 className="text-2xl font-bold italic">Recent Activity</h2>
          </div>

          <div className="space-y-4">
            {meals.length === 0 ? (
              <div className="text-center py-12 text-ink/30 italic">No meals logged yet</div>
            ) : (
              meals.map((meal) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={meal.id} 
                  className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm group hover:shadow-md transition-all border border-ink/[0.02]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-warm overflow-hidden flex-shrink-0">
                    {meal.imageUrl ? (
                      <img src={meal.imageUrl} alt={meal.description} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink/20 italic text-[10px] text-center p-2 uppercase font-bold tracking-tighter">
                        Log
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-ink/90 truncate capitalize">{meal.description}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-warm px-2 py-0.5 rounded-full text-ink/40 font-bold uppercase tracking-widest">{meal.calories} kcal</span>
                      {meal.mood && (
                        <span className="text-[10px] text-primary font-bold italic">{meal.mood}</span>
                      )}
                      {meal.location && (
                        <span className="text-[10px] text-accent font-bold">@ {meal.location}</span>
                      )}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${meal.healthScore >= 7 ? 'bg-green-400' : meal.healthScore >= 4 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
