'use client'
import { useEffect, useState, useRef } from 'react'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const featuresRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const devRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    const sections = [
      { ref: featuresRef, key: 'features' },
      { ref: stepsRef, key: 'steps' },
      { ref: ctaRef, key: 'cta' },
      { ref: devRef, key: 'dev' },
    ]
    sections.forEach(({ ref, key }) => {
      if (!ref.current) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setVisible(prev => ({ ...prev, [key]: true })) },
        { threshold: 0.1 }
      )
      obs.observe(ref.current)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowInstall(false)
    setDeferredPrompt(null)
  }

  const navScrolled = scrollY > 40

  return (
    <main style={{ margin: 0, padding: 0, fontFamily: "'Inter', 'Segoe UI', sans-serif", overflowX: 'hidden', background: '#060610' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; transition: all 0.4s ease; padding: 1.4rem 2.5rem; display: flex; justify-content: space-between; align-items: center; }
        .nav.scrolled { background: rgba(6,6,16,0.9); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 1rem 2.5rem; }
        .nav-logo { font-size: 1.3rem; font-weight: 800; color: #fff; letter-spacing: -0.5px; text-decoration: none; }
        .nav-logo span { background: linear-gradient(135deg, #818cf8, #c084fc, #67e8f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-btn { background: rgba(129,140,248,0.12); color: #a5b4fc; border: 1px solid rgba(129,140,248,0.25); padding: 0.6rem 1.5rem; border-radius: 100px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.25s; text-decoration: none; font-family: inherit; }
        .nav-btn:hover { background: rgba(129,140,248,0.22); border-color: rgba(129,140,248,0.45); color: #fff; transform: translateY(-1px); }
        .hero { min-height: 100vh; background: #060610; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px); background-size: 60px 60px; animation: gridPulse 8s ease-in-out infinite; }
        @keyframes gridPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .orb { position: absolute; border-radius: 50%; pointer-events: none; animation: orbFloat 12s ease-in-out infinite alternate; }
        .orb-1 { width: 700px; height: 700px; background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 65%); top: -200px; left: -150px; animation-duration: 14s; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%); bottom: -100px; right: -100px; animation-duration: 10s; animation-delay: -4s; }
        .orb-3 { width: 350px; height: 350px; background: radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 65%); top: 35%; left: 55%; animation-duration: 16s; animation-delay: -8s; }
        .orb-4 { width: 250px; height: 250px; background: radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 65%); top: 60%; left: 10%; animation-duration: 11s; animation-delay: -2s; }
        @keyframes orbFloat { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(30px,40px) scale(1.08)} }
        .hero-content { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 9rem 1.5rem 5rem; }
        .hero-badge { display: inline-flex; align-items: center; gap: 0.6rem; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.22); border-radius: 100px; padding: 0.45rem 1.2rem; font-size: 0.8rem; color: #a5b4fc; font-weight: 500; margin-bottom: 2.2rem; letter-spacing: 0.04em; animation: badgePulse 3s ease-in-out infinite; }
        @keyframes badgePulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0)} 50%{box-shadow:0 0 20px 2px rgba(99,102,241,0.15)} }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #818cf8; animation: dotPulse 2s ease-in-out infinite; }
        @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
        .hero-title { font-size: clamp(2.8rem, 7.5vw, 6rem); font-weight: 900; color: #fff; line-height: 1.04; letter-spacing: -2.5px; margin-bottom: 1.6rem; max-width: 820px; animation: heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) both; }
        .hero-title-grad { background: linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #67e8f9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-size: 200% auto; animation: gradShift 6s ease infinite; }
        @keyframes gradShift { 0%,100%{background-position:0% center} 50%{background-position:100% center} }
        @keyframes heroFadeUp { from{opacity:0;transform:translateY(50px)} to{opacity:1;transform:translateY(0)} }
        .hero-sub { font-size: clamp(1rem, 2.2vw, 1.25rem); color: rgba(255,255,255,0.42); max-width: 560px; line-height: 1.8; margin-bottom: 2.8rem; animation: heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .hero-cta-row { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-bottom: 5rem; animation: heroFadeUp 1s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
        .cta-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 1rem 2.4rem; border-radius: 100px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s; text-decoration: none; font-family: inherit; box-shadow: 0 8px 30px rgba(99,102,241,0.4); }
        .cta-primary:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 50px rgba(99,102,241,0.5); }
        .cta-secondary { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.1); padding: 1rem 2.4rem; border-radius: 100px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; text-decoration: none; font-family: inherit; }
        .cta-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
        .install-btn { background: rgba(255,255,255,0.06); color: #a5b4fc; border: 1px solid rgba(129,140,248,0.3); padding: 1rem 2.4rem; border-radius: 100px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; font-family: inherit; }
        .install-btn:hover { background: rgba(129,140,248,0.15); border-color: rgba(129,140,248,0.5); transform: translateY(-2px); }
        .stats-bar { position: relative; z-index: 1; display: flex; justify-content: center; border-top: 1px solid rgba(255,255,255,0.05); }
        .stat-item { flex: 1; max-width: 220px; text-align: center; padding: 2rem 1rem; border-right: 1px solid rgba(255,255,255,0.05); transition: background 0.3s; }
        .stat-item:last-child { border-right: none; }
        .stat-item:hover { background: rgba(99,102,241,0.04); }
        .stat-num { font-size: 2rem; font-weight: 900; background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stat-label { font-size: 0.78rem; color: rgba(255,255,255,0.3); margin-top: 0.3rem; font-weight: 500; }
        .dark-section { background: #060610; }
        .section-inner { max-width: 1080px; margin: 0 auto; padding: 7rem 1.5rem; }
        .section-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #818cf8; margin-bottom: 0.9rem; }
        .section-title { font-size: clamp(1.9rem, 4vw, 3rem); font-weight: 900; color: #fff; letter-spacing: -1.5px; line-height: 1.15; margin-bottom: 1rem; }
        .section-sub { font-size: 1rem; color: rgba(255,255,255,0.38); max-width: 480px; line-height: 1.75; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.2rem; margin-top: 3.5rem; }
        .feature-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 2rem; transition: all 0.4s cubic-bezier(0.22,1,0.36,1); position: relative; overflow: hidden; }
        .feature-card::before { content:''; position:absolute; inset:0; background: linear-gradient(135deg, rgba(99,102,241,0.06), transparent); opacity:0; transition: opacity 0.4s; border-radius: 20px; }
        .feature-card:hover { border-color: rgba(129,140,248,0.3); transform: translateY(-8px) scale(1.01); box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(99,102,241,0.1); }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)); border: 1px solid rgba(99,102,241,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 1.2rem; font-size: 1.4rem; }
        .feature-title { font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 0.55rem; }
        .feature-desc { font-size: 0.87rem; color: rgba(255,255,255,0.38); line-height: 1.7; }
        .steps-section { background: #0c0c1a; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); }
        .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2.5rem; margin-top: 3.5rem; }
        .step-card { position: relative; padding: 2rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; transition: all 0.4s cubic-bezier(0.22,1,0.36,1); }
        .step-card:hover { border-color: rgba(129,140,248,0.25); transform: translateY(-5px); box-shadow: 0 16px 50px rgba(0,0,0,0.4), 0 0 30px rgba(99,102,241,0.08); }
        .step-num { font-size: 3.5rem; font-weight: 900; background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; margin-bottom: 1rem; }
        .step-title { font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 0.7rem; }
        .step-desc { font-size: 0.88rem; color: rgba(255,255,255,0.38); line-height: 1.75; }
        .cta-section { background: #060610; padding: 8rem 1.5rem; text-align: center; position: relative; overflow: hidden; }
        .cta-orb { position: absolute; width: 700px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; animation: ctaOrbPulse 6s ease-in-out infinite; }
        @keyframes ctaOrbPulse { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.08)} }
        .cta-title { font-size: clamp(2.2rem, 5.5vw, 4rem); font-weight: 900; color: #fff; letter-spacing: -2px; line-height: 1.08; margin-bottom: 1.2rem; position: relative; z-index: 1; }
        .cta-sub { font-size: 1.05rem; color: rgba(255,255,255,0.35); margin-bottom: 2.8rem; position: relative; z-index: 1; }
        .dev-section { background: #0c0c1a; border-top: 1px solid rgba(255,255,255,0.04); padding: 6rem 1.5rem; }
        .dev-inner { max-width: 660px; margin: 0 auto; text-align: center; }
        .dev-avatar { width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 900; color: #fff; margin: 0 auto 1.4rem; box-shadow: 0 0 0 4px rgba(99,102,241,0.15), 0 0 50px rgba(99,102,241,0.3); animation: avatarGlow 4s ease-in-out infinite; }
        @keyframes avatarGlow { 0%,100%{box-shadow:0 0 0 4px rgba(99,102,241,0.15),0 0 50px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 0 8px rgba(99,102,241,0.1),0 0 80px rgba(99,102,241,0.4)} }
        .dev-name { font-size: 1.7rem; font-weight: 900; color: #fff; letter-spacing: -0.8px; margin-bottom: 0.4rem; }
        .dev-role { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1.4rem; }
        .dev-bio { font-size: 0.95rem; color: rgba(255,255,255,0.38); line-height: 1.85; max-width: 460px; margin: 0 auto 2rem; }
        .tech-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
        .tech-pill { background: rgba(99,102,241,0.08); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.2); padding: 0.38rem 1rem; border-radius: 100px; font-size: 0.78rem; font-weight: 600; transition: all 0.25s; }
        .tech-pill:hover { background: rgba(99,102,241,0.16); border-color: rgba(99,102,241,0.4); transform: translateY(-2px); }
        .footer { background: #060610; border-top: 1px solid rgba(255,255,255,0.04); padding: 2rem 1.5rem; text-align: center; }
        .footer p { font-size: 0.8rem; color: rgba(255,255,255,0.18); }
        .footer span { color: #818cf8; font-weight: 600; }
        .fade-up { opacity: 0; transform: translateY(35px); transition: all 0.8s cubic-bezier(0.22,1,0.36,1); }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }
        .delay-4 { transition-delay: 0.4s; }
        .delay-5 { transition-delay: 0.5s; }
        .delay-6 { transition-delay: 0.6s; }
        @keyframes floatIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 640px) {
          .stats-bar { flex-wrap: wrap; }
          .stat-item { min-width: 50%; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .nav { padding: 1rem 1.2rem; }
          .nav.scrolled { padding: 0.8rem 1.2rem; }
          .hero-title { letter-spacing: -1.5px; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav ${navScrolled ? 'scrolled' : ''}`}>
        <a href="/" className="nav-logo">StudyMate <span>AI</span></a>
        <a href="/auth" className="nav-btn">Get started</a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />

        <div className="hero-content">
          <div className="hero-badge">
            <div className="badge-dot" />
            AI-Powered Study Platform
          </div>
          <h1 className="hero-title">
            Turn your notes into<br />
            <span className="hero-title-grad">exam-ready quizzes</span>
          </h1>
          <p className="hero-sub">
            Upload your lecture notes, textbooks, or slides. Our AI instantly generates smart, personalized quizzes — so you retain more and score higher.
          </p>
          <div className="hero-cta-row">
            <a href="/auth" className="cta-primary">Start for free</a>
            <a href="#how" className="cta-secondary">See how it works</a>
            {showInstall && (
              <button onClick={handleInstall} className="install-btn">
                📲 Install App
              </button>
            )}
          </div>
        </div>

        <div className="stats-bar">
          {[
            { num: '10x', label: 'Faster than manual flashcards' },
            { num: '3', label: 'File formats supported' },
            { num: '100%', label: 'Free to get started' },
            { num: 'AI', label: 'Adaptive question generation' },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="dark-section">
        <div className="section-inner" ref={featuresRef}>
          <div className={`fade-up ${visible.features ? 'visible' : ''}`}>
            <p className="section-label">Features</p>
            <h2 className="section-title">Everything you need<br />to ace your exams</h2>
            <p className="section-sub">Built for students who want results — not just another study app.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: '🧠', title: 'Adaptive questions', desc: 'Short notes get 5 questions. Long documents get up to 15. The AI scales intelligently to your content.', d: 1 },
              { icon: '📁', title: 'Multiple file formats', desc: 'Upload Word documents, PDFs, or plain text files. Or just paste your notes directly.', d: 2 },
              { icon: '👁️', title: 'Hidden answers', desc: 'Test yourself first. Reveal the answer only when you are ready — simulating real exam conditions.', d: 3 },
              { icon: '📊', title: 'Score tracking', desc: 'Mark each answer right or wrong and get an instant score with emoji feedback at the end.', d: 4 },
              { icon: '📖', title: 'Quiz history', desc: 'Every quiz you generate is saved. Revisit and retake any past quiz at any time.', d: 5 },
              { icon: '🔒', title: 'Private & secure', desc: 'Your notes and quizzes are completely private. Only you can access your account data.', d: 6 },
            ].map((f, i) => (
              <div key={i} className={`feature-card fade-up delay-${f.d} ${visible.features ? 'visible' : ''}`}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="steps-section" id="how">
        <div className="section-inner" ref={stepsRef}>
          <div className={`fade-up ${visible.steps ? 'visible' : ''}`}>
            <p className="section-label">How it works</p>
            <h2 className="section-title">Three steps to<br />exam ready</h2>
          </div>
          <div className="steps-grid">
            {[
              { num: '01', title: 'Upload your notes', desc: 'Drop in any PDF, Word document, or paste your notes directly. Any subject, any format works.', d: 1 },
              { num: '02', title: 'AI builds your quiz', desc: 'Our AI reads your content and crafts smart questions tailored exactly to what you need to learn.', d: 2 },
              { num: '03', title: 'Test and track progress', desc: 'Answer questions, reveal answers on your terms, and watch your score improve every session.', d: 3 },
            ].map((s, i) => (
              <div key={i} className={`step-card fade-up delay-${s.d} ${visible.steps ? 'visible' : ''}`}>
                <div className="step-num">{s.num}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" ref={ctaRef}>
        <div className="cta-orb" />
        <div className={`fade-up ${visible.cta ? 'visible' : ''}`}>
          <h2 className="cta-title">Ready to study<br />smarter?</h2>
          <p className="cta-sub">Join students already acing their exams with StudyMate AI.</p>
          <a href="/auth" className="cta-primary" style={{ display: 'inline-block', position: 'relative', zIndex: 1 }}>
            Get started for free
          </a>
        </div>
      </section>

      {/* DEVELOPER */}
      <section className="dev-section" ref={devRef}>
        <div className={`dev-inner fade-up ${visible.dev ? 'visible' : ''}`}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#06b6d4', marginBottom: '1.8rem' }}>The Developer</p>
          <div className="dev-avatar">M</div>
          <div className="dev-name">M.Samuel</div>
          <div className="dev-role">Full Stack Developer · IT Student</div>
          <p className="dev-bio">
            Built StudyMate AI entirely from scratch — database architecture, AI integration, authentication, file processing, and deployment. Passionate about building tools that make learning faster and more effective for everyone.
          </p>
          <div className="tech-pills">
            {['Next.js', 'React', 'TypeScript', 'Supabase', 'AI APIs', 'Vercel'].map((t, i) => (
              <span key={i} className="tech-pill">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>Designed and Built by <span>M. Samuel</span> · 2026</p>
      </footer>

      {/* FLOATING INSTALL BUTTON */}
      {showInstall && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999,
          animation: 'floatIn 0.5s ease both'
        }}>
          <button
            onClick={handleInstall}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none',
              padding: '1rem 1.8rem',
              borderRadius: '100px',
              fontSize: '0.95rem', fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(99,102,241,0.5)',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            📲 Install StudyMate AI
          </button>
        </div>
      )}

    </main>
  )
}