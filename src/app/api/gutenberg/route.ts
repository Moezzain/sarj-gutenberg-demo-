import { NextResponse } from 'next/server';

// Helper function to extract metadata from HTML
function extractBookMetadata(html: string) {
  const metadata: {
    title?: string;
    author?: string;
    language?: string;
    subjects?: string[];
    summary?: string;
    coverImage?: string;
  } = {
    subjects: []
  };

  try {
    // Title extraction
    const titleMatch = html.match(/<meta name="title" content="([^"]+)">/);
    if (titleMatch && titleMatch[1]) {
      let title = titleMatch[1];
      // Remove "by Author Name" if present
      title = title.replace(/ by [^|]+$/, '');
      metadata.title = title.trim();
    }

    // Author extraction
    const authorMatch = html.match(/<a href="\/ebooks\/author\/\d+" rel="marcrel:aut"[^>]*>([^<]+)<\/a>/);
    if (authorMatch && authorMatch[1]) {
      metadata.author = authorMatch[1].trim();
    }

    // Language extraction
    const languageMatch = html.match(/<tr[^>]*itemprop="inLanguage"[^>]*>[\s\S]*?<td>([^<]+)<\/td>/);
    if (languageMatch && languageMatch[1]) {
      metadata.language = languageMatch[1].trim();
    }

    // Subjects extraction
    const subjectMatches = html.matchAll(/<th>Subject<\/th>\s*<td[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g);
    for (const match of subjectMatches) {
      if (match[1]) {
        metadata.subjects?.push(match[1].trim());
      }
    }

    // Summary extraction
    const summaryMatch = html.match(/<span class="toggle-content">\s*([^<]+)/);
    if (summaryMatch && summaryMatch[1]) {
      metadata.summary = summaryMatch[1].trim();
    }

    // Cover image extraction
    const coverMatch = html.match(/<img class="cover-art" src="([^"]+)"/);
    if (coverMatch && coverMatch[1]) {
      metadata.coverImage = coverMatch[1];
    }
  } catch (error) {
    console.error("Error extracting metadata:", error);
  }

  return metadata;
}

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
    
    // Get and parse the metadata HTML
    const metadataHtml = await metadataResponse.text();
    const bookMetadata = extractBookMetadata(metadataHtml);

    return NextResponse.json({ 
      success: true, 
      bookId, 
      metadataAvailable: metadataResponse.ok,
      metadata: bookMetadata,
      content: content.slice(0, 20000) + "..."
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Can\'t find book' },
      { status: 500 }
    );
  }
} 