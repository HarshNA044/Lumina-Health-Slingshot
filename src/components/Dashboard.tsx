import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MealLog, Habit } from '../types';
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
  Utensils
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
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

    return () => {
      unsubscribeMeals();
      unsubscribeHabits();
    };
  }, [user.uid]);

  const generateInsights = async () => {
    if (meals.length === 0) return;
    setLoadingInsights(true);
    try {
      const res = await getHealthInsights(meals, habits);
      setInsights(res);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (meals.length > 0 && !insights) {
      generateInsights();
    }
  }, [meals]);

  const avgScore = meals.length > 0 
    ? (meals.reduce((acc, m) => acc + m.healthScore, 0) / meals.length).toFixed(1)
    : '0';

  const totalCalories = meals.reduce((acc, m) => acc + (m.calories || 0), 0);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="font-display text-5xl">
            Welcome back, <span className="italic text-primary">{user.displayName?.split(' ')[0]}</span>.
          </h1>
          <p className="text-ink/60">Your body is your temple. Here's how you're nurturing it today.</p>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <div className="flex -space-x-4">
            {meals.slice(0, 3).map((m, i) => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-warm bg-primary/10 overflow-hidden shadow-sm">
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
          <span className="text-xs font-bold uppercase tracking-widest text-ink/30 mt-2">Recent Logs</span>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 bg-primary text-white shadow-xl shadow-primary/20">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Star size={24} />
            </div>
            <TrendingUp size={20} className="text-white/40" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Lumina Score</div>
            <div className="text-5xl font-display italic font-bold">{avgScore}</div>
            <div className="text-xs font-medium text-white/70">Average across recent meals</div>
          </div>
        </div>

        <div className="glass-card p-8 bg-white border-ink/5">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-accent/20 text-accent rounded-2xl">
              <Flame size={24} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Daily Intake</div>
            <div className="text-5xl font-display italic font-bold">{totalCalories}</div>
            <div className="text-xs font-medium text-ink/40">Calories today</div>
          </div>
        </div>

        <div className="glass-card p-8 bg-white border-ink/5">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
              <Activity size={24} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Habit Streak</div>
            <div className="text-5xl font-display italic font-bold">{habits.length > 0 ? "3" : "0"}</div>
            <div className="text-xs font-medium text-ink/40">Consistent days</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <p className="text-xs text-ink/40 font-medium">
                      {meal.calories} kcal • {meal.healthScore}/10 Score
                    </p>
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
