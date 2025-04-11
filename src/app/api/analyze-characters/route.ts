import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';

export async function POST(request: Request) {
  const { text } = await request.json();
  
  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  // Get the locale from Accept-Language header or URL
  let locale = 'en';
  
  // Check if locale is in the request URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  // Try to find locale in URL path
  for (const segment of pathSegments) {
    if (hasLocale(routing.locales, segment)) {
      locale = segment;
      break;
    }
  }
  
  // Fallback to Accept-Language header if no locale found in URL
  if (locale === 'en') {
    const acceptLanguage = request.headers.get('Accept-Language');
    if (acceptLanguage && acceptLanguage.includes('ar')) {
      locale = 'ar';
    }
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
            content: `${locale === 'ar' ? 'أنت محلل أدبي محترف ومهمتك هي تحليل النصوص وتقديم النتائج حصراً باللغة العربية. هذا أمر ضروري وإلزامي.' : 'You are a professional literary analyzer who must analyze texts and provide results in English.'}
                     
                     ${locale === 'ar' ? 'التعليمات:' : 'Instructions:'}
                     ${locale === 'ar' 
                       ? '1. قم بتحليل النص المقدم بشكل شامل لتحديد جميع الشخصيات وتفاعلاتهم\n2. كن مفصلاً وشاملاً - حدد كل شخصية مذكورة، حتى الثانوية منها\n3. لا تضمن الكاتب أو الراوي كأحد الشخصيات؛ ركز فقط على الشخصيات داخل القصة\n4. حدد نوع الأدب (مثل الخيال العلمي، الغموض، الرومانسية، إلخ) بناءً على محتوى النص\n5. قيّم أسلوب الكتابة (رسمي/غير رسمي، وصفي/موجه للعمل)\n6. ترجم جميع النتائج إلى العربية، حتى لو كان النص الأصلي بالإنجليزية\n7. قدم البيانات بتنسيق JSON المحدد\n8. أعد فقط كائن JSON. لا تضمن أي شروحات أو مقدمات\n9. لا تضمن تنسيق ماركداون مثل ``` أو نص آخر'
                       : '1. Analyze the provided text THOROUGHLY to identify ALL characters and their interactions\n2. Be detailed and comprehensive - identify EVERY character mentioned, even minor ones\n3. DO NOT include the writer or narrator as a character; focus only on characters within the story\n4. Identify the likely genre (e.g., sci-fi, mystery, romance, etc.) based on the text content\n5. Assess the writing style (formal/informal, descriptive/action-oriented)\n6. Provide results in English\n7. Return data in the specified JSON format\n8. ONLY RETURN THE JSON OBJECT\n9. DO NOT include markdown formatting or other text'
                     }
                     
                     ${locale === 'ar' 
                       ? 'تحذير مهم: لقد لاحظنا أنك في بعض الأحيان ترجع نتائج باللغة الإنجليزية بدلاً من العربية. يجب أن تكون جميع النتائج باللغة العربية فقط. هذا شرط أساسي ومطلب إلزامي. لا تقدم أي محتوى بالإنجليزية في البيانات. أيضاً، لا تضمن الكاتب/المؤلف أو الراوي كشخصية.'
                       : 'Important note: DO NOT include the author, writer, or narrator as characters in your analysis.'
                     }
                     
                     ${locale === 'ar' ? 'تنسيق JSON المطلوب (أعد هذا فقط، لا شيء آخر):' : 'Required JSON format (RETURN ONLY THIS, nothing else):'}
                     {
                       "characters": [
                         {
                           "name": "${locale === 'ar' ? 'اسم الشخصية' : 'Character Name'}",
                           "description": "${locale === 'ar' ? 'وصف مختصر' : 'Brief description'}"
                         }
                       ],
                       "interactions": [
                         {
                           "source": "${locale === 'ar' ? 'اسم الشخصية المصدر' : 'Source Character Name'}",
                           "target": "${locale === 'ar' ? 'اسم الشخصية الهدف' : 'Target Character Name'}",
                           "description": "${locale === 'ar' ? 'وصف التفاعل' : 'Interaction description'}",
                           "strength": 1-10
                         }
                       ],
                       "genre": "${locale === 'ar' ? 'النوع الأدبي المتوقع' : 'Predicted genre'}",
                       "writingStyle": {
                         "formality": "${locale === 'ar' ? 'مستوى الرسمية (رسمي/غير رسمي)' : 'Level of formality (formal/informal)'}",
                         "approach": "${locale === 'ar' ? 'طريقة السرد (وصفي/موجه للعمل)' : 'Narrative approach (descriptive/action-oriented)'}",
                         "notes": "${locale === 'ar' ? 'ملاحظات إضافية عن الأسلوب' : 'Additional style observations'}"
                       }
                     }
                     
                     ${locale === 'ar' 
                       ? 'تذكير نهائي إلزامي: يجب أن تكون النتيجة النهائية باللغة العربية بالكامل، بدون أي كلمات إنجليزية. جميع الأسماء والأوصاف باللغة العربية. هذا أمر إلزامي وليس اختيارياً. لا تستخدم الإنجليزية مطلقاً في البيانات. تذكر: لا تضمن الكاتب أو الراوي كشخصية.' 
                       : 'FINAL REMINDER: IDENTIFY ALL CHARACTERS, EVEN MINOR ONES, BUT DO NOT INCLUDE THE WRITER OR NARRATOR. RETURN ONLY THE JSON OBJECT WITH NO ADDITIONAL TEXT OR EXPLANATION.'
                     }`
          },
          {
            role: "user",
            content: `${locale === 'ar' ? 'قم بتحليل النص التالي وتقديم النتائج باللغة العربية فقط. لا تضمن الكاتب أو الراوي كشخصية. قم بتحديد النوع الأدبي وتقييم أسلوب الكتابة أيضاً:\n\n' : 'Analyze the following text. Do not include the writer or narrator as a character. Also identify the genre and assess the writing style:\n\n'}${text}`
          }
        ],
        temperature: 0.1,
        response_format: { "type": "json_object" }
      })
    });

    const result = await response.json();

    console.log('result.choices');
    console.log(result);
    if(result.error) {
      return NextResponse.json(
        { error: 'Failed to analyze characters - free tier rate limit exceeded - please wait a minute and try again' },
        { status: 500 }
      );
    }
    // Extract pure JSON from response that might contain markdown
    const content = result.choices[0].message.content;


    // Handle different response formats 
    let jsonData = '';
    
    // Case 1: Markdown code blocks
    if (content.includes("```json") || content.includes("```")) {
      const match = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        jsonData = match[1].trim();
      }
    } 
    // Case 2: JSON format section
    else if (content.includes('formato JSON') || content.includes('JSON format')) {
      const match = content.match(/(?:formato JSON|JSON format)[^\{]*(\{[\s\S]*\})/i);
      if (match && match[1]) {
        jsonData = match[1].trim();
      }
    }
    // Case 3: Just find any JSON object in the content
    else {
      // Look for a JSON structure with characters and interactions
      const match = content.match(/(\{[\s\S]*"characters"[\s\S]*"interactions"[\s\S]*)/);
      if (match && match[1]) {
        jsonData = match[1].trim();
        
        // Check if JSON is complete, otherwise attempt to complete it
        const openBraces = (jsonData.match(/\{/g) || []).length;
        const closeBraces = (jsonData.match(/\}/g) || []).length;
        
        // Add missing closing braces if needed
        if (openBraces > closeBraces) {
          jsonData += ']}'.repeat(openBraces - closeBraces);
        }
      }
    }
    
    // If no JSON found, use the entire content as last resort
    if (!jsonData) {
      jsonData = content;
    }

    // Try to fix common JSON issues
    jsonData = fixJsonString(jsonData);

    // Remove any additional text/comments
    try {
      // Try parsing to ensure we have clean JSON
      const analysisData = JSON.parse(jsonData);
      
      // If we requested Arabic but got English, return an error
      if (locale === 'ar') {
        // Check a sample of the response to see if it's in Arabic
        const sampleText = analysisData.characters && analysisData.characters.length > 0 
          ? analysisData.characters[0].description || ''
          : '';
          
        // Simple check - if the text contains common English words but no Arabic characters
        const hasEnglishOnly = /\b(the|and|is|in|of|to)\b/i.test(sampleText) && 
          !/[\u0600-\u06FF]/.test(sampleText);
          
        if (hasEnglishOnly) {
          console.error('Got English response when Arabic was requested');
          return NextResponse.json(
            { error: 'النتائج لم تكن باللغة العربية. الرجاء المحاولة مرة أخرى.' },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(analysisData);
    } catch (error) {
      console.error('Error parsing JSON:', error, jsonData);
      
      // Last attempt - try to reconstruct JSON from the response
      try {
        // Extract all key parts
        const charactersMatch = content.match(/"characters"\s*:\s*\[([\s\S]*?)\]/);
        const interactionsMatch = content.match(/"interactions"\s*:\s*\[([\s\S]*?)\]/);
        
        if (charactersMatch && interactionsMatch) {
          const reconstructedJson = `{
            "characters": [${charactersMatch[1]}],
            "interactions": [${interactionsMatch[1]}]
          }`;
          
          const fixedJson = fixJsonString(reconstructedJson);
          const analysisData = JSON.parse(fixedJson);
          return NextResponse.json(analysisData);
        }
        
        // If specific extraction failed, try one last generic approach
        const lastResortMatch = content.match(/\{[\s\S]*\}/);
        if (lastResortMatch) {
          const lastResortJson = fixJsonString(lastResortMatch[0]);
          const analysisData = JSON.parse(lastResortJson);
          return NextResponse.json(analysisData);
        }
      } catch (innerError) {
        console.error('Last resort JSON parsing failed:', innerError);
      }
      
      return NextResponse.json(
        { error: 'Failed to parse analysis results. Please try again.' },
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

// Helper function to fix common JSON issues
function fixJsonString(jsonString: string): string {
  // Fix trailing commas (common issue)
  let fixed = jsonString.replace(/,\s*([}\]])/g, '$1');
  
  // Ensure all property names are double-quoted
  fixed = fixed.replace(/(\s*)([a-zA-Z0-9_]+)(\s*):/g, '$1"$2"$3:');
  
  // Check for and fix missing closing brackets
  const openBraces = (fixed.match(/\{/g) || []).length;
  const closeBraces = (fixed.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    fixed += '}'.repeat(openBraces - closeBraces);
  }
  
  // Check for and fix missing closing square brackets
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    fixed += ']'.repeat(openBrackets - closeBrackets);
  }
  
  return fixed;
} 