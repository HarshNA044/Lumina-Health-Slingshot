import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { Scale, Ruler, ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingProps {
  user: UserProfile;
  onComplete: () => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const availableGoals = ['Lose Weight', 'Build Muscle', 'Clean Eating', 'Better Energy', 'Sleep Better'];

  const toggleGoal = (goal: string) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        weight: parseFloat(weight),
        height: parseFloat(height),
        goals: goals,
        points: 150, // Bonus for full profile
        level: 1,
        updatedAt: serverTimestamp(),
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-warm/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-12 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={32} />
          </div>
          <h2 className="text-3xl font-display italic font-bold">Welcome to Lumina</h2>
          <p className="text-ink/60">Let's personalize your health journey. We need a few basics.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink/40 ml-2 flex items-center gap-2">
                <Scale size={14} /> Current Weight (kg)
              </label>
              <input 
                required
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
                className="w-full bg-warm/50 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-ink/40 ml-2 flex items-center gap-2">
                <Ruler size={14} /> Height (cm)
              </label>
              <input 
                required
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="0"
                className="w-full bg-warm/50 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-ink/40 ml-2">
                Your Health Ambitions
              </label>
              <div className="flex flex-wrap gap-2">
                {availableGoals.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      goals.includes(goal) 
                        ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/20' 
                        : 'bg-warm text-ink/40 hover:bg-ink/5'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full btn-primary py-5 text-lg group"
          >
            {loading ? 'Setting up...' : 'Get Started'}
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
