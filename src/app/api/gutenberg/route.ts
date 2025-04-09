import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  if (!bookId) {
    return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
  }

  try {
    // Fetch metadata
    const metadataResponse = await fetch(`https://www.gutenberg.org/ebooks/${bookId}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GutenbergAnalyzer/1.0)',
      },
    });

    // Fetch content
    const contentResponse = await fetch(`https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GutenbergAnalyzer/1.0)',
      },
    });

    // Check if both requests were successful
    if (!metadataResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch book metadata' },
        { status: metadataResponse.status }
      );
    }

    if (!contentResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch book content' },
        { status: contentResponse.status }
      );
    }

    // Get the content as text
    const content = await contentResponse.text();
    
    // For metadata, we'll just check that it's available
    // In a real app, you might want to parse the HTML to extract specific metadata
    const metadataAvailable = metadataResponse.ok;

    console.log(metadataResponse.text());
    return NextResponse.json({ 
      success: true, 
      bookId, 
      metadataAvailable,
      metadata: metadataResponse.text(),
      content: content.slice(0, 25000) + "..." // Just sending the first 7500 chars because the api can handle 8192 tokens 8,192 tokens ≈ 32,000-35,000 characters
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Can\'t find book' },
      { status: 500 }
    );
  }
} 