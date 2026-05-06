import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { WeightLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface WeightTrackerProps {
  user: User;
}

export default function WeightTracker({ user }: WeightTrackerProps) {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'weightLogs'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWeightLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightLog)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'weightLogs'));

    return () => unsubscribe();
  }, [user.uid]);

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(Number(newWeight))) return;

    try {
      await addDoc(collection(db, 'weightLogs'), {
        userId: user.uid,
        weight: Number(newWeight),
        unit,
        date: format(new Date(), 'yyyy-MM-dd'),
        timestamp: serverTimestamp(),
      });
      setNewWeight('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'weightLogs');
    }
  };

  const deleteLog = async (id: string) => {
    if (confirm('Delete this measurement?')) {
      try {
        await deleteDoc(doc(db, 'weightLogs', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `weightLogs/${id}`);
      }
    }
  };

  const diff = weightLogs.length >= 2 
    ? weightLogs[0].weight - weightLogs[1].weight
    : 0;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl italic">Body Weight</h1>
        <p className="text-ink/60">Monitor your trends and stay on track with your goals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="glass-card p-8 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-wider text-ink/40">
                Log New Weight
              </label>
              <form onSubmit={handleAddWeight} className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="70.5"
                    className="flex-1 bg-warm/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="bg-warm/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
                <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
                  <Plus size={20} />
                  Log Weight
                </button>
              </form>
            </div>
          </section>

          {weightLogs.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 bg-primary text-white"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Trend (vs Last)</div>
              <div className="flex items-center gap-3">
                {diff > 0 ? (
                  <TrendingUp className="text-red-300" size={32} />
                ) : diff < 0 ? (
                  <TrendingDown className="text-accent" size={32} />
                ) : (
                  <Minus className="text-white/40" size={32} />
                )}
                <div className="text-4xl font-display italic font-bold">
                  {diff === 0 ? 'Stable' : `${Math.abs(diff).toFixed(1)} ${unit}`}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <Scale className="text-ink/60" />
            <h2 className="text-2xl font-bold italic">History</h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-ink/40">Loading history...</div>
            ) : weightLogs.length === 0 ? (
              <div className="glass-card p-12 text-center text-ink/30 border-dashed">
                <p>No weigh-ins recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-white rounded-3xl border border-ink/5">
                {weightLogs.map((log) => (
                  <motion.div
                    layout
                    key={log.id}
                    className="flex items-center justify-between p-6 border-b border-ink/5 last:border-0 group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="text-2xl font-display font-bold italic w-24">
                        {log.weight} <span className="text-xs font-sans not-italic text-ink/40">{log.unit}</span>
                      </div>
                      <div className="text-sm font-bold text-ink/60">
                        {format(new Date(log.date), 'MMM do, yyyy')}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteLog(log.id!)}
                      className="p-2 text-ink/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
