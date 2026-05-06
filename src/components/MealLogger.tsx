import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { analyzeMeal, MealAnalysis } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image as ImageIcon, Send, Sparkles, Loader2, CheckCircle2, Utensils } from 'lucide-react';

interface MealLoggerProps {
  user: User;
}

export default function MealLogger({ user }: MealLoggerProps) {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MealAnalysis | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && !image) return;

    setAnalyzing(true);
    setResult(null);
    setStatus('idle');

    try {
      const res = await analyzeMeal(description, image || undefined);
      setResult(res);
      setAnalyzing(false);
    } catch (error) {
      console.error('Error analyzing meal:', error);
      setStatus('error');
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await addDoc(collection(db, 'meals'), {
        userId: user.uid,
        description: description || 'Visual meal log',
        imageUrl: image,
        calories: result.calories,
        macronutrients: result.macronutrients,
        healthScore: result.healthScore,
        analysis: result.analysis,
        timestamp: serverTimestamp(),
      });
      setStatus('success');
      // Reset after success
      setTimeout(() => {
        setResult(null);
        setDescription('');
        setImage(null);
        setStatus('idle');
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'meals');
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl italic">Log a Meal</h1>
        <p className="text-ink/60">Describe what you're eating or snap a photo for AI analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <section className="glass-card p-8 space-y-6">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-wider text-ink/40">
                What's on your plate?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Grilled salmon with quinoa and roasted asparagus..."
                className="w-full bg-warm/50 border-none rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-wider text-ink/40">
                Add an image (Optional)
              </label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer group">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-ink/10 rounded-2xl p-6 group-hover:border-primary/30 transition-all bg-warm/20">
                    <Camera className="text-ink/30 group-hover:text-primary transition-all mb-2" size={32} />
                    <span className="text-xs font-medium text-ink/40 group-hover:text-ink/60 underline decoration-primary/20 decoration-2 underline-offset-4">
                      Upload photo
                    </span>
                  </div>
                </label>
              </div>
              {image && (
                <div className="relative rounded-2xl overflow-hidden group">
                  <img src={image} alt="Preview" className="w-full h-48 object-cover" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <button
              disabled={analyzing || (!description && !image)}
              className="w-full btn-primary flex items-center justify-center gap-3 disabled:scale-100"
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing with Lumina...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Analyze Meal
                </>
              )}
            </button>
          </form>
        </section>

        {/* Result Section */}
        <section className="relative">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 border-primary/20 bg-primary/[0.02]"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold italic">Lumina's Analysis</h2>
                    <p className="text-sm text-ink/60">Estimates based on your input</p>
                  </div>
                  <div className="bg-primary/10 px-4 py-2 rounded-2xl">
                    <span className="text-primary font-bold text-lg">{result.healthScore}/10</span>
                    <span className="text-xs block text-primary/60 font-medium">Score</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 text-center">
                  <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <div className="text-2xl font-display font-bold">{result.calories}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-ink/40">Calories</div>
                  </div>
                  <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <div className="text-2xl font-display font-bold">{result.macronutrients.protein}g</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-ink/40">Protein</div>
                  </div>
                  <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <div className="text-2xl font-display font-bold">{result.macronutrients.carbs}g</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-ink/40">Carbs</div>
                  </div>
                  <div className="bg-white p-4 rounded-3xl shadow-sm">
                    <div className="text-2xl font-display font-bold">{result.macronutrients.fat}g</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-ink/40">Fat</div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-ink/40">Insights</h3>
                  <p className="text-ink/80 leading-relaxed italic border-l-2 border-primary/20 pl-4">
                    "{result.analysis}"
                  </p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={status === 'success'}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${
                    status === 'success' ? 'bg-green-500 text-white' : 'bg-ink text-white hover:opacity-90'
                  }`}
                >
                  {status === 'success' ? (
                    <>
                      <CheckCircle2 size={24} />
                      Meal Saved
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Save to Food Log
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 flex flex-col items-center justify-center text-center text-ink/30 h-full border-dashed"
              >
                <div className="p-6 bg-warm rounded-full mb-4">
                  <Utensils size={48} />
                </div>
                <h3 className="text-xl font-bold italic text-ink/60 mb-2">Ready to analyze</h3>
                <p>Fill out the form to see nutritional estimates and Lumina's feedback.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
