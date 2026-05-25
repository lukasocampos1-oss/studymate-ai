export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-8">
        <h1 className="text-5xl font-bold text-blue-600 mb-4">StudyMate AI 🎓</h1>
        <p className="text-gray-500 text-xl mb-2">Your AI-powered study platform</p>
        <p className="text-gray-400 text-sm mb-8">Upload your notes. Get quizzed by AI. Study smarter.</p>
        <a href="/auth" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all">Get Started</a>
        <p className="text-gray-300 text-xs mt-12">Designed and Built by <span className="text-blue-400 font-semibold">M. Samuel</span> 2026</p>
      </div>
    </main>
  )
}