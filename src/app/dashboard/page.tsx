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
      user_id: userId,
      title,
      questions,
      score,
      total: questions.length
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

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        alert('Server error: ' + text.slice(0, 200))
        setLoading(false)
        return
      }
      const parsed = parseQuiz(data.quiz)
      setQuestions(parsed)
    } catch (e) {
      alert('Error: ' + String(e))
    }
    setLoading(false)
  }

  function toggleReveal(index: number) {
    setQuestions(prev =>
      prev.map((q, i) => i === index ? { ...q, revealed: !q.revealed } : q)
    )
  }

  function markAnswer(index: number, correct: boolean) {
    setQuestions(prev =>
      prev.map((q, i) => i === index ? { ...q, correct, revealed: true } : q)
    )
  }

  function revealAll() {
    setQuestions(prev => prev.map(q => ({ ...q, revealed: true })))
  }

  function hideAll() {
    setQuestions(prev => prev.map(q => ({ ...q, revealed: false })))
  }

  function resetQuiz() {
    setQuestions(prev => prev.map(q => ({ ...q, correct: null, revealed: false })))
    setQuizDone(false)
  }

  function loadHistoryQuiz(item: HistoryItem) {
    setQuestions(item.questions.map(q => ({ ...q, correct: null, revealed: false })))
    setQuizDone(false)
    setView('quiz')
  }

  async function deleteHistory(id: string) {
    await supabase.from('quiz_history').delete().eq('id', id)
    fetchHistory(userId)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const score = questions.filter(q => q.correct === true).length
  const total = questions.length
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const scoreColor = percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-orange-500' : 'text-red-500'
  const scoreBg = percentage >= 70 ? 'bg-green-50 border-green-200' : percentage >= 50 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
  const scoreEmoji = percentage >= 70 ? '🎉' : percentage >= 50 ? '📚' : '💪'

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">StudyMate AI 🎓</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            Logout
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <p className="text-gray-500">Logged in as: {email}</p>
        </div>

        {/* Nav Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setView('quiz')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${view === 'quiz' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            ✨ New Quiz
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${view === 'history' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            📖 History {history.length > 0 && `(${history.length})`}
          </button>
        </div>

        {view === 'history' && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
                No quiz history yet. Generate your first quiz!
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow p-6 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-700">{item.title}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(item.created_at).toLocaleDateString()} · Score: {item.score}/{item.total} ({Math.round((item.score / item.total) * 100)}%)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadHistoryQuiz(item)}
                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium"
                    >
                      🔄 Retake
                    </button>
                    <button
                      onClick={() => deleteHistory(item.id)}
                      className="bg-red-50 text-red-500 px-4 py-2 rounded-lg hover:bg-red-100 text-sm font-medium"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'quiz' && (
          <>
            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-700 mb-4">📝 AI Quiz Generator</h2>

              <div className="flex bg-gray-100 rounded-lg p-1 mb-4 w-fit">
                <button
                  onClick={() => setInputMode('text')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${inputMode === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                >
                  ✏️ Paste Notes
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${inputMode === 'file' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                >
                  📄 Upload File
                </button>
              </div>

              {inputMode === 'text' ? (
                <textarea
                  className="w-full border rounded-lg p-4 text-gray-700 h-48 resize-none"
                  placeholder="Paste your study notes here..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              ) : (
                <div
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className="w-full border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <p className="text-4xl mb-2">📂</p>
                  <p className="text-gray-600 font-medium">
                    {fileName || 'Click to upload .docx, .pdf or .txt file'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">Supports Word, PDF and text files</p>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".docx,.txt,.pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) { setFile(f); setFileName(f.name) }
                    }}
                  />
                </div>
              )}

              <button
                onClick={generateQuiz}
                disabled={loading}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '🤖 Generating quiz... (this may take 15-30s)' : '✨ Generate Quiz with AI'}
              </button>
              {loading && (
                <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse w-full"></div>
                </div>
              )}
            </div>

            {quizDone && (
              <div className={`rounded-xl border-2 p-6 mb-6 text-center ${scoreBg}`}>
                <p className="text-5xl mb-2">{scoreEmoji}</p>
                <h2 className={`text-3xl font-bold mb-1 ${scoreColor}`}>{percentage}%</h2>
                <p className="text-gray-600 text-lg mb-4">You got {score} out of {total} correct</p>
                <button
                  onClick={resetQuiz}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  🔄 Retake Quiz
                </button>
              </div>
            )}

            {questions.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-700">🎯 Your Quiz ({questions.length} questions)</h2>
                  <div className="flex gap-2">
                    <button onClick={revealAll} className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100">
                      👁️ Reveal All
                    </button>
                    <button onClick={hideAll} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-200">
                      🙈 Hide All
                    </button>
                  </div>
                </div>

                {questions.map((q, i) => (
                  <div key={i} className={`bg-white rounded-xl shadow p-6 border-l-4 ${q.correct === true ? 'border-green-400' : q.correct === false ? 'border-red-400' : 'border-transparent'}`}>
                    <p className="font-semibold text-gray-800 mb-4">
                      {i + 1}. {q.question}
                    </p>
                    <button
                      onClick={() => toggleReveal(i)}
                      className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 font-medium mr-2"
                    >
                      {q.revealed ? '🙈 Hide Answer' : '👁️ Show Answer'}
                    </button>
                    {q.revealed && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 mb-3">
                        ✅ {q.answer}
                      </div>
                    )}
                    {q.correct === null && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => markAnswer(i, true)}
                          className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 font-medium text-sm"
                        >
                          ✅ Got it right
                        </button>
                        <button
                          onClick={() => markAnswer(i, false)}
                          className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 font-medium text-sm"
                        >
                          ❌ Got it wrong
                        </button>
                      </div>
                    )}
                    {q.correct !== null && (
                      <p className={`mt-2 text-sm font-medium ${q.correct ? 'text-green-600' : 'text-red-500'}`}>
                        {q.correct ? '✅ Marked correct' : '❌ Marked wrong'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <p className="text-center text-gray-300 text-xs mt-8">
          Designed and Built by <span className="text-blue-400 font-semibold">M. Samuel</span> 2026
        </p>
      </div>
    </main>
  )
}