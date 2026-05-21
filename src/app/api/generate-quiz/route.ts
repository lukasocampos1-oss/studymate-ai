import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { notes } = await request.json()

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
       model: 'nvidia/nemotron-3-super-120b-a12b:free',
        messages: [
          {
            role: 'user',
            content: `Based on these study notes, generate 5 multiple choice quiz questions.
            Format each question like this:
            Q: [question]
            A) [option]
            B) [option]
            C) [option]
            D) [option]
            Answer: [correct letter]
            
            Notes: ${notes}`
          }
        ]
      })
    })

    const data = await response.json()
    console.log('OPENROUTER RESPONSE:', JSON.stringify(data))
    
    if (data.error) {
      return NextResponse.json({ quiz: 'API Error: ' + data.error.message })
    }

    const text = data.choices?.[0]?.message?.content || 'No response generated'
    return NextResponse.json({ quiz: text })

  } catch (error) {
    console.error('FULL ERROR:', error)
    return NextResponse.json({ quiz: 'Error: ' + String(error) })
  }
}