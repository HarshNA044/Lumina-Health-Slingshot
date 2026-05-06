import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Habit, HabitLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, MoreVertical, Trash2, Calendar, Target, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

interface HabitTrackerProps {
  user: User;
}

export default function HabitTracker({ user }: HabitTrackerProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'habits'));

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const logsQuery = query(collection(db, 'habitLogs'), where('userId', '==', user.uid), where('date', '==', todayStr));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HabitLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'habitLogs'));

    return () => {
      unsubscribeHabits();
      unsubscribeLogs();
    };
  }, [user.uid]);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await addDoc(collection(db, 'habits'), {
        userId: user.uid,
        title: newTitle,
        frequency: 'daily',
        active: true,
        createdAt: serverTimestamp(),
      });
      setNewTitle('');
      setShowAdd(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'habits');
    }
  };

  const toggleHabit = async (habitId: string) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const existingLog = logs.find(l => l.habitId === habitId);

    try {
      if (existingLog) {
        await updateDoc(doc(db, 'habitLogs', existingLog.id!), {
          completed: !existingLog.completed,
          timestamp: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'habitLogs'), {
          userId: user.uid,
          habitId,
          date: todayStr,
          completed: true,
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'habitLogs');
    }
  };

  const deleteHabit = async (id: string) => {
    if (confirm('Delete this habit?')) {
      try {
        await deleteDoc(doc(db, 'habits', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `habits/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="font-display text-4xl italic">Healthy Habits</h1>
          <p className="text-ink/60">Small steps lead to big changes. Track your daily routine.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="p-4 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <PlusCircle size={24} />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddHabit}
            className="glass-card p-8 flex gap-4 overflow-hidden"
          >
            <input 
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter habit (e.g., Drink 2L water, Morning stretch...)"
              className="flex-1 bg-warm/50 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <button type="submit" className="btn-primary">Add Habit</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-ink/40">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-ink/40 border-dashed">
            <Target className="mx-auto mb-4 opacity-20" size={48} />
            <p>No habits tracked yet. What would you like to build?</p>
          </div>
        ) : (
          habits.map(habit => {
            const isCompleted = logs.find(l => l.habitId === habit.id)?.completed;
            return (
              <motion.div
                layout
                key={habit.id}
                className={`glass-card p-6 flex items-center justify-between transition-all group ${
                  isCompleted ? 'bg-primary/5 border-primary/20' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${
                      isCompleted 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                        : 'border-ink/10 hover:border-primary/40 text-transparent'
                    }`}
                  >
                    <Check size={24} className={isCompleted ? 'opacity-100' : 'opacity-0'} />
                  </button>
                  <div className="space-y-1">
                    <h3 className={`text-lg font-bold transition-all ${isCompleted ? 'text-primary' : ''}`}>
                      {habit.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-ink/40 uppercase tracking-widest font-bold">
                      <Calendar size={12} />
                      Daily Refill
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => deleteHabit(habit.id)}
                  className="p-2 text-ink/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {!loading && habits.length > 0 && (
        <div className="p-6 bg-white rounded-3xl border border-ink/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/20 text-accent rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <p className="font-bold">{format(new Date(), 'EEEE, MMMM do')}</p>
              <p className="text-xs text-ink/40 uppercase tracking-wider font-bold">Today's Focus</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display italic font-bold">
              {logs.filter(l => l.completed).length} / {habits.length}
            </p>
            <p className="text-xs text-ink/40 uppercase tracking-wider font-bold">Completed</p>
          </div>
        </div>
      )}
    </div>
  );
}
