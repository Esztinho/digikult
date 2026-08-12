'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const TOPIC_FILTERS = [
  { id: 'ALL', label: 'Összes kategória' },
  { id: 'PYTHON_ALAPOK', label: 'Python alapok' },
  { id: 'ALAP_ALGORITMUSOK', label: 'Alap algoritmusok' },
  { id: 'LISTÁK', label: 'Listák' },
  { id: 'FUGGVENYEK', label: 'Függvények' },
  { id: 'SZÖVEGKEZELÉS', label: 'Szövegkezelés' },
   { id: 'RENDEZÉS', label: 'Rendezés' },
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const getTaskType = (question: any): 'predict' | 'code' => {
  const rawTaskType = String(
    question?.task_type ?? question?.type ?? question?.question_type ?? ''
  ).toLowerCase()

  const isPredict =
    rawTaskType.includes('predict') ||
    rawTaskType.includes('output') ||
    Boolean(question?.expected_output ?? question?.expectedOutput)

  return isPredict ? 'predict' : 'code'
}

export default function HomePage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const [filter, setFilter] = useState<'all' | 'solved' | 'unsolved'>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('KÖZÉP') // Alapból a középszint
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL') 
  const [selectedTaskType, setSelectedTaskType] = useState<'ALL' | 'PREDICT' | 'CODE'>('ALL')

// 1. Kiszűrjük a feladatokat a kiválasztott szint alapján
const targetQuestions = selectedLevel === 'KÖZÉP' 
  ? questions.filter(q => q.level !== 'EMELT') // Középre nem kell az emelt
  : questions; // Emeltre kell az összes (közép, emelt)

// 2. Kiszámoljuk az összeset és a megoldottakat
const totalQuestions = targetQuestions.length;
const solvedCount = targetQuestions.filter(q => solvedIds.has(q.id)).length;

// 3. Százalék számítás
const progressPercentage = totalQuestions > 0 
  ? Math.round((solvedCount / totalQuestions) * 100) 
  : 0;

// 4. Dinamikus színek a progress barhoz, hogy passzoljon a gombjaidhoz!
const barColorClass = selectedLevel === 'KÖZÉP' 
  ? 'bg-blue-600 shadow-[0_0_12px_#2563eb]' 
  : 'bg-purple-600 shadow-[0_0_12px_#9333ea]';

