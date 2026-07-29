'use client'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useEffect, useState, use } from 'react'
import Editor from '@monaco-editor/react'
import Script from 'next/script'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const [question, setQuestion] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userCode, setUserCode] = useState('# Write your Python code here...\n')
  
  const [isChecking, setIsChecking] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null)

  const [pyodide, setPyodide] = useState<any>(null)
  const [isPyodideLoading, setIsPyodideLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single()
      
      setQuestion(qData)

      const { data: authData } = await supabase.auth.getUser()
      setUser(authData.user)

      setIsLoading(false)
    }
    
    fetchData()
  }, [id])

  const saveProgress = async () => {
    if (!user || !question) return

    try {
      const { data: previousProgress } = await supabase
        .from('user_progress')
        .select('consecutive_correct')
        .eq('user_id', user.id)
        .eq('question_id', question.id)
        .single()

      const newStreak = (previousProgress?.consecutive_correct || 0) + 1
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + newStreak * 2)

      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          question_id: question.id,
          consecutive_correct: newStreak,
          next_review_date: nextDate.toISOString()
        }, { onConflict: 'user_id,question_id' })

      console.log(`Successfully saved! New streak: ${newStreak}`)
    } catch (error) {
      console.error("Error saving progress:", error)
    }
  }

  const evaluateCode = async () => {
    if (!question?.correct_code || !pyodide) return
    
    setIsChecking(true)
    setFeedback(null)

    try {
      await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
      `)

      try {
        await pyodide.runPythonAsync(userCode)
      } catch (err: any) {
        setFeedback({ type: 'error', message: `Error in code:\n${err.message}` })
        setIsChecking(false)
        return
      }

      const userOutput = await pyodide.runPythonAsync("sys.stdout.getvalue()")

      await pyodide.runPythonAsync(`
sys.stdout = io.StringIO()
      `)
      await pyodide.runPythonAsync(question.correct_code)
      
      const correctOutput = await pyodide.runPythonAsync("sys.stdout.getvalue()")

      const finalUserOutput = userOutput.trim()
      const finalCorrectOutput = correctOutput.trim()

      if (finalUserOutput === finalCorrectOutput) {
        setFeedback({ 
          type: 'success', 
          message: `Perfect solution!\n\nOutput: ${finalUserOutput}` 
        })
        await saveProgress()
      } else {
        setFeedback({ 
          type: 'warning', 
          message: `Not quite right.\n\nYour output:\n${finalUserOutput || '(No output)'}\n\nExpected output:\n${finalCorrectOutput}` 
        })
      }

    } catch (error: any) {
      setFeedback({ type: 'error', message: `An internal error occurred during execution.` })
    }

    setIsChecking(false)
  }

  if (isLoading) {
    return <div className="p-8 text-center mt-20 text-muted-foreground">Loading task...</div>
  }

  if (!question) return <div className="p-8 text-center mt-20 text-red-500">Task not found!</div>

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      <Script 
        src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js" 
        onLoad={async () => {
          const py = await (window as any).loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
          })
          setPyodide(py)
          setIsPyodideLoading(false)
        }} 
      />

      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-muted-foreground hover:text-primary">
          ← Back to tasks
        </Link>
        {user && <span className="text-sm text-green-500 border border-green-900 bg-green-950/30 px-3 py-1 rounded-full">Logged in as: {user.email}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-2">{question.title}</h1>
          <div className="mb-6">
            <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {question.topic}
            </span>
          </div>
          
          <p className="text-xl mb-8 text-muted-foreground leading-relaxed">
            {question.description}
          </p>
          
          {feedback && (
            <div className={`p-6 rounded-xl border whitespace-pre-wrap font-mono mt-4 shadow-sm ${
              feedback.type === 'success' ? 'bg-green-950/30 border-green-900 text-black-400' :
              feedback.type === 'error' ? 'bg-red-950/30 border-red-900 text-black-400' :
              'bg-yellow-950/30 border-yellow-900 text-black-400'
            }`}>
              {feedback.message}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-border rounded-xl overflow-hidden shadow-inner bg-zinc-950 h-[450px]">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
              value={userCode}
              onChange={(value) => setUserCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                padding: { top: 16 },
                wordWrap: 'on'
              }}
            />
          </div>

          <button 
            onClick={evaluateCode}
            disabled={isChecking || isPyodideLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium px-6 py-4 rounded-xl transition-colors w-full flex justify-center items-center gap-2 text-lg shadow-sm"
          >
            {isPyodideLoading ? 'Loading Python engine...' : 
             isChecking ? 'Running and evaluating code...' : 'Submit code'}
          </button>
        </div>

      </div>
    </div>
  )
}