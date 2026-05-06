import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { WaterLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, Plus, Minus, GlassWater, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface WaterTrackerProps {
  user: User;
}

export default function WaterTracker({ user }: WaterTrackerProps) {
  const [log, setLog] = useState<WaterLog | null>(null);
  const [loading, setLoading] = useState(true);
  const goal = 8; // Default goal: 8 glasses

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'waterLogs'),
      where('userId', '==', user.uid),
      where('date', '==', today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLog({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as WaterLog);
      } else {
        setLog(null);
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'waterLogs'));

    return () => unsubscribe();
  }, [user.uid]);

  const updateWater = async (increment: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      if (log) {
        const newAmount = Math.max(0, log.amount + increment);
        await updateDoc(doc(db, 'waterLogs', log.id!), {
          amount: newAmount,
          timestamp: serverTimestamp(),
        });
      } else if (increment > 0) {
        await addDoc(collection(db, 'waterLogs'), {
          userId: user.uid,
          amount: increment,
          date: today,
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'waterLogs');
    }
  };

  const amount = log ? log.amount : 0;
  const progress = Math.min(100, (amount / goal) * 100);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl italic">Hydration Tracker</h1>
        <p className="text-ink/60">Stay refreshed. Aim for 8 glasses of water a day.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Visualization */}
        <section className="glass-card p-12 flex flex-col items-center justify-center relative overflow-hidden h-[400px]">
          <div className="absolute inset-0 bg-blue-500/5" />
          
          <div className="relative w-48 h-64 border-4 border-primary/10 rounded-b-[4rem] rounded-t-xl overflow-hidden bg-white/50 mb-8">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${progress}%` }}
              className="absolute bottom-0 left-0 right-0 bg-blue-400/30 flex items-center justify-center overflow-hidden"
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="w-full h-2 bg-white/20 absolute top-0 animate-pulse" />
            </motion.div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10">
              <span className="text-5xl font-display font-bold italic text-primary">
                {amount}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary/40">Glasses</span>
            </div>
          </div>

          {amount >= goal && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 text-accent font-bold"
            >
              <Trophy size={20} />
              Daily Goal Reached!
            </motion.div>
          )}
        </section>

        {/* Controls */}
        <section className="space-y-8">
          <div className="glass-card p-10 space-y-8 text-center">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold italic">Log Water</h3>
              <p className="text-ink/40 text-sm">Tap to add or remove glass</p>
            </div>

            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={() => updateWater(-1)}
                className="w-16 h-16 rounded-full border-2 border-ink/5 flex items-center justify-center text-ink/20 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-90"
              >
                <Minus size={32} />
              </button>
              
              <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                <GlassWater size={48} />
              </div>

              <button 
                onClick={() => updateWater(1)}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-all active:scale-95"
              >
                <Plus size={32} />
              </button>
            </div>
            
            <div className="pt-4 flex flex-wrap justify-center gap-2">
               {[1, 2, 4].map(vol => (
                 <button
                  key={vol}
                  onClick={() => updateWater(vol)}
                  className="px-4 py-2 bg-warm rounded-xl text-xs font-bold text-ink/40 hover:bg-primary/10 hover:text-primary transition-all border border-ink/5"
                 >
                   + {vol} {vol === 1 ? 'Glass' : 'Glasses'}
                 </button>
               ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="glass-card p-6 bg-blue-500/5 border-blue-500/10 flex items-start gap-4">
            <div className="p-3 bg-white rounded-2xl text-blue-500 shadow-sm shrink-0">
               <Droplet size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-primary italic">Pro Tip</h4>
              <p className="text-sm text-ink/60 leading-relaxed">
                Drinking a glass of water right after waking up helps jumpstart your metabolism and hydration.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
