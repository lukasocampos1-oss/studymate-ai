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
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #dde3f0 0%, #c8d0e8 50%, #d4d9ee 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '1rem',
      position: 'relative'
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .auth-input {
          width: 100%;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          padding: 0.85rem 1rem;
          font-size: 0.95rem;
          font-family: inherit;
          color: #1e293b;
          background: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-input:focus {
          border-color: #2dd4bf;
          box-shadow: 0 0 0 3px rgba(45,212,191,0.12);
        }
        .auth-input::placeholder { color: #94a3b8; }
        .login-btn {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #4f46e5, #a855f7);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          font-family: inherit;
          letter-spacing: 0.01em;
        }
        .login-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .login-btn:active { transform: scale(0.99); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .toggle-link {
          background: none;
          border: none;
          color: #2dd4bf;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.93rem;
          padding: 0;
        }
        .toggle-link:hover { text-decoration: underline; }
      `}</style>

      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '430px',
        boxShadow: '0 8px 40px rgba(99,102,241,0.12)',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#1e1b9e',
          textAlign: 'center',
          marginBottom: '1.8rem',
          letterSpacing: '-0.3px'
        }}>
          {isLogin ? 'Login to StudyMate AI' : 'Create your account'}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1rem' }}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
          />
        </div>

        {message && (
          <div style={{
            background: message.includes('created') ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.includes('created') ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            color: message.includes('created') ? '#16a34a' : '#dc2626',
            marginBottom: '1rem'
          }}>
            {message}
          </div>
        )}

        <button onClick={handleAuth} disabled={loading} className="login-btn" style={{ marginBottom: '1.2rem' }}>
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.93rem', color: '#475569', margin: 0 }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button className="toggle-link" onClick={() => { setIsLogin(!isLogin); setMessage('') }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>

      {/* Signature */}
      <p style={{
        position: 'absolute',
        bottom: '1.5rem',
        right: '2rem',
        fontSize: '0.8rem',
        color: 'rgba(30,27,158,0.35)'
      }}>
        Designed & Built by <span style={{ color: '#4f46e5', fontWeight: 700 }}>M. Samuel</span> · 2026
      </p>
    </main>
  )
}