'use client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main style={{ fontFamily: "'Georgia', serif", background: '#0a0a0f', minHeight: '100vh', color: '#fff', overflowX: 'hidden' }}>

      {/* Animated background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 50%, #1a1a3e 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0d2137 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, #1a0a2e 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Floating orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.15,
            animation: `float${i} ${8 + i * 2}s ease-in-out infinite alternate`,
            width: `${200 + i * 80}px`,
            height: `${200 + i * 80}px`,
            background: ['#3b82f6', '#8b5cf6', '#06b6d4', '#3b82f6', '#8b5cf6', '#06b6d4'][i],
            left: `${[10, 60, 30, 75, 5, 50][i]}%`,
            top: `${[20, 10, 60, 40, 70, 80][i]}%`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .hero-title { animation: fadeUp 1s ease forwards; }
        .hero-sub { animation: fadeUp 1s ease 0.2s both; }
        .hero-cta { animation: fadeUp 1s ease 0.4s both; }
        .feature-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .feature-card:hover { transform: translateY(-8px); box-shadow: 0 20px 60px rgba(59,130,246,0.2); }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #3b82f6 25%, #8b5cf6 50%, #06b6d4 75%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .glow-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .glow-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 40px rgba(59,130,246,0.6);
        }
        .step-card { transition: all 0.3s ease; }
        .step-card:hover { transform: scale(1.02); }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '1.2rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        background: scrolled ? 'rgba(10,10,15,0.8)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
          StudyMate <span style={{ color: '#3b82f6' }}>AI</span>
        </span>
        <a href="/auth" style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#fff', padding: '0.6rem 1.5rem',
          borderRadius: '100px', textDecoration: 'none',
          fontSize: '0.9rem', fontWeight: '600',
          transition: 'all 0.3s ease',
        }}
          className="glow-btn"
        >
          Get Started
        </a>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <div style={{
          display: 'inline-block', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: '100px', padding: '0.4rem 1.2rem', marginBottom: '2rem',
          fontSize: '0.85rem', color: '#93c5fd', letterSpacing: '0.05em'
        }} className="hero-title">
          ✦ AI-Powered Study Platform
        </div>

        <h1 className="hero-title shimmer-text" style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: '800', lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-2px', fontFamily: "'Georgia', serif" }}>
          Study Smarter.<br />Not Harder.
        </h1>

        <p className="hero-sub" style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: 'rgba(255,255,255,0.5)', maxWidth: '600px', lineHeight: 1.7, marginBottom: '3rem' }}>
          Upload your notes, textbooks, or lecture slides. Our AI instantly generates a personalized quiz — so you learn faster and remember more.
        </p>

        <div className="hero-cta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/auth" className="glow-btn" style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: '#fff', padding: '1rem 2.5rem',
            borderRadius: '100px', textDecoration: 'none',
            fontSize: '1.1rem', fontWeight: '700',
            boxShadow: '0 0 30px rgba(59,130,246,0.4)'
          }}>
            Start for Free
          </a>
          <a href="#how" style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', padding: '1rem 2.5rem',
            borderRadius: '100px', textDecoration: 'none',
            fontSize: '1.1rem', fontWeight: '600',
            transition: 'all 0.3s ease'
          }}>
            See How It Works
          </a>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', animation: 'pulse 2s infinite' }}>
          <div style={{ width: '1px', height: '60px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.3))', margin: '0 auto' }} />
        </div>
      </section>

      {/* Stats */}
      <section style={{ position: 'relative', zIndex: 1, padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          {[
            { number: '10x', label: 'Faster than manual flashcards' },
            { number: '3', label: 'File formats supported' },
            { number: '100%', label: 'Free to get started' },
            { number: 'AI', label: 'Powered by latest models' },
          ].map((stat, i) => (
            <div key={i}>
              <p style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.number}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: '0.3rem' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ position: 'relative', zIndex: 1, padding: '8rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <p style={{ textAlign: 'center', color: '#3b82f6', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>How It Works</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: '800', marginBottom: '4rem', letterSpacing: '-1px' }}>
          Three steps to <span style={{ color: '#3b82f6' }}>exam ready</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {[
            { step: '01', icon: '📄', title: 'Upload Your Notes', desc: 'Drop in any PDF, Word document, or paste your notes directly. Any subject, any format.' },
            { step: '02', icon: '🤖', title: 'AI Generates Quiz', desc: 'Our AI reads your content and creates smart questions tailored to what you need to learn.' },
            { step: '03', icon: '🎯', title: 'Test & Track Progress', desc: 'Answer questions, reveal answers, and track your score. See yourself improve over time.' },
          ].map((item, i) => (
            <div key={i} className="step-card" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '2.5rem',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '3rem', fontWeight: '900', color: 'rgba(59,130,246,0.1)', fontFamily: 'monospace' }}>{item.step}</div>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.8rem' }}>{item.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontSize: '0.95rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 1, padding: '4rem 2rem 8rem', maxWidth: '1000px', margin: '0 auto' }}>
        <p style={{ textAlign: 'center', color: '#8b5cf6', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Features</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: '800', marginBottom: '4rem', letterSpacing: '-1px' }}>
          Everything you need to <span style={{ color: '#8b5cf6' }}>ace your exams</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: '🧠', title: 'Adaptive Questions', desc: 'More content = more questions. AI scales to your material.' },
            { icon: '📁', title: 'Multiple Formats', desc: 'PDF, Word (.docx), and plain text all supported.' },
            { icon: '👁️', title: 'Hidden Answers', desc: 'Test yourself before revealing the answer.' },
            { icon: '📊', title: 'Score Tracking', desc: 'Know exactly where you stand after every quiz.' },
            { icon: '📖', title: 'Quiz History', desc: 'Revisit and retake any quiz you have generated.' },
            { icon: '🔒', title: 'Private & Secure', desc: 'Your notes and quizzes are yours alone.' },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '2rem',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '6rem 2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 4rem)', fontWeight: '800', marginBottom: '1.5rem', letterSpacing: '-1px' }}>
          Ready to study <span className="shimmer-text">smarter?</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Join students who are already acing their exams with StudyMate AI.</p>
        <a href="/auth" className="glow-btn" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#fff', padding: '1.1rem 3rem',
          borderRadius: '100px', textDecoration: 'none',
          fontSize: '1.1rem', fontWeight: '700',
          boxShadow: '0 0 40px rgba(59,130,246,0.4)'
        }}>
          Get Started Free
        </a>
      </section>

      {/* Developer Section */}
      <section style={{ position: 'relative', zIndex: 1, padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#06b6d4', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>The Developer</p>
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%', margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: '900', color: '#fff',
            boxShadow: '0 0 40px rgba(59,130,246,0.4)',
            fontFamily: 'Georgia, serif'
          }}>
            M
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>M.Samuel</h3>
          <p style={{ color: '#3b82f6', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Full Stack Developer · IT Student
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontSize: '1rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Built StudyMate AI from scratch — from database design to AI integration to deployment. Passionate about building tools that make learning more effective and accessible.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Next.js', 'React', 'Supabase', 'AI APIs', 'TypeScript'].map((tech, i) => (
              <span key={i} style={{
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                color: '#93c5fd', padding: '0.4rem 1rem', borderRadius: '100px',
                fontSize: '0.8rem', fontWeight: '600'
              }}>{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
          Designed and Built by <span style={{ color: '#3b82f6', fontWeight: '600' }}>M. Samuel</span> · 2026
        </p>
      </footer>

    </main>
  )
}