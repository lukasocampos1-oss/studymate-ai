'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Question {
  question: string
  answer: string
  revealed: boolean
  correct: boolean | null
}

function parseQuiz(raw: string): Question[] {
  const blocks = raw.split(/\n(?=Q:)/).filter(b => b.trim())
  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    const question = lines.find(l => l.startsWith('Q:'))?.replace('Q:', '').trim() || ''
    const answerLine = lines.find(l => l.toLowerCase().startsWith('answer:'))
    const answer = answerLine?.replace(/answer:/i, '').trim() || ''
    return { question, answer, revealed: false, correct: null }
  }).filter(q => q.question)
}

interface HistoryItem {
  id: string
  title: string
  score: number
  total: number
  created_at: string
  questions: Question[]
}

const LOADING_MESSAGES = [
  'Reading your notes...',
  'Identifying key concepts...',
  'Crafting quiz questions...',
  'Almost ready...',
]

export default function Dashboard() {
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text')
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [quizDone, setQuizDone] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [view, setView] = useState<'quiz' | 'history'>('quiz')
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const router = useRouter()
  const supabase = createClient()

  // Autosave notes
  useEffect(() => {
    const saved = localStorage.getItem('studymate_notes')
    if (saved) setNotes(saved)
  }, [])
  useEffect(() => {
    localStorage.setItem('studymate_notes', notes)
  }, [notes])

  // Loading message cycle
  useEffect(() => {
    if (!loading) return
    setLoadingMsg(0)
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [loading])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (questions.length === 0) return
      const unanswered = questions.findIndex(q => q.correct === null)
      if (unanswered === -1) return
      if (e.key === ' ') { e.preventDefault(); toggleReveal(unanswered) }
      if (e.key === '1') markAnswer(unanswered, true)
      if (e.key === '2') markAnswer(unanswered, false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [questions])

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/auth')
      else {
        setEmail(user.email || '')
        setUserId(user.id)
        fetchHistory(user.id)
      }
    }
    getUser()
  }, [])

  async function fetchHistory(uid: string) {
    const { data } = await supabase
      .from('quiz_history')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (data) setHistory(data)
  }

  useEffect(() => {
    if (questions.length > 0) {
      const answered = questions.filter(q => q.correct !== null).length
      if (answered === questions.length) {
        setQuizDone(true)
        saveQuizToHistory()
      }
    }
  }, [questions])

  async function saveQuizToHistory() {
    const score = questions.filter(q => q.correct === true).length
    const title = fileName || `Quiz — ${new Date().toLocaleDateString()}`
    await supabase.from('quiz_history').insert({
      user_id: userId, title, questions, score, total: questions.length
    })
    fetchHistory(userId)
  }

  async function generateQuiz() {
    if (inputMode === 'text' && !notes.trim()) return
    if (inputMode === 'file' && !file) return

    setLoading(true)
    setQuestions([])
    setQuizDone(false)

    try {
      let res

      if (inputMode === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)
        res = await fetch('/api/generate-quiz', {
          method: 'POST',
          body: formData
        })
      } else {
        res = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes })
        })
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.replace('data: ', '')
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              alert('Error: ' + parsed.error)
              setLoading(false)
              return
            }
            fullText += parsed.text || ''
            // Parse and update questions in real time
            const parsed2 = parseQuiz(fullText)
            if (parsed2.length > 0) setQuestions(parsed2)
          } catch {}
        }
      }

      const final = parseQuiz(fullText)
      setQuestions(final)
    } catch (e) {
      alert('Error: ' + String(e))
    }
    setLoading(false)
  }
      const parsed = parseQuiz(data.quiz)
      if (parsed.length === 0) {
        setError('Could not generate questions from this content. Try adding more detailed notes.')
        setLoading(false)
        return
      }
      setQuestions(parsed)
    } catch (e) {
      setError('Network error. Please check your connection and try again.')
    }
    setLoading(false)
  }

  const toggleReveal = useCallback((i: number) => {
    setQuestions(prev => prev.map((q, j) => j === i ? { ...q, revealed: !q.revealed } : q))
  }, [])

  const markAnswer = useCallback((i: number, correct: boolean) => {
    setQuestions(prev => prev.map((q, j) => j === i ? { ...q, correct, revealed: true } : q))
  }, [])

  function revealAll() { setQuestions(prev => prev.map(q => ({ ...q, revealed: true }))) }
  function hideAll() { setQuestions(prev => prev.map(q => ({ ...q, revealed: false }))) }
  function resetQuiz() {
    setQuestions(prev => prev.map(q => ({ ...q, correct: null, revealed: false })))
    setQuizDone(false)
  }
  function loadHistoryQuiz(item: HistoryItem) {
    setQuestions(item.questions.map(q => ({ ...q, correct: null, revealed: false })))
    setQuizDone(false); setView('quiz')
  }
  async function deleteHistory(id: string) {
    await supabase.from('quiz_history').delete().eq('id', id)
    fetchHistory(userId)
  }
  async function handleLogout() {
    await supabase.auth.signOut(); router.push('/auth')
  }

  const score = questions.filter(q => q.correct === true).length
  const total = questions.length
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const scoreColor = percentage >= 70 ? '#16a34a' : percentage >= 50 ? '#ea580c' : '#dc2626'
  const scoreBg = percentage >= 70 ? '#f0fdf4' : percentage >= 50 ? '#fff7ed' : '#fef2f2'
  const scoreBorder = percentage >= 70 ? '#bbf7d0' : percentage >= 50 ? '#fed7aa' : '#fecaca'
  const scoreLabel = percentage >= 70 ? 'Great work' : percentage >= 50 ? 'Keep going' : 'Keep practicing'
  const answeredCount = questions.filter(q => q.correct !== null).length

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #e0f2fe 100%)', fontFamily: "'Segoe UI', sans-serif", color: '#0f172a' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .btn { border: none; border-radius: 100px; cursor: pointer; font-weight: 600; transition: all 0.2s; font-family: inherit; }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: scale(0.97); }
        .btn:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
        .tab-active { background: linear-gradient(135deg, #2563eb, #0ea5e9); color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
        .tab-inactive { background: transparent; color: #64748b; }
        .tab-inactive:hover { background: #f1f5f9; color: #1e40af; }
        .q-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; transition: all 0.25s; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .q-card:hover { box-shadow: 0 6px 20px rgba(37,99,235,0.08); border-color: #bfdbfe; }
        .q-card.correct { border-left: 4px solid #22c55e; background: #f0fdf4; }
        .q-card.wrong { border-left: 4px solid #ef4444; background: #fef2f2; }
        .upload-zone { border: 2px dashed #bfdbfe; border-radius: 14px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.25s; background: #f8fbff; }
        .upload-zone:hover { border-color: #2563eb; background: #eff6ff; }
        .upload-zone:focus-visible { outline: 2px solid #2563eb; }
        .history-row { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.1rem 1.4rem; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; gap: 1rem; }
        .history-row:hover { border-color: #bfdbfe; box-shadow: 0 4px 12px rgba(37,99,235,0.07); }
        .reveal-btn { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 0.45rem 1.1rem; border-radius: 100px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; font-family: inherit; }
        .reveal-btn:hover { background: #dbeafe; }
        .reveal-btn:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
        .mark-right { flex:1; background:#f0fdf4; color:#16a34a; border:1.5px solid #bbf7d0; padding:0.6rem; border-radius:10px; cursor:pointer; font-weight:700; font-size:0.9rem; transition:all 0.2s; font-family:inherit; }
        .mark-right:hover { background:#dcfce7; transform: translateY(-1px); }
        .mark-right:focus-visible { outline: 2px solid #16a34a; outline-offset: 2px; }
        .mark-wrong { flex:1; background:#fef2f2; color:#dc2626; border:1.5px solid #fecaca; padding:0.6rem; border-radius:10px; cursor:pointer; font-weight:700; font-size:0.9rem; transition:all 0.2s; font-family:inherit; }
        .mark-wrong:hover { background:#fee2e2; transform: translateY(-1px); }
        .mark-wrong:focus-visible { outline: 2px solid #dc2626; outline-offset: 2px; }
        .progress-bar { height:5px; background:#e0f2fe; border-radius:10px; overflow:hidden; margin-top:0.8rem; }
        @keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        .progress-fill { height:100%; width:30%; background:linear-gradient(90deg,#2563eb,#0ea5e9); border-radius:10px; animation:slide 1.2s ease-in-out infinite; }
        .stat-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1rem; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
        textarea:focus { outline: none; border-color: #93c5fd !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .diff-btn { padding: 0.4rem 1rem; border-radius: 100px; border: 1.5px solid #e2e8f0; background: transparent; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; color: #64748b; }
        .diff-btn:hover { border-color: #2563eb; color: #2563eb; }
        .diff-btn.active-easy { background: #f0fdf4; border-color: #86efac; color: #16a34a; }
        .diff-btn.active-medium { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
        .diff-btn.active-hard { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
        .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 0.8rem 1.1rem; color: #dc2626; font-size: 0.88rem; font-weight: 500; }
        .quiz-progress { height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 1rem; }
        .quiz-progress-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #0ea5e9); border-radius: 10px; transition: width 0.4s ease; }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 0.6rem !important; }
          .stat-card { padding: 0.8rem 0.5rem !important; }
          .nav-email { display: none !important; }
          .history-row { flex-direction: column; align-items: flex-start !important; }
          .history-actions { width: 100%; display: flex; gap: 0.5rem; }
          .history-actions button { flex: 1; }
          .mark-right, .mark-wrong { padding: 0.7rem !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0.9rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1e40af', letterSpacing: '-0.3px' }}>StudyMate <span style={{ color: '#0ea5e9' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span className="nav-email" style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.3rem 0.8rem', borderRadius: '100px' }}>{email}</span>
          <button onClick={handleLogout} className="btn" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.4rem 1rem', fontSize: '0.83rem' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '1.2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '0.2rem' }}>
            Welcome back, {email.split('@')[0]}
          </h1>
          <p style={{ color: '#475569', fontSize: '0.9rem' }}>Ready to study? Upload your notes and generate a quiz.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.8rem', marginBottom: '1.2rem' }}>
          {[
            { label: 'Quizzes taken', value: history.length, color: '#2563eb' },
            { label: 'Best score', value: history.length ? Math.max(...history.map(h => Math.round((h.score/h.total)*100)))+'%' : '—', color: '#0891b2' },
            { label: 'Questions done', value: history.reduce((a,h) => a+h.total, 0), color: '#7c3aed' },
          ].map((s,i) => (
            <div key={i} className="stat-card">
              <p style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.4rem', background:'#f1f5f9', padding:'4px', borderRadius:'100px', width:'fit-content', marginBottom:'1.2rem', border:'1px solid #e2e8f0' }}>
          {[['quiz','New Quiz'],['history',`History${history.length > 0 ? ` (${history.length})` : ''}`]].map(([val,label]) => (
            <button key={val} onClick={() => setView(val as 'quiz'|'history')} className={`btn ${view===val?'tab-active':'tab-inactive'}`} style={{ padding:'0.5rem 1.2rem', fontSize:'0.86rem', borderRadius:'100px' }}>
              {label}
            </button>
          ))}
        </div>

        {/* History */}
        {view === 'history' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem' }}>
            {history.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:'3rem 2rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.4rem' }}>📋</div>
                <p style={{ fontWeight: 700, color: '#1e40af', marginBottom: '0.4rem' }}>No quizzes yet</p>
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Generate your first quiz and your history will appear here.</p>
                <button onClick={() => setView('quiz')} className="btn" style={{ marginTop: '1.2rem', background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', color: '#fff', padding: '0.6rem 1.5rem', fontSize: '0.88rem' }}>
                  Generate a quiz
                </button>
              </div>
            ) : history.map(item => (
              <div key={item.id} className="history-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight:700, color:'#0f172a', fontSize:'0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                  <div style={{ display:'flex', gap:'0.7rem', marginTop:'0.3rem', alignItems:'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize:'0.76rem', color:'#94a3b8' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                    <span style={{ fontSize:'0.76rem', background: Math.round((item.score/item.total)*100)>=70?'#f0fdf4':Math.round((item.score/item.total)*100)>=50?'#fff7ed':'#fef2f2', color:Math.round((item.score/item.total)*100)>=70?'#16a34a':Math.round((item.score/item.total)*100)>=50?'#ea580c':'#dc2626', padding:'0.15rem 0.55rem', borderRadius:'100px', fontWeight:700 }}>
                      {Math.round((item.score/item.total)*100)}%
                    </span>
                    <span style={{ fontSize:'0.76rem', color:'#94a3b8' }}>{item.score}/{item.total} correct</span>
                  </div>
                </div>
                <div className="history-actions" style={{ display:'flex', gap:'0.5rem', flexShrink: 0 }}>
                  <button onClick={() => loadHistoryQuiz(item)} className="btn" style={{ background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', padding:'0.4rem 0.9rem', fontSize:'0.8rem' }}>Retake</button>
                  <button onClick={() => deleteHistory(item.id)} className="btn" style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'0.4rem 0.8rem', fontSize:'0.8rem' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quiz */}
        {view === 'quiz' && (
          <>
            <div className="card" style={{ marginBottom:'1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize:'1rem', fontWeight:700, color:'#1e40af' }}>AI Quiz Generator</h2>
                {/* Difficulty */}
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: '0.2rem' }}>Difficulty:</span>
                  {(['easy','medium','hard'] as const).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)} className={`diff-btn ${difficulty===d ? `active-${d}` : ''}`}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:'0.4rem', background:'#f8fafc', padding:'4px', borderRadius:'100px', width:'fit-content', marginBottom:'1rem', border:'1px solid #e2e8f0' }}>
                {(['text','file'] as const).map(mode => (
                  <button key={mode} onClick={() => { setInputMode(mode); setError('') }} className="btn" style={{ padding:'0.42rem 1rem', fontSize:'0.83rem', borderRadius:'100px', background:inputMode===mode?'#fff':'transparent', color:inputMode===mode?'#2563eb':'#94a3b8', boxShadow:inputMode===mode?'0 1px 4px rgba(0,0,0,0.1)':'none', border:inputMode===mode?'1px solid #e2e8f0':'1px solid transparent' }}>
                    {mode==='text'?'Paste Notes':'Upload File'}
                  </button>
                ))}
              </div>

              {inputMode === 'text' ? (
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={notes} onChange={e => { setNotes(e.target.value); setError('') }}
                    placeholder="Paste your study notes here — the more detail, the better your quiz..."
                    style={{ width:'100%', height:'155px', background:'#f8faff', border:'1.5px solid #e2e8f0', borderRadius:'12px', padding:'1rem', color:'#0f172a', fontSize:'0.92rem', resize:'none', fontFamily:'inherit', lineHeight:1.6, transition:'all 0.2s' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', color: notes.length > 4000 ? '#dc2626' : '#94a3b8' }}>
                      {notes.length} characters {notes.length > 0 && `· ~${notes.trim().split(/\s+/).length} words`}
                    </span>
                    {notes.length > 0 && (
                      <button onClick={() => setNotes('')} style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="upload-zone"
                  tabIndex={0}
                  role="button"
                  aria-label="Upload file"
                  onClick={() => document.getElementById('fileInput')?.click()}
                  onKeyDown={e => e.key === 'Enter' && document.getElementById('fileInput')?.click()}
                >
                  <p style={{ color: fileName?'#2563eb':'#475569', fontWeight: 600, fontSize:'0.92rem' }}>{fileName || 'Click to upload your file'}</p>
                  <p style={{ color:'#94a3b8', fontSize:'0.8rem', marginTop:'0.3rem' }}>Supports .docx · .pdf · .txt · Max 5MB</p>
                  {fileName && (
                    <button onClick={e => { e.stopPropagation(); setFile(null); setFileName(''); setError('') }}
                      style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                      Remove file
                    </button>
                  )}
                  <input id="fileInput" type="file" accept=".docx,.txt,.pdf" style={{ display:'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      if (f.size > 5 * 1024 * 1024) { setError('File is too large. Maximum size is 5MB.'); return }
                      const ext = f.name.split('.').pop()?.toLowerCase()
                      if (!['docx','txt','pdf'].includes(ext||'')) { setError('Invalid file type. Please upload .docx, .pdf, or .txt'); return }
                      setFile(f); setFileName(f.name); setError('')
                    }}
                  />
                </div>
              )}

              {error && <div className="error-box" style={{ marginTop: '0.8rem' }}>{error}</div>}

              <button onClick={generateQuiz} disabled={loading} className="btn" style={{ marginTop:'0.9rem', width:'100%', padding:'0.85rem', background:loading?'#93c5fd':'linear-gradient(135deg,#2563eb,#0ea5e9)', color:'#fff', fontSize:'0.97rem', borderRadius:'12px', boxShadow:loading?'none':'0 4px 20px rgba(37,99,235,0.3)' }}>
                {loading ? LOADING_MESSAGES[loadingMsg] : 'Generate Quiz with AI'}
              </button>
              {loading && (
                <>
                  <div className="progress-bar"><div className="progress-fill" /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                    {[100, 80, 60].map((w, i) => (
                      <div key={i} className="skeleton" style={{ height: '16px', width: `${w}%` }} />
                    ))}
                  </div>
                </>
              )}

              {/* Keyboard hint */}
              {questions.length > 0 && !quizDone && (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.8rem', textAlign: 'center' }}>
                  Tip: Press <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0 4px', fontSize: '0.72rem' }}>Space</kbd> to reveal · <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0 4px', fontSize: '0.72rem' }}>1</kbd> correct · <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0 4px', fontSize: '0.72rem' }}>2</kbd> wrong
                </p>
              )}
            </div>

            {quizDone && (
              <div style={{ background:scoreBg, border:`1.5px solid ${scoreBorder}`, borderRadius:'16px', padding:'1.8rem', textAlign:'center', marginBottom:'1.2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize:'0.9rem', fontWeight:700, color:scoreColor, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.5rem' }}>{scoreLabel}</p>
                <p style={{ fontSize:'3rem', fontWeight:900, color:scoreColor, lineHeight:1 }}>{percentage}%</p>
                <p style={{ color:'#475569', margin:'0.5rem 0 1.2rem', fontSize:'0.93rem' }}>You got <strong>{score}</strong> out of <strong>{total}</strong> correct</p>
                <button onClick={resetQuiz} className="btn" style={{ background:'#fff', color:'#2563eb', border:'1.5px solid #bfdbfe', padding:'0.6rem 1.6rem', fontSize:'0.88rem' }}>Retake Quiz</button>
              </div>
            )}

            {questions.length > 0 && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h2 style={{ fontWeight:700, color:'#1e40af', fontSize:'0.97rem' }}>{questions.length} Questions</h2>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{answeredCount} of {total} answered</p>
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button onClick={revealAll} className="reveal-btn">Reveal All</button>
                    <button onClick={hideAll} className="reveal-btn" style={{ background:'#f8fafc', color:'#64748b', borderColor:'#e2e8f0' }}>Hide All</button>
                  </div>
                </div>

                {/* Progress */}
                <div className="quiz-progress" style={{ marginBottom: '1rem' }}>
                  <div className="quiz-progress-fill" style={{ width: `${total > 0 ? (answeredCount/total)*100 : 0}%` }} />
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
                  {questions.map((q,i) => (
                    <div key={i} className={`q-card ${q.correct===true?'correct':q.correct===false?'wrong':''}`}>
                      <p style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.94rem', lineHeight:1.65, color:'#0f172a', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:'26px', height:'26px', background:'linear-gradient(135deg,#2563eb,#0ea5e9)', color:'#fff', borderRadius:'8px', fontSize:'0.75rem', fontWeight:800, flexShrink:0 }}>{i+1}</span>
                        {q.question}
                      </p>
                      <button onClick={() => toggleReveal(i)} className="reveal-btn">
                        {q.revealed ? 'Hide Answer' : 'Show Answer'}
                      </button>
                      {q.revealed && (
                        <div style={{ marginTop:'0.8rem', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'0.8rem 1rem', color:'#15803d', fontSize:'0.88rem', lineHeight:1.65 }}>
                          {q.answer}
                        </div>
                      )}
                      {q.correct === null && (
                        <div style={{ display:'flex', gap:'0.6rem', marginTop:'0.8rem' }}>
                          <button onClick={() => markAnswer(i,true)} className="mark-right">Got it right</button>
                          <button onClick={() => markAnswer(i,false)} className="mark-wrong">Got it wrong</button>
                        </div>
                      )}
                      {q.correct !== null && (
                        <p style={{ marginTop:'0.5rem', fontSize:'0.82rem', fontWeight:600, color:q.correct?'#16a34a':'#dc2626' }}>
                          {q.correct ? 'Correct' : 'Incorrect'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <p style={{ textAlign:'center', color:'#94a3b8', fontSize:'0.78rem', marginTop:'2.5rem', paddingBottom:'1rem' }}>
          Designed and Built by <span style={{ color:'#2563eb', fontWeight:700 }}>M. Samuel</span> · 2026
        </p>
      </div>
    </main>
  )
}