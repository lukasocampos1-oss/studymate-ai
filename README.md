# StudyMate AI

An AI-powered study platform that generates quizzes from your notes.

## Live Demo
https://studymate-ai-rakf156.vercel.app

## Features
- Upload notes as text, PDF, Word (.docx), or .txt
- AI generates adaptive quiz questions based on content length
- Show/hide answers with score tracking
- Quiz history saved per user
- Difficulty selector (Easy / Medium / Hard)
- Keyboard shortcuts: Space to reveal, 1 = correct, 2 = wrong
- Autosaves notes locally
- Fully responsive on mobile and desktop

## Tech Stack
- Next.js 14 + TypeScript
- Tailwind CSS
- Supabase (Auth + Database)
- OpenRouter AI API
- Mammoth (Word parsing)
- pdf2json (PDF parsing)
- Vercel (Deployment)

## Setup
1. Clone the repo
2. Run `npm install`
3. Create `.env.local` with: