'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HomePage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const [filter, setFilter] = useState<'all' | 'solved' | 'unsolved'>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('KÖZÉP') // Alapból a középszint
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL') 

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

    const isSolved = solvedIds.has(q.id)
    const matchesStatus = 
      filter === 'all' || 
      (filter === 'solved' && isSolved) || 
      (filter === 'unsolved' && !isSolved)

    return matchesLevel && matchesTopic && matchesStatus
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* 1. FEJLÉC: Cím és Login adatok */}
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

      {/* 2. SZINT VÁLASZTÓ GOMBOK (Közép / Emelt) */}
      <div className="flex gap-3 mb-4">
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

      {/* 3. KATEGÓRIA VÁLASZTÓ GOMBOK (Topic-ok) */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => setSelectedTopic('ALL')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedTopic === 'ALL' 
              ? 'bg-accent text-accent-foreground' 
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Összes kategória
        </button>
        <button 
          onClick={() => setSelectedTopic('PYTHON_ALAPOK')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedTopic === 'PYTHON_ALAPOK' 
              ? 'bg-accent text-accent-foreground' 
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Python alapok
        </button>
        <button 
          onClick={() => setSelectedTopic('ALAP_ALGORITMUSOK')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedTopic === 'ALAP_ALGORITMUSOK' 
              ? 'bg-accent text-accent-foreground' 
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Alap algoritmusok
        </button>
      </div>

      {user && (
        
        <div className="flex flex-wrap gap-3 mb-8">
          {/* All tasks gomb */}
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All tasks
          </button>
          
          {/* Unsolved gomb */}
          <button 
            onClick={() => setFilter('unsolved')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'unsolved' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Unsolved
          </button>
          
          {/* Solved gomb */}
          <button 
            onClick={() => setFilter('solved')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'solved' 
                ? 'bg-success text-success-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Solved <span className={filter === 'solved' ? 'text-success-foreground' : 'text-success'}>✓</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuestions.map((q) => {
          const isSolved = solvedIds.has(q.id)

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

                <div className="mb-4">
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider">
                    {q.topic}
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