import { NextRequest } from 'next/server'
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
        return new Response(JSON.stringify({ error: 'Unsupported file type' }), { status: 400 })
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
        max_tokens: 150 * questionCount,
        temperature: 0.3,
        stream: true,
        messages: [
          {
            role: 'user',
            content: `Generate exactly ${questionCount} quiz questions from these notes.
Format each question exactly like this:
Q: [question]
Answer: [answer]

Notes: ${notes.slice(0, 2000)}`
          }
        ]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(`data: ${JSON.stringify({ error: err })}\n\n`, {
        headers: { 'Content-Type': 'text/event-stream' }
      })
    }

    // Stream the response directly to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

          for (const line of lines) {
            const data = line.replace('data: ', '')
            if (data === '[DONE]') {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              break
            }
            try {
              const parsed = JSON.parse(data)
              const text = parsed.choices?.[0]?.delta?.content || ''
              if (text) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`))
              }
            } catch {}
          }
        }
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('FULL ERROR:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
}