"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ClientOnly from "@/components/ClientOnly";
import { useTranslations } from "next-intl";
import Image from 'next/image';

type FormData = {
  bookId: string;
};

type BookData = {
  success: boolean;
  bookId: string;
  metadataAvailable: boolean;
  metadata: {
    title?: string;
    author?: string;
    language?: string;
    subjects?: string[];
    summary?: string;
    coverImage?: string;
  };
  content: string;
};

type Character = {
  name: string;
  description: string;
};

type Interaction = {
  source: string;
  target: string;
  description: string;
  strength: number;
};

type WritingStyle = {
  formality: string;
  approach: string;
  notes: string;
};

type CharacterAnalysis = {
  characters: Character[];
  interactions: Interaction[];
  genre: string;
  writingStyle: WritingStyle;
};

export default function Home({params}: {params: Promise<{locale: string}>}) {
  const t = useTranslations();
  const {locale} = use(params);
 
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [characterData, setCharacterData] = useState<CharacterAnalysis | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  // Handle book fetch
  const onSubmit = async (data: FormData) => {
    if (!data.bookId) return;
    
    setIsLoading(true);
    setBookData(null);
    setCharacterData(null);
    
    try {
      const response = await fetch(`/api/gutenberg?bookId=${data.bookId}`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(`${t('foundBook')}: ${data.bookId}`);
        setBookData(result);
      } else {
        toast.error(result.error || t('bookFetchError'));
      }
    } catch (error) {
      console.error("Book fetch error:", error);
      toast.error(t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle character analysis
  const analyzeCharacters = async () => {
    if (!bookData?.content) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale === 'ar' ? 'ar' : 'en'
        },
        body: JSON.stringify({ text: bookData.content }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setCharacterData(result);
        toast.success(t('characterAnalysisComplete'));
      } else {
        toast.error(result.error || t('analysisError'));
      }
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
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('loading')}
            </>
          ) : t('analyzeButton')}
        </Button>
      </form>
      
      {bookData && (
        <div className="mt-8 w-full max-w-6xl border p-4 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('bookInformation')}</h2>
            <Button 
              onClick={analyzeCharacters} 
              disabled={isAnalyzing}
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('analyzing')}
                </>
              ) : t('analyzeCharacters')}
            </Button>
          </div>
          
          <div className="mb-4">
            <div className="flex flex-wrap items-start gap-6">
              {bookData.metadata?.coverImage && (
                <div className="w-36 flex-shrink-0 rounded overflow-hidden shadow-md relative">
                  <Image 
                    src={bookData.metadata.coverImage} 
                    alt={bookData.metadata.title || "Book cover"} 
                    width={144}
                    height={216}
                    className="object-cover"
                    unoptimized={bookData.metadata.coverImage.startsWith('https://www.gutenberg.org')}
                  />
                </div>
              )}
              <div className="flex-grow">
                {bookData.metadata?.title && (
                  <h3 className="text-lg font-semibold">{bookData.metadata.title}</h3>
                )}
                {bookData.metadata?.author && (
                  <p className="text-gray-700">{t('author')}: {bookData.metadata.author}</p>
                )}
                <p><span className="font-medium">{t('id')}:</span> {bookData.bookId}</p>
                <p><span className="font-medium">{t('metadataAvailable')}:</span> {bookData.metadataAvailable ? t('yes') : t('no')}</p>
                {bookData.metadata?.language && (
                  <p><span className="font-medium">{t('language')}:</span> {bookData.metadata.language}</p>
                )}
                {bookData.metadata?.subjects && bookData.metadata.subjects.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">{t('subjects')}:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bookData.metadata.subjects.map((subject, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {bookData.metadata?.summary && (
              <div className="mt-3">
                <p className="font-medium">{t('summary')}:</p>
                <p className="text-sm text-gray-700 mt-1">{bookData.metadata.summary}</p>
              </div>
            )}
          </div>
          
          {characterData && (
            <ClientOnly>
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">{t('characters')}</h3>
                
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
                          {characterData.characters.map((char, idx) => (
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
                          {characterData.interactions.map((int, idx) => (
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

                <div className="mb-4 p-4 bg-gray-50 rounded-md mt-9">
                  <h4 className="font-semibold mb-2">{t('additionalAnalysis')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{t('predictedGenre')}:</p>
                      <p className="text-lg">{characterData.genre}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{t('writingStyle')}</p>
                      <div className="text-sm mt-1 px-2">
                        <p><span className="font-medium">{t('formality')}:</span> {characterData.writingStyle.formality}</p>
                        <p><span className="font-medium">{t('approach')}:</span> {characterData.writingStyle.approach}</p>
                        <p><span className="font-medium">{t('styleNotes')}:</span> {characterData.writingStyle.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ClientOnly>
          )}
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">{t('preview.title')}:</h3>
            <div className="bg-gray-100 p-3 rounded max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{bookData.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
