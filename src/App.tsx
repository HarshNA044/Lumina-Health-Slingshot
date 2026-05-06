/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Utensils, 
  CheckCircle2, 
  User as UserIcon,
  LogOut,
  Sparkles,
  ChevronRight,
  Scale,
  Droplets
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import HabitTracker from './components/HabitTracker';
import WeightTracker from './components/WeightTracker';
import WaterTracker from './components/WaterTracker';
import ProfileView from './components/ProfileView';
import Onboarding from './components/Onboarding';
import { UserProfile } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'habits' | 'weight' | 'water' | 'profile'>('dashboard');

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userRef = doc(db, 'users', authUser.uid);
        
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: authUser.uid,
              displayName: authUser.displayName,
              email: authUser.email,
              photoURL: authUser.photoURL,
              goals: [],
              dietaryPreferences: [],
              points: 0,
              level: 1,
              createdAt: serverTimestamp(),
            });
          }
        } catch (error) {
          console.error("Error ensuring user doc:", error);
        }

        unsubscribeProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request') {
        console.error('Error signing in:', error);
      }
    } finally {
      setIsSigningIn(false);
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
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {isSigningIn ? 'Opening Google...' : 'Sign in with Google'}
              {!isSigningIn && <ChevronRight size={20} />}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm pb-24 md:pb-0 md:pl-20">
      {profile && (!profile.weight || !profile.height) && (
        <Onboarding user={profile} onComplete={() => {}} />
      )}
      {/* Sidebar / Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-ink/5 z-50 md:top-0 md:bottom-0 md:right-auto md:w-20 md:border-t-0 md:border-r flex md:flex-col items-center justify-around md:justify-center gap-6 py-4 md:py-8 overflow-x-auto md:overflow-x-visible">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'meals', icon: Utensils },
          { id: 'habits', icon: CheckCircle2 },
          { id: 'water', icon: Droplets },
          { id: 'weight', icon: Scale },
          { id: 'profile', icon: UserIcon },
        ].map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`p-3 rounded-2xl transition-all shrink-0 ${
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
            {activeTab === 'dashboard' && <Dashboard user={user} profile={profile} />}
            {activeTab === 'meals' && <MealLogger user={user} />}
            {activeTab === 'habits' && <HabitTracker user={user} />}
            {activeTab === 'water' && <WaterTracker user={user} />}
            {activeTab === 'weight' && <WeightTracker user={user} />}
            {activeTab === 'profile' && <ProfileView user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
