/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * NAME TELLER - Modern Android-Style Web App
 * 
 * Features:
 * - Futuristic Glassmorphism UI (Tailwind CSS)
 * - Smooth Animations (Motion)
 * - Text-to-Speech (Web Speech API)
 * - Local Storage Persistence
 * - Responsive Mobile-First Design
 * 
 * To convert to a native Android APK:
 * 1. Initialize Capacitor: `npx cap init`
 * 2. Add Android platform: `npx cap add android`
 * 3. Build the web app: `npm run build`
 * 4. Sync code: `npx cap sync`
 * 5. Open in Android Studio and Build APK.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Sparkles, Volume2, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';

// --- Types ---
type AppState = 'welcome' | 'input' | 'result';

export default function App() {
  const [state, setState] = useState<AppState>('welcome');
  const [name, setName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- Initialization & Local Storage ---
  useEffect(() => {
    const savedName = localStorage.getItem('name_teller_last_name');
    if (savedName) {
      setName(savedName);
    }

    // Auto-advance from welcome screen after 2 seconds
    const timer = setTimeout(() => {
      setState('input');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // --- Voice Output ---
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // --- Handlers ---
  const handleTellMeMyName = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      triggerHaptic();
      return;
    }

    setError('');
    setSubmittedName(name.trim());
    localStorage.setItem('name_teller_last_name', name.trim());
    setState('result');
    triggerHaptic();
    
    // Slight delay for voice to feel natural with animation
    setTimeout(() => {
      speak(`Hello, your name is ${name.trim()}`);
    }, 500);
  };

  const handleReset = () => {
    setState('input');
    triggerHaptic();
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // --- Animation Variants ---
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
      <AnimatePresence mode="wait">
        
        {/* --- Welcome / Splash Screen --- */}
        {state === 'welcome' && (
          <motion.div
            key="welcome"
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 glass rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/20"
              >
                <Smartphone className="w-12 h-12 text-indigo-400" />
              </motion.div>
              <motion.div
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-purple-400" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Name Teller
              </h1>
              <p className="mt-2 text-zinc-400 font-light tracking-wide uppercase text-xs">
                Futuristic Personal Identity
              </p>
            </div>
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full opacity-50" />
          </motion.div>
        )}

        {/* --- Input Screen --- */}
        {state === 'input' && (
          <motion.div
            key="input"
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="w-full max-w-md h-full flex flex-col space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold">Welcome Back</h2>
              <p className="text-zinc-400">Discover your identity in style.</p>
            </div>

            <div className="glass rounded-3xl p-8 space-y-6 shadow-xl shadow-black/40">
              <div className="space-y-4">
                <label htmlFor="name-input" className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
                  Enter Your Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className={`w-5 h-5 transition-colors ${error ? 'text-rose-500' : 'text-indigo-400'}`} />
                  </div>
                  <input
                    id="name-input"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Your name here..."
                    className={`w-full bg-white/5 border-2 ${error ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10 focus:border-indigo-500/50'} rounded-2xl py-4 pl-12 pr-4 outline-none transition-all duration-300 font-medium placeholder:text-zinc-600`}
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mt-2 text-rose-500 text-sm font-medium"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTellMeMyName}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all duration-300"
              >
                <span>Tell Me My Name</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Hint for return users */}
            {localStorage.getItem('name_teller_last_name') && (
              <p className="text-center text-xs text-zinc-500">
                Found your previous name automatically.
              </p>
            )}
          </motion.div>
        )}

        {/* --- Result Screen --- */}
        {state === 'result' && (
          <motion.div
            key="result"
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="w-full max-w-md space-y-8"
          >
            <div className="flex flex-col items-center space-y-6">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl font-display font-bold shadow-2xl shadow-indigo-500/40 border-4 border-white/10"
              >
                {submittedName.charAt(0).toUpperCase()}
              </motion.div>

              <div className="text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-zinc-500 uppercase tracking-[0.3em] text-xs font-semibold">Discovery Complete</p>
                  <h2 className="text-4xl font-display font-bold mt-2">
                    Your name is
                  </h2>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="px-8 py-4 glass rounded-3xl inline-block"
                >
                  <span className="text-5xl font-display font-black bg-gradient-to-r from-indigo-400 via-white to-purple-400 bg-clip-text text-transparent">
                    {submittedName}
                  </span>
                </motion.div>
              </div>

              <div className="flex flex-col w-full space-y-4 pt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => speak(`Hello, your name is ${submittedName}`)}
                  disabled={isSpeaking}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-2 border-2 transition-all duration-300 ${isSpeaking ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
                >
                  <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  <span>{isSpeaking ? 'Speaking...' : 'Play Voice'}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="w-full bg-zinc-100 text-zinc-900 font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-white transition-all duration-300"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Try Another</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Footer Decoration --- */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none opacity-20">
        <div className="w-32 h-1 bg-white rounded-full" />
      </div>
    </div>
  );
}
