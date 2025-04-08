import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { text } = await request.json();
  
  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  try {
    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: `Analyze the following text and identify all characters and their interactions with each other. 
                     For each character provide: name, brief description, and list of interactions with other characters.
                     Return the data in JSON format with this structure:
                     {
                       "characters": [
                         {
                           "name": "Character Name",
                           "description": "Brief description",
                         }
                       ],
                       "interactions": [
                         {
                           "source": "Character Name",
                           "target": "Other Character Name",
                           "description": "Brief description of their interaction",
                           "strength": 1-10 (where 10 is strongest connection)
                         }
                       ]
                     }`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.2
      })
    });

    const result = await response.json();

    // Extract pure JSON from response that might contain markdown
    let content = result.choices[0].message.content;

    // Handle markdown code blocks
    if (content.includes("```json") || content.includes("```")) {
      // Extract content between code blocks
      const match = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        content = match[1];
      }
    }

    // Remove any additional text/comments
    try {
      // Try parsing to ensure we have clean JSON
      const analysisData = JSON.parse(content);
      console.log(analysisData);
      return NextResponse.json(analysisData);
    } catch (error) {
      console.error('Error parsing JSON:', error, content);
      return NextResponse.json(
        { error: 'Failed to parse analysis results' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error analyzing characters:', error);
    return NextResponse.json(
      { error: 'An error occurred while analyzing the text' },
      { status: 500 }
    );
  }
} 