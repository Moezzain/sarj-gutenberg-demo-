"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ClientOnly from "@/components/ClientOnly";
import { useTranslations } from "next-intl";
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Types
interface BookMetadata {
  title?: string;
  author?: string;
  language?: string;
  subjects?: string[];
  summary?: string;
  coverImage?: string;
  metadataAvailable?: boolean;
}

interface BookData {
  success: boolean;
  bookId: string;
  metadataAvailable: boolean;
  metadata: BookMetadata;
  content: string;
}

interface Character {
  name: string;
  description: string;
}

interface Interaction {
  source: string;
  target: string;
  description: string;
  strength: number;
}

interface WritingStyle {
  formality: string;
  approach: string;
  notes: string;
}

interface CharacterAnalysis {
  characters: Character[];
  interactions: Interaction[];
  genre: string;
  writingStyle: WritingStyle;
}

interface FormData {
  bookId: string;
}

interface TranslationFunction {
  (key: string, params?: Record<string, string | number>): string;
}

// Components
const CharacterGraph = dynamic(() => import('@/components/CharacterGraph'), { ssr: false });

// Sub-components for better organization
const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const BookMetadataDisplay = ({ 
  metadata, 
  bookId, 
  t 
}: { 
  metadata: BookMetadata & { metadataAvailable?: boolean }; 
  bookId: string; 
  t: TranslationFunction 
}) => (
  <div className="flex flex-wrap items-start gap-6">
    {metadata.coverImage && (
      <div className="w-36 flex-shrink-0 rounded overflow-hidden shadow-md relative">
        <Image 
          src={metadata.coverImage} 
          alt={metadata.title || "Book cover"} 
          width={144}
          height={216}
          className="object-cover"
          unoptimized={metadata.coverImage.startsWith('https://www.gutenberg.org')}
        />
      </div>
    )}
    <div className="flex-grow">
      {/* Book metadata details */}
      {metadata.title && <h3 className="text-lg font-semibold">{metadata.title}</h3>}
      {metadata.author && <p className="text-gray-700">{t('author')}: {metadata.author}</p>}
      <p><span className="font-medium">{t('id')}:</span> {bookId}</p>
      <p><span className="font-medium">{t('metadataAvailable')}:</span> {metadata.metadataAvailable ? t('yes') : t('no')}</p>
      {metadata.language && (
        <p><span className="font-medium">{t('language')}:</span> {metadata.language}</p>
      )}
      {metadata.subjects && metadata.subjects.length > 0 && (
        <div className="mt-2">
          <p className="font-medium">{t('subjects')}:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {metadata.subjects.map((subject, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const CharacterAnalysisDisplay = ({ 
  data, 
  locale, 
  t 
}: { 
  data: CharacterAnalysis; 
  locale: string; 
  t: TranslationFunction 
}) => (
  <ClientOnly>
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold mb-3">{t('characters')}</h3>
      
      {/* Character Graph */}
      <div className="mt-6 mb-6">
        <h4 className="font-medium mb-2">{t('characterRelationships')}</h4>
        <div className="border rounded-md p-1 bg-white">
          <CharacterGraph 
            characters={data.characters}
            interactions={data.interactions}
            locale={locale}
          />
        </div>
      </div>

      {/* Character and Interaction Tables */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">{t('characters')}</h4>
          <div className="max-h-60 overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('description')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.characters.map((char, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{char.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{char.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">{t('interactions')}</h4>
          <div className="max-h-60 overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('source')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('interaction')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('strength')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.interactions.map((int, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{int.source} → {int.target}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{int.description}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${(int.strength/10)*100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md mt-9">
        <h4 className="font-semibold mb-2">{t('additionalAnalysis')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">{t('predictedGenre')}:</p>
            <p className="text-lg">{data.genre}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{t('writingStyle')}</p>
            <div className="text-sm mt-1 px-2">
              <p><span className="font-medium">{t('formality')}:</span> {data.writingStyle.formality}</p>
              <p><span className="font-medium">{t('approach')}:</span> {data.writingStyle.approach}</p>
              <p><span className="font-medium">{t('styleNotes')}:</span> {data.writingStyle.notes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
);

// Main component
export default function Home({params}: {params: Promise<{locale: string}>}) {
  const t = useTranslations();
  const {locale} = use(params);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [characterData, setCharacterData] = useState<CharacterAnalysis | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  // API calls
  const fetchBook = async (bookId: string) => {
    const response = await fetch(`/api/gutenberg?bookId=${bookId}`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      if(result.contentAvailable) {
        toast.success(`${t('foundBook')}: ${bookId}`);
        return result;
      }
      toast.error(result.error || t('noContentAvailable'));
      return result;
    }
    throw new Error(result.error || t('bookFetchError'));
  };

  const analyzeBookCharacters = async (content: string) => {
    const response = await fetch('/api/analyze-characters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': locale === 'ar' ? 'ar' : 'en'
      },
      body: JSON.stringify({ text: content }),
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || t('analysisError'));
    return result;
  };

  // Event handlers
  const onSubmit = async (data: FormData) => {
    if (!data.bookId) return;
    
    setIsLoading(true);
    setBookData(null);
    setCharacterData(null);
    
    try {
      const result = await fetchBook(data.bookId);
      setBookData(result);
    } catch (error) {
      console.error("Book fetch error:", error);
      toast.error(t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeCharacters = async () => {
    if (!bookData?.content) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeBookCharacters(bookData.content);
      setCharacterData(result);
      toast.success(t('characterAnalysisComplete'));
    } catch (error) {
      console.error("Character analysis error:", error);
      toast.error(t('analysisGenericError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center pt-12 gap-4 p-4">
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
      
      {/* Book ID Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full max-w-xs">
        <Input 
          placeholder={t('placeholder')} 
          {...register("bookId", { 
            required: t('required'),
            pattern: {
              value: /^[0-9]+$/,
              message: t('numbersOnly')
            }
          })}
          disabled={isLoading}
        />
        {errors.bookId && (
          <p className="text-sm text-red-500">{String(errors.bookId.message)}</p>
        )}
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner />
              {t('loading')}
            </>
          ) : t('analyzeButton')}
        </Button>
      </form>
      
      {/* Book Information Display */}
      {bookData && (
        <div className="mt-8 w-full max-w-6xl border p-4 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('bookInformation')}</h2>
            {bookData.content && (
              <Button 
                onClick={handleAnalyzeCharacters} 
                disabled={isAnalyzing}
                variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <LoadingSpinner />
                  {t('analyzing')}
                </>
              ) : t('analyzeCharacters')}
            </Button>
            )}
          </div>
          
          <BookMetadataDisplay metadata={bookData.metadata} bookId={bookData.bookId} t={t} />
          
          {characterData && <CharacterAnalysisDisplay data={characterData} locale={locale} t={t} />}
          {bookData.content && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">{t('preview.title')}:</h3>
            <div className="bg-gray-100 p-3 rounded max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{bookData.content}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