const textColorClass = selectedLevel === 'KÖZÉP' 
  ? 'text-blue-500' 
  : 'text-purple-500';

  const [isTopicsOpen, setIsTopicsOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: qData } = await supabase.from('questions').select('*')
      setQuestions(qData || [])

      const { data: authData } = await supabase.auth.getUser()
      const currentUser = authData?.user
      setUser(currentUser)

      if (currentUser) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('question_id')
          .eq('user_id', currentUser.id)
        
        if (progressData) {
          const ids = new Set(progressData.map(p => p.question_id))
          setSolvedIds(ids)
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <div className="p-8 text-center mt-20 text-muted-foreground">Loading tasks...</div>
  }

  const filteredQuestions = questions.filter(q => {
    const matchesLevel = q.level === selectedLevel
    const matchesTopic = selectedTopic === 'ALL' || q.topic === selectedTopic
    const isPredictTask = getTaskType(q) === 'predict'
    const matchesTaskType =
      selectedTaskType === 'ALL' ||
      (selectedTaskType === 'PREDICT' && isPredictTask) ||
      (selectedTaskType === 'CODE' && !isPredictTask)

    const isSolved = solvedIds.has(q.id)
    const matchesStatus = 
      filter === 'all' || 
      (filter === 'solved' && isSolved) || 
      (filter === 'unsolved' && !isSolved)

    return matchesLevel && matchesTopic && matchesTaskType && matchesStatus
  }).sort((a, b) => {
    // 1. Lekérdezzük mindkét feladat megoldottsági állapotát
    const isSolvedA = solvedIds.has(a.id);
    const isSolvedB = solvedIds.has(b.id);

    // 2. Ha A megoldott, de B nem, akkor A kerüljön előre (return -1)
    if (isSolvedA && !isSolvedB) return -1;
    // Ha B megoldott, de A nem, akkor B kerüljön előre (return 1)
    if (!isSolvedA && isSolvedB) return 1;

    // 3. Ha ugyanabban a státuszban vannak (mindkettő megoldott VAGY mindkettő megoldatlan), 
    // akkor rendezzük őket az eredeti, időrendi sorrendbe (created_at szerint)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* FEJLÉC: Cím és Login adatok */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Python Tasks</h1>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-green-500 bg-green-950/30 px-3 py-1 rounded-full border border-green-900">
              Logged in as: {user.email}
            </span>
          </div>
        ) : (
          <Link href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Login / Register
          </Link>
        )}
      </div>

      {/* SZINT VÁLASZTÓ GOMBOK (Közép / Emelt) */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button 
          onClick={() => setSelectedLevel('KÖZÉP')}
          className={`px-5 py-2 rounded-xl font-bold transition-all ${
            selectedLevel === 'KÖZÉP' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Közép szint
        </button>
        <button 
          onClick={() => setSelectedLevel('EMELT')}
          className={`px-5 py-2 rounded-xl font-bold transition-all ${
            selectedLevel === 'EMELT' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Emelt szint
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {['ALL', 'PREDICT', 'CODE'].map((type) => {
          const isActive = selectedTaskType === type
          const label =
            type === 'ALL' ? 'Összes típus' : type === 'PREDICT' ? 'Elemzés' : 'Kódolás'

          return (
            <button
              key={type}
              onClick={() => setSelectedTaskType(type as 'ALL' | 'PREDICT' | 'CODE')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

     {/* --- HALADÁSJELZŐ (PROGRESS BAR) --- */}
<div className="w-full max-w-4xl mx-auto mb-10 p-4 bg-black/40 border border-green-500/20 rounded-lg shadow-lg">
  
  {/* Szöveges rész */}
  <div className="flex justify-between items-end mb-3 font-mono">
    <span className="text-green-500 text-sm tracking-wider uppercase animate-pulse">
      Haladás: {selectedLevel === 'KÖZÉP' ? 'Közép szint' : 'Emelt szint'}
    </span>
    <span className="text-green-400 font-bold text-lg">
      {solvedCount} / {totalQuestions} <span className="text-green-500/60 text-sm ml-1">({progressPercentage}%)</span>
    </span>
  </div>

  {/* A tényleges csík (Külső sötét tartály) */}
  <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-green-900/50">
    
    {/* A kitöltődő neon-zöld rész */}
    <div
      className="h-full bg-green-500 transition-all duration-1000 ease-out shadow-[0_0_12px_#00ff00]"
      style={{ width: `${progressPercentage}%` }}
    ></div>
    
  </div>
</div>
{/* --- HALADÁSJELZŐ VÉGE --- */}

      <div className="w-full mb-8 space-y-6">
  
  {/* VEZÉRLŐPULT (Szűrők és Témakörök) */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 p-2 rounded-xl border border-zinc-800">
    
    {/* BAL OLDAL: Lenyitható Témakörök (Tartalomjegyzék) */}
    <div className="relative w-full md:w-64">
      <button 
        onClick={() => setIsTopicsOpen(!isTopicsOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
      >
        <span className="truncate">
          Témakör: {TOPIC_FILTERS.find(t => t.id === selectedTopic)?.label || 'Összes feladat'}
        </span>
        <svg 
          className={`w-4 h-4 ml-2 text-zinc-400 transition-transform duration-200 ${isTopicsOpen ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Lenyíló panel */}
      {isTopicsOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-1 flex flex-col gap-1">
            {TOPIC_FILTERS.map((topic) => (
              <button 
                key={topic.id}
                onClick={() => {
                  setSelectedTopic(topic.id);
                  setIsTopicsOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedTopic === topic.id 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* JOBB OLDAL: Állapot szűrők (Szegmentált gombok) */}
    {user && (
      <div className="flex bg-zinc-950/50 p-1 rounded-lg border border-zinc-800/50">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            filter === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Összes
        </button>
        <button 
          onClick={() => setFilter('unsolved')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            filter === 'unsolved' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Megoldandó
        </button>
        <button 
          onClick={() => setFilter('solved')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            filter === 'solved' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Megoldva <span className={filter === 'solved' ? 'text-emerald-400' : 'text-zinc-600'}>✓</span>
        </button>
      </div>
    )}
  </div>
</div>

{/* FELADAT KÁRTYÁK GRID */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
  {filteredQuestions.map((q) => {
    const isSolved = solvedIds.has(q.id);
    const taskType = getTaskType(q)
    const taskTypeLabel = taskType === 'predict' ? 'Predict' : 'Coding'

          return (
            <Link href={`/feladat/${q.id}`} key={q.id}>
              <div className={`p-6 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-lg h-full flex flex-col relative ${
  isSolved ? 'bg-zinc-900/50 border-green-900/50 hover:border-green-700/80' : 'bg-zinc-900/40 border-zinc-800 hover:border-primary/50'
}`}>
                
                {isSolved && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md border-2 border-zinc-950">
                    ✓
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider">
                    {q.topic}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    taskType === 'predict'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {taskTypeLabel}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold mb-2">{q.title}</h2>
                <p className="text-muted-foreground line-clamp-3 mb-4 flex-1">
                  {q.description}
                </p>
                
                <div className={`text-sm font-medium mt-auto ${isSolved ? 'text-green-500' : 'text-primary'}`}>
                  {isSolved ? 'Solved! Try again? →' : 'Open task →'}
                </div>
              </div>
            </Link>
          )
        })}
        
        {filteredQuestions.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
            Nothing to see here yet!
          </div>
        )}
      </div>
    </div>
  )
}