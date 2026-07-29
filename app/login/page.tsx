'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage({ type: 'success', text: 'Registration successful! You can now log in.' })
        setIsLogin(true)
        setPassword('')
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred during authentication.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 border border-border rounded-xl shadow-lg bg-zinc-950/50 backdrop-blur-sm">
        <Link href="/" className="text-muted-foreground hover:text-primary text-sm mb-6 inline-block">
          ← Back to home
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-center">
          {isLogin ? 'Login' : 'Register'}
        </h1>

        {message && (
          <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 rounded-lg transition-colors mt-2 disabled:opacity-50"
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Create account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage(null)
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Register!" : 'Already have an account? Login!'}
          </button>
        </div>
      </div>
    </div>
  )
}