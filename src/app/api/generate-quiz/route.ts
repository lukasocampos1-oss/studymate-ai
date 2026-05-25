import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

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
      const fileType = file.name.split('.').pop()?.toLowerCase()

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      if (fileType === 'docx') {
        const result = await mammoth.extractRawText({ buffer })
        notes = result.value
      } else if (fileType === 'txt') {
        notes = buffer.toString('utf-8')
      } else if (fileType === 'pdf') {
        notes = await extractPdfText(buffer)
      } else {
        return NextResponse.json({ quiz: 'Error: Only .docx, .txt and .pdf files are supported' })
      }
    } else {
      const body = await request.json()
      notes = body.notes
    }

    const wordCount = notes.trim().split(/\s+/).length
let questionCount = 5
if (wordCount > 600) questionCount = 7
else if (wordCount > 300) questionCount = 6
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b:free',
        max_tokens: 200 * questionCount,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: `Generate exactly ${questionCount} quiz questions from these notes.
Format each question exactly like this — no extra text:
Q: [question]
Answer: [full answer explanation]

Notes: ${notes.slice(0, 3000)}`
          }
        ]
      })
    })

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ quiz: 'API Error: ' + data.error.message })
    }

    const text = data.choices?.[0]?.message?.content || 'No response generated'
    return NextResponse.json({ quiz: text, questionCount })

  } catch (error) {
    console.error('FULL ERROR:', error)
    return NextResponse.json({ quiz: 'Error: ' + String(error) })
  }
}