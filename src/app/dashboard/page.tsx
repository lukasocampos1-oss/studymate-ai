'use client'
import { useEffect, useState } from 'react'
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

export default function Dashboard() {
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text')
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [quizDone, setQuizDone] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [view, setView] = useState<'quiz' | 'history'>('quiz')
  const [userId, setUserId] = useState('')
  const router = useRouter()
  const supabase = createClient()

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
      user_id: userId, title, questions,
      score, total: questions.length
    })
    fetchHistory(userId)
  }

  async function generateQuiz() {
    if (inputMode === 'text' && !notes.trim()) return
    if (inputMode === 'file' && !file) return
    setLoading(true); setQuestions([]); setQuizDone(false)
    try {
      let res
      if (inputMode === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)
        res = await fetch('/api/generate-quiz', { method: 'POST', body: formData })
      } else {
        res = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes })
        })
      }
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch {
        alert('Server error: ' + text.slice(0, 200)); setLoading(false); return
      }
      setQuestions(parseQuiz(data.quiz))
    } catch (e) { alert('Error: ' + String(e)) }
    setLoading(false)
  }

  function toggleReveal(i: number) {
    setQuestions(prev => prev.map((q, j) => j === i ? { ...q, revealed: !q.revealed } : q))
  }
  function markAnswer(i: number, correct: boolean) {
    setQuestions(prev => prev.map((q, j) => j === i ? { ...q, correct, revealed: true } : q))
  }
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
  const scoreEmoji = percentage >= 70 ? '🎉' : percentage >= 50 ? '📚' : '💪'
  const scoreColor = percentage >= 70 ? '#16a34a' : percentage >= 50 ? '#ea580c' : '#dc2626'
  const scoreBg = percentage >= 70 ? '#f0fdf4' : percentage >= 50 ? '#fff7ed' : '#fef2f2'
  const scoreBorder = percentage >= 70 ? '#bbf7d0' : percentage >= 50 ? '#fed7aa' : '#fecaca'

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #e0f2fe 100%)', fontFamily: "'Segoe UI', sans-serif", color: '#0f172a' }}>
      <style>{`
        * { box-sizing: border-box; }
        .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .card:hover { box-shadow: 0 4px 16px rgba(37,99,235,0.08); }
        .btn { border: none; border-radius: 100px; cursor: pointer; font-weight: 600; transition: all 0.2s; font-family: inherit; }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: scale(0.98); }
        .tab-active { background: linear-gradient(135deg, #2563eb, #0ea5e9); color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
        .tab-inactive { background: transparent; color: #64748b; }
        .tab-inactive:hover { background: #f1f5f9; color: #1e40af; }
        .q-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; transition: all 0.25s; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .q-card:hover { box-shadow: 0 6px 20px rgba(37,99,235,0.08); border-color: #bfdbfe; }
        .q-card.correct { border-left: 4px solid #22c55e; background: #f0fdf4; }
        .q-card.wrong { border-left: 4px solid #ef4444; background: #fef2f2; }
        .upload-zone { border: 2px dashed #bfdbfe; border-radius: 14px; padding: 2.5rem; text-align: center; cursor: pointer; transition: all 0.25s; background: #f8fbff; }
        .upload-zone:hover { border-color: #2563eb; background: #eff6ff; }
        .history-row { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.1rem 1.4rem; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
        .history-row:hover { border-color: #bfdbfe; box-shadow: 0 4px 12px rgba(37,99,235,0.07); }
        .reveal-btn { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 0.45rem 1.1rem; border-radius: 100px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; font-family: inherit; }
        .reveal-btn:hover { background: #dbeafe; }
        .mark-right { flex:1; background:#f0fdf4; color:#16a34a; border:1.5px solid #bbf7d0; padding:0.6rem; border-radius:10px; cursor:pointer; font-weight:700; font-size:0.9rem; transition:all 0.2s; font-family:inherit; }
        .mark-right:hover { background:#dcfce7; }
        .mark-wrong { flex:1; background:#fef2f2; color:#dc2626; border:1.5px solid #fecaca; padding:0.6rem; border-radius:10px; cursor:pointer; font-weight:700; font-size:0.9rem; transition:all 0.2s; font-family:inherit; }
        .mark-wrong:hover { background:#fee2e2; }
        .progress-bar { height:5px; background:#e0f2fe; border-radius:10px; overflow:hidden; margin-top:0.8rem; }
        @keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        .progress-fill { height:100%; width:30%; background:linear-gradient(90deg,#2563eb,#0ea5e9); border-radius:10px; animation:slide 1.2s ease-in-out infinite; }
        .stat-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.2rem; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
        textarea:focus { outline: none; border-color: #93c5fd !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#2563eb,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e40af', letterSpacing: '-0.3px' }}>StudyMate <span style={{ color: '#0ea5e9' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.35rem 0.9rem', borderRadius: '100px' }}>{email}</span>
          <button onClick={handleLogout} className="btn" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '1.8rem' }}>
          
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Upload your notes and let AI quiz you to exam success.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.8rem' }}>
          {[
            { icon: '📋', value: history.length, label: 'Quizzes taken', color: '#2563eb', bg: '#eff6ff' },
            { icon: '🏆', value: history.length ? Math.max(...history.map(h => Math.round((h.score/h.total)*100)))+'%' : '—', label: 'Best score', color: '#0891b2', bg: '#ecfeff' },
            { icon: '🧠', value: history.reduce((a,h) => a+h.total, 0), label: 'Questions done', color: '#7c3aed', bg: '#f5f3ff' },
          ].map((s,i) => (
            <div key={i} className="stat-card">
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', margin:'0 auto 0.6rem' }}>{s.icon}</div>
              <p style={{ fontSize:'1.7rem', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
              <p style={{ fontSize:'0.78rem', color:'#94a3b8', marginTop:'0.3rem' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.4rem', background:'#f1f5f9', padding:'4px', borderRadius:'100px', width:'fit-content', marginBottom:'1.5rem', border:'1px solid #e2e8f0' }}>
          {[['quiz','✨ New Quiz'],['history',`📖 History${history.length > 0 ? ` (${history.length})` : ''}`]].map(([val,label]) => (
            <button key={val} onClick={() => setView(val as 'quiz'|'history')} className={`btn ${view===val?'tab-active':'tab-inactive'}`} style={{ padding:'0.55rem 1.4rem', fontSize:'0.88rem', borderRadius:'100px' }}>
              {label}
            </button>
          ))}
        </div>

        {/* History */}
        {view === 'history' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem' }}>
            {history.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
                <p style={{ fontSize:'2.5rem', marginBottom:'0.8rem' }}>📭</p>
                <p>No quiz history yet. Generate your first quiz!</p>
              </div>
            ) : history.map(item => (
              <div key={item.id} className="history-row">
                <div>
                  <p style={{ fontWeight:700, color:'#0f172a', fontSize:'0.93rem' }}>{item.title}</p>
                  <div style={{ display:'flex', gap:'0.8rem', marginTop:'0.3rem', alignItems:'center' }}>
                    <span style={{ fontSize:'0.78rem', color:'#94a3b8' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                    <span style={{ fontSize:'0.78rem', background: Math.round((item.score/item.total)*100)>=70?'#f0fdf4':Math.round((item.score/item.total)*100)>=50?'#fff7ed':'#fef2f2', color:Math.round((item.score/item.total)*100)>=70?'#16a34a':Math.round((item.score/item.total)*100)>=50?'#ea580c':'#dc2626', padding:'0.2rem 0.6rem', borderRadius:'100px', fontWeight:700 }}>
                      {Math.round((item.score/item.total)*100)}%
                    </span>
                    <span style={{ fontSize:'0.78rem', color:'#94a3b8' }}>{item.score}/{item.total} correct</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button onClick={() => loadHistoryQuiz(item)} className="btn" style={{ background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', padding:'0.45rem 1rem', fontSize:'0.82rem' }}>🔄 Retake</button>
                  <button onClick={() => deleteHistory(item.id)} className="btn" style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'0.45rem 0.8rem', fontSize:'0.82rem' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quiz */}
        {view === 'quiz' && (
          <>
            <div className="card" style={{ marginBottom:'1.5rem' }}>
              <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#1e40af', marginBottom:'1.1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <span style={{ background:'#eff6ff', padding:'0.3rem 0.6rem', borderRadius:'8px' }}>📝</span> AI Quiz Generator
              </h2>

              <div style={{ display:'flex', gap:'0.4rem', background:'#f8fafc', padding:'4px', borderRadius:'100px', width:'fit-content', marginBottom:'1.1rem', border:'1px solid #e2e8f0' }}>
                {(['text','file'] as const).map(mode => (
                  <button key={mode} onClick={() => setInputMode(mode)} className="btn" style={{ padding:'0.45rem 1.1rem', fontSize:'0.84rem', borderRadius:'100px', background:inputMode===mode?'#fff':'transparent', color:inputMode===mode?'#2563eb':'#94a3b8', boxShadow:inputMode===mode?'0 1px 4px rgba(0,0,0,0.1)':'none', border:inputMode===mode?'1px solid #e2e8f0':'1px solid transparent' }}>
                    {mode==='text'?'✏️ Paste Notes':'📄 Upload File'}
                  </button>
                ))}
              </div>

              {inputMode === 'text' ? (
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Paste your study notes here — the more detail, the better your quiz..."
                  style={{ width:'100%', height:'175px', background:'#f8faff', border:'1.5px solid #e2e8f0', borderRadius:'12px', padding:'1rem', color:'#0f172a', fontSize:'0.93rem', resize:'none', fontFamily:'inherit', lineHeight:1.6, transition:'all 0.2s' }}
                />
              ) : (
                <div className="upload-zone" onClick={() => document.getElementById('fileInput')?.click()}>
                  <p style={{ fontSize:'2.2rem', marginBottom:'0.6rem' }}>📂</p>
                  <p style={{ color: fileName?'#2563eb':'#64748b', fontWeight:600, fontSize:'0.93rem' }}>{fileName || 'Click to upload your file'}</p>
                  <p style={{ color:'#94a3b8', fontSize:'0.82rem', marginTop:'0.3rem' }}>Supports .docx · .pdf · .txt</p>
                  <input id="fileInput" type="file" accept=".docx,.txt,.pdf" style={{ display:'none' }} onChange={e => { const f=e.target.files?.[0]; if(f){setFile(f);setFileName(f.name)} }} />
                </div>
              )}

              <button onClick={generateQuiz} disabled={loading} className="btn" style={{ marginTop:'1rem', width:'100%', padding:'0.9rem', background:loading?'#93c5fd':'linear-gradient(135deg,#2563eb,#0ea5e9)', color:'#fff', fontSize:'1rem', borderRadius:'12px', boxShadow:loading?'none':'0 4px 20px rgba(37,99,235,0.3)', letterSpacing:'0.01em' }}>
                {loading ? '🤖 Generating your quiz...' : '✨ Generate Quiz with AI'}
              </button>
              {loading && <div className="progress-bar"><div className="progress-fill" /></div>}
            </div>

            {quizDone && (
              <div style={{ background:scoreBg, border:`1.5px solid ${scoreBorder}`, borderRadius:'16px', padding:'2rem', textAlign:'center', marginBottom:'1.5rem', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize:'3rem', marginBottom:'0.4rem' }}>{scoreEmoji}</p>
                <p style={{ fontSize:'3rem', fontWeight:900, color:scoreColor, lineHeight:1 }}>{percentage}%</p>
                <p style={{ color:'#64748b', margin:'0.6rem 0 1.2rem', fontSize:'0.95rem' }}>You got <strong>{score}</strong> out of <strong>{total}</strong> correct</p>
                <button onClick={resetQuiz} className="btn" style={{ background:'#fff', color:'#2563eb', border:'1.5px solid #bfdbfe', padding:'0.6rem 1.8rem', fontSize:'0.9rem' }}>🔄 Retake Quiz</button>
              </div>
            )}

            {questions.length > 0 && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                  <h2 style={{ fontWeight:700, color:'#1e40af', fontSize:'1rem' }}>🎯 {questions.length} Questions</h2>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button onClick={revealAll} className="reveal-btn">👁️ Reveal All</button>
                    <button onClick={hideAll} className="reveal-btn" style={{ background:'#f8fafc', color:'#64748b', borderColor:'#e2e8f0' }}>🙈 Hide All</button>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {questions.map((q,i) => (
                    <div key={i} className={`q-card ${q.correct===true?'correct':q.correct===false?'wrong':''}`}>
                      <p style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.96rem', lineHeight:1.65, color:'#0f172a' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'26px', height:'26px', background:'linear-gradient(135deg,#2563eb,#0ea5e9)', color:'#fff', borderRadius:'8px', fontSize:'0.78rem', fontWeight:800, marginRight:'0.6rem', flexShrink:0 }}>{i+1}</span>
                        {q.question}
                      </p>
                      <button onClick={() => toggleReveal(i)} className="reveal-btn">
                        {q.revealed ? '🙈 Hide Answer' : '👁️ Show Answer'}
                      </button>
                      {q.revealed && (
                        <div style={{ marginTop:'0.8rem', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'0.8rem 1rem', color:'#15803d', fontSize:'0.9rem', lineHeight:1.65 }}>
                          ✅ {q.answer}
                        </div>
                      )}
                      {q.correct === null && (
                        <div style={{ display:'flex', gap:'0.6rem', marginTop:'0.8rem' }}>
                          <button onClick={() => markAnswer(i,true)} className="mark-right">✅ Got it right</button>
                          <button onClick={() => markAnswer(i,false)} className="mark-wrong">❌ Got it wrong</button>
                        </div>
                      )}
                      {q.correct !== null && (
                        <p style={{ marginTop:'0.6rem', fontSize:'0.85rem', fontWeight:600, color:q.correct?'#16a34a':'#dc2626' }}>
                          {q.correct ? '✅ Marked correct' : '❌ Marked wrong'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <p style={{ textAlign:'center', color:'#cbd5e1', fontSize:'0.8rem', marginTop:'3rem', paddingBottom:'1rem' }}>
          Designed and Built by <span style={{ color:'#2563eb', fontWeight:700 }}>M. Samuel</span> · 2026
        </p>
      </div>
    </main>
  )
}