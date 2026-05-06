import React, { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { 
  Settings, 
  Target, 
  UtensilsCrossed, 
  LogOut, 
  Camera, 
  ChevronRight,
  ShieldCheck,
  Heart,
  Star
} from 'lucide-react';

interface ProfileViewProps {
  user: User;
}

export default function ProfileView({ user }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.uid]);

  const toggleGoal = async (goal: string) => {
    if (!profile) return;
    const newGoals = profile.goals.includes(goal)
      ? profile.goals.filter(g => g !== goal)
      : [...profile.goals, goal];
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { goals: newGoals });
      setProfile({ ...profile, goals: newGoals });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const goals = ["Weight Management", "Muscle Gain", "Better Energy", "Mindful Eating", "Clear Skin", "Longevity"];

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <header className="flex flex-col items-center text-center space-y-4">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-primary/10">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary/40">
                <Settings size={48} />
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg text-primary hover:scale-110 transition-all">
            <Camera size={18} />
          </button>
        </div>
        <div>
          <h1 className="font-display text-4xl italic">{user.displayName}</h1>
          <p className="text-ink/40 font-medium">{user.email}</p>
        </div>
        
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Star size={14} /> {profile?.points || 0} Points
          </div>
          <div className="px-4 py-2 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            Level {profile?.level || 1}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Goals Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Target className="text-primary" />
            <h2 className="text-2xl font-bold italic">Your Goals</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {goals.map(goal => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border ${
                  profile?.goals.includes(goal)
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-white text-ink/60 border-ink/5 hover:border-primary/20'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </section>

        {/* Dietary Preferences */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="text-primary" />
            <h2 className="text-2xl font-bold italic">Preferences</h2>
          </div>
          <div className="glass-card p-4 space-y-1">
            {["Plant Based", "Gluten Free", "Dairy Free", "Low Carb"].map(pref => (
              <div key={pref} className="flex items-center justify-between p-4 rounded-2xl hover:bg-warm/50 transition-all cursor-pointer">
                <span className="font-bold">{pref}</span>
                <div className="w-12 h-6 bg-ink/10 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* App Settings */}
        <section className="space-y-6 pt-6">
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-6 bg-white rounded-3xl group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warm rounded-2xl group-hover:bg-primary/10 transition-all">
                  <ShieldCheck size={20} className="text-primary/60" />
                </div>
                <span className="font-bold">Privacy & Security</span>
              </div>
              <ChevronRight size={20} className="text-ink/20" />
            </button>
            <button className="w-full flex items-center justify-between p-6 bg-white rounded-3xl group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warm rounded-2xl group-hover:bg-red-50 transition-all">
                  <Heart size={20} className="text-red-400" />
                </div>
                <span className="font-bold">Health Data Integration</span>
              </div>
              <ChevronRight size={20} className="text-ink/20" />
            </button>
          </div>

          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-3 p-6 text-red-500 font-bold hover:bg-red-50 rounded-3xl transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </section>
      </div>

      <footer className="text-center pb-8">
        <p className="text-[10px] uppercase tracking-widest font-bold text-ink/20">Lumina Health v1.0.0</p>
      </footer>
    </div>
  );
}
