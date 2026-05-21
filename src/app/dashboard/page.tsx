'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [quiz, setQuiz] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/auth')
      else setEmail(user.email || '')
    }
    getUser()
  }, [])

  async function generateQuiz() {
    if (!notes.trim()) return
    setLoading(true)
    setQuiz('')
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      const data = await res.json()
      setQuiz(data.quiz)
    } catch (e) {
      setQuiz('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

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

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4">📝 AI Quiz Generator</h2>
          <textarea
            className="w-full border rounded-lg p-4 text-gray-700 h-48 resize-none"
            placeholder="Paste your study notes here and AI will generate quiz questions..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button
            onClick={generateQuiz}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🤖 Generating quiz...' : '✨ Generate Quiz with AI'}
          </button>
        </div>

        {quiz && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">🎯 Your Quiz</h2>
            <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed">{quiz}</pre>
          </div>
        )}
      </div>
    </main>
  )
}