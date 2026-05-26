import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['docx', 'txt', 'pdf']

async function extractPdfText(buffer: Buffer): Promise<string> {
  const PDFParser = (await import('pdf2json')).default
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser()
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      const text = pdfData.Pages.map((page: any) =>
        page.Texts.map((t: any) =>
          decodeURIComponent(t.R.map((r: any) => r.T).join(''))
        ).join(' ')
      ).join('\n')
      resolve(text)
    })
    pdfParser.on('pdfParser_dataError', (err: any) => {
      reject(new Error(err.parserError))
    })
    pdfParser.parseBuffer(buffer)
  })
}

export async function POST(request: NextRequest) {
  try {
    let notes = ''
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File is too large. Maximum size is 5MB.' }, { status: 400 })
      }

      const fileType = file.name.split('.').pop()?.toLowerCase()
      if (!fileType || !ALLOWED_TYPES.includes(fileType)) {
        return NextResponse.json({ error: 'Invalid file type. Please upload a .docx, .pdf, or .txt file.' }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      if (fileType === 'docx') {
        const result = await mammoth.extractRawText({ buffer })
        notes = result.value
      } else if (fileType === 'txt') {
        notes = buffer.toString('utf-8')
      } else if (fileType === 'pdf') {
        notes = await extractPdfText(buffer)
      }

      if (!notes.trim()) {
        return NextResponse.json({ error: 'Could not extract text from this file. Make sure the file contains readable text.' }, { status: 400 })
      }

    } else {
      const body = await request.json()
      notes = body.notes

      if (!notes || !notes.trim()) {
        return NextResponse.json({ error: 'Please enter some notes before generating a quiz.' }, { status: 400 })
      }
    }

    const wordCount = notes.trim().split(/\s+/).length
    let questionCount = 5
    if (wordCount > 800) questionCount = 15
    else if (wordCount > 400) questionCount = 10
    else if (wordCount > 150) questionCount = 7

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    let response
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-super-120b-a12b:free',
          max_tokens: 200 * questionCount,
          temperature: 0.3,
          messages: [{
            role: 'user',
            content: `Generate exactly ${questionCount} quiz questions from these notes.
Format each question exactly like this — no extra text:
Q: [question]
Answer: [full answer explanation]

Notes: ${notes.slice(0, 3000)}`
          }]
        })
      })
    } catch (fetchError: any) {
      clearTimeout(timeout)
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: 'The AI took too long to respond. Please try again with shorter notes.' }, { status: 408 })
      }
      throw fetchError
    }
    clearTimeout(timeout)

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: 'AI service error: ' + data.error.message }, { status: 502 })
    }

    const text = data.choices?.[0]?.message?.content
    if (!text) {
      return NextResponse.json({ error: 'The AI returned an empty response. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ quiz: text, questionCount })

  } catch (error: any) {
    console.error('Quiz generation error:', error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}