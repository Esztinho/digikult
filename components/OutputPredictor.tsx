'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PredictorTask } from '../types';

export default function OutputPredictor({ task }: { task: PredictorTask }) {
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // A trim() eltávolítja a véletlen szóközöket a diák válaszának elejéről/végéről
    if (inputValue.trim() === task.expectedOutput) {
      setStatus('correct');
    } else {
      setStatus('incorrect');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-xl">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors"
        >
          <span aria-hidden="true">←</span>
          Vissza a feladatokhoz
        </Link>
      </div>
      
      {/* Fejléc */}
      <div className="mb-6">
        <span className="text-zinc-400 text-xs font-bold tracking-wider uppercase bg-zinc-800/50 px-3 py-1 rounded-full">
          {task.topic}
        </span>
        <h2 className="text-2xl font-bold mt-4 text-zinc-100">{task.title}</h2>
        <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
          {task.description}
        </p>
      </div>
      

      {/* Kódblokk (Terminál / Editor kinézet) */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden mb-6 shadow-inner">
        <div className="bg-zinc-900/80 px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="text-zinc-500 text-xs font-mono ml-2">main.py</span>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
            <code>{task.codeSnippet}</code>
          </pre>
        </div>
      </div>

      {/* Interakciós rész (Form) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="output" className="block text-sm font-medium text-zinc-300 mb-2">
            A konzol kimenete:
          </label>
          <div className="flex gap-3">
            <input
              id="output"
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setStatus('idle'); // Ha gépel, visszaváltjuk alapállapotra
              }}
              disabled={status === 'correct'}
              placeholder="Ide írd a kimenetet..."
              className={`flex-1 bg-zinc-950 border rounded-lg px-4 py-3 text-zinc-100 font-mono focus:outline-none focus:ring-2 transition-all ${
                status === 'incorrect' 
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                  : status === 'correct'
                  ? 'border-emerald-500/50 text-emerald-400'
                  : 'border-zinc-700 focus:border-primary focus:ring-primary/20'
              }`}
              autoComplete="off"
            />
            
            <button
              type="submit"
              disabled={status === 'correct' || inputValue.trim() === ''}
              className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                status === 'correct'
                  ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/50'
                  : 'bg-zinc-100 text-zinc-900 hover:bg-white active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {status === 'correct' ? 'Megoldva ✓' : 'Futtatás'}
            </button>
          </div>
        </div>

        {/* Visszajelzések (Hibás válasz / Segítség) */}
        {status === 'incorrect' && (
          <div className="text-red-400 text-sm font-medium flex items-center gap-2 animate-pulse">
            <span>⚠️</span> Hibás kimenet. Próbáld újra!
          </div>
        )}

        {/* Segítség gomb (csak ha van hint és hibázott) */}
        {task.hint && status === 'incorrect' && !showHint && (
          <button 
            type="button"
            onClick={() => setShowHint(true)}
            className="text-zinc-500 text-sm hover:text-zinc-300 underline decoration-zinc-700 underline-offset-4 transition-colors"
          >
            Segítség kérése
          </button>
        )}

        {/* Segítség szöveg */}
        {showHint && (
          <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300">
            💡 <span className="font-semibold">Tipp:</span> {task.hint}
          </div>
        )}

      </form>
    </div>
  );
}