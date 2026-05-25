'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleAuth() {
    setLoading(true)
    setMessage('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Account created! You can now log in.')
    }
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #e0f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif", padding: '1rem' }}>
      <style>{`
        * { box-sizing: border-box; }
        .input-field { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0.85rem 1rem; font-size: 0.95rem; font-family: inherit; color: #0f172a; background: #f8faff; transition: all 0.2s; outline: none; }
        .input-field:focus { border-color: #93c5fd; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .input-field::placeholder { color: #94a3b8; }
        .main-btn { width: 100%; padding: 0.9rem; background: linear-gradient(135deg, #2563eb, #0ea5e9); color: #fff; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; box-shadow: 0 4px 20px rgba(37,99,235,0.3); }
        .main-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 25px rgba(37,99,235,0.4); }
        .main-btn:active { transform: scale(0.99); }
        .main-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .toggle-btn { background: none; border: none; color: #2563eb; font-weight: 700; cursor: pointer; font-family: inherit; font-size: 0.9rem; text-decoration: underline; }
        .toggle-btn:hover { color: #1d4ed8; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>🎓</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af', letterSpacing: '-0.3px', marginBottom: '0.3rem' }}>
            StudyMate <span style={{ color: '#0ea5e9' }}>AI</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your AI-powered study platform</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', boxShadow: '0 8px 40px rgba(37,99,235,0.1)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>
            {isLogin ? 'Welcome back 👋' : 'Create your account'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {isLogin ? 'Log in to access your quizzes' : 'Start studying smarter today'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <input
              className="input-field"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>

          {message && (
            <div style={{ background: message.includes('created') || message.includes('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${message.includes('created') || message.includes('✅') ? '#bbf7d0' : '#fecaca'}`, borderRadius: '10px', padding: '0.7rem 1rem', fontSize: '0.88rem', color: message.includes('created') || message.includes('✅') ? '#16a34a' : '#dc2626', marginBottom: '1rem' }}>
              {message}
            </div>
          )}

          <button onClick={handleAuth} disabled={loading} className="main-btn">
            {loading ? '...' : isLogin ? 'Log in' : 'Create account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#94a3b8', marginTop: '1.2rem' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button className="toggle-btn" onClick={() => { setIsLogin(!isLogin); setMessage('') }}>
              {isLogin ? 'Sign up free' : 'Log in'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.78rem', marginTop: '1.5rem' }}>
          Designed and Built by <span style={{ color: '#2563eb', fontWeight: 700 }}>M. Samuel</span> · 2026
        </p>
      </div>
    </main>
  )
}