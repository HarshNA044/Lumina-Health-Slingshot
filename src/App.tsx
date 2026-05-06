/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Utensils, 
  CheckCircle2, 
  User as UserIcon,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import HabitTracker from './components/HabitTracker';
import ProfileView from './components/ProfileView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'habits' | 'profile'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user doc exists
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            goals: [],
            dietaryPreferences: [],
            createdAt: serverTimestamp(),
          });
        }
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-primary"
        >
          <Sparkles size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-warm text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-8"
        >
          <div className="space-y-4">
            <h1 className="font-display text-6xl text-primary italic">Lumina</h1>
            <p className="text-lg text-ink/70">
              Your AI-powered companion for a healthier, more intentional life through smart nutrition.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-[2rem] shadow-xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold italic">Start your journey</h2>
              <p className="text-ink/60">Log meals, track habits, and get AI insights.</p>
            </div>
            <button 
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
            >
              Sign in with Google
              <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm pb-24 md:pb-0 md:pl-20">
      {/* Sidebar / Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-ink/5 z-50 md:top-0 md:bottom-0 md:right-auto md:w-20 md:border-t-0 md:border-r flex md:flex-col items-center justify-around md:justify-center gap-8 py-4 md:py-8">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'meals', icon: Utensils },
          { id: 'habits', icon: CheckCircle2 },
          { id: 'profile', icon: UserIcon },
        ].map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`p-3 rounded-2xl transition-all ${
              activeTab === id 
                ? 'bg-primary text-white shadow-lg' 
                : 'text-ink/40 hover:text-ink/60 hover:bg-ink/5'
            }`}
          >
            <Icon size={24} />
          </button>
        ))}
        <button 
          onClick={handleSignOut}
          className="p-3 text-ink/40 hover:text-red-500 transition-all hidden md:block mt-auto"
        >
          <LogOut size={24} />
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard user={user} />}
            {activeTab === 'meals' && <MealLogger user={user} />}
            {activeTab === 'habits' && <HabitTracker user={user} />}
            {activeTab === 'profile' && <ProfileView user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
