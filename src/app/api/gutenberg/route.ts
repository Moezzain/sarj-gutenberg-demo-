import { NextResponse } from 'next/server';

// Types for better type safety
interface BookMetadata {
  title?: string;
  author?: string;
  language?: string;
  subjects?: string[];
  summary?: string;
  coverImage?: string;
}

interface GutenbergResponse {
  success: boolean;
  bookId: string;
  metadataAvailable: boolean;
  contentAvailable: boolean;
  metadata: BookMetadata;
  content: string | null;
  error?: string;
}

// Constants
const GUTENBERG_BASE_URL = 'https://www.gutenberg.org';
const USER_AGENT = 'Mozilla/5.0 (compatible; GutenbergAnalyzer/1.0)';
const CONTENT_PREVIEW_LENGTH = 20000;

// Helper function to extract metadata from HTML
function extractBookMetadata(html: string): BookMetadata {
  const metadata: BookMetadata = {
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

// Helper function to fetch data from Gutenberg
async function fetchFromGutenberg(url: string): Promise<Response> {
  return fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
    },
  });
}

export async function GET(request: Request): Promise<NextResponse<GutenbergResponse>> {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');

  if (!bookId) {
    return NextResponse.json({ 
      success: false, 
      bookId: '', 
      metadataAvailable: false, 
      contentAvailable: false, 
      metadata: {}, 
      content: null,
      error: 'Book ID is required' 
    }, { status: 400 });
  }

  try {
    // Fetch metadata and content in parallel
    const [metadataResponse, contentResponse] = await Promise.all([
      fetchFromGutenberg(`${GUTENBERG_BASE_URL}/ebooks/${bookId}`),
      fetchFromGutenberg(`${GUTENBERG_BASE_URL}/files/${bookId}/${bookId}-0.txt`)
    ]);

    // Check if metadata request was successful
    if (!metadataResponse.ok) {
      return NextResponse.json({
        success: false,
        bookId,
        metadataAvailable: false,
        contentAvailable: false,
        metadata: {},
        content: null,
        error: 'Failed to fetch book metadata'
      }, { status: metadataResponse.status });
    }

    // Process content
    let content = null;
    let contentAvailable = false;

    if (contentResponse.ok) {
      content = await contentResponse.text();
      contentAvailable = true;
    }
    
    // Get and parse the metadata HTML
    const metadataHtml = await metadataResponse.text();
    const bookMetadata = extractBookMetadata(metadataHtml);

    return NextResponse.json({ 
      success: true, 
      bookId,
      metadataAvailable: metadataResponse.ok,
      contentAvailable,
      metadata: bookMetadata,
      content: contentAvailable && content ? content.slice(0, CONTENT_PREVIEW_LENGTH) + "..." : null
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json({
      success: false,
      bookId,
      metadataAvailable: false,
      contentAvailable: false,
      metadata: {},
      content: null,
      error: 'Can\'t find book'
    }, { status: 500 });
  }
} 