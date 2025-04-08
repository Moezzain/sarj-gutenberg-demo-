"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ClientOnly from "@/components/ClientOnly";

type FormData = {
  bookId: string;
};

type BookData = {
  success: boolean;
  bookId: string;
  metadataAvailable: boolean;
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

type CharacterAnalysis = {
  characters: Character[];
  interactions: Interaction[];
};

export default function Home() {
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
        toast.success(`Found book with ID: ${data.bookId}`);
        setBookData(result);
      } else {
        toast.error(result.error || "Failed to find the book. Please check the ID and try again.");
      }
    } catch (error) {
      console.error("Book fetch error:", error);
      toast.error("An error occurred while fetching the book.");
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
        },
        body: JSON.stringify({ text: bookData.content }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setCharacterData(result);
        toast.success("Character analysis complete!");
      } else {
        toast.error(result.error || "Failed to analyze characters.");
      }
    } catch (error) {
      console.error("Character analysis error:", error);
      toast.error("An error occurred during character analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center pt-12 gap-4 p-4">
      <h1 className="text-2xl font-bold mb-4">Gutenberg Book Analyzer</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full max-w-xs">
        <Input 
          placeholder="Please enter book ID" 
          {...register("bookId", { required: "Book ID is required" })}
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
              Loading...
            </>
          ) : "Analyze"}
        </Button>
      </form>
      
      {bookData && (
        <div className="mt-8 w-full max-w-4xl border p-4 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Book Information</h2>
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
                  Analyzing Characters...
                </>
              ) : "Analyze Characters"}
            </Button>
          </div>
          
          <div className="mb-4">
            <p><span className="font-medium">Book ID:</span> {bookData.bookId}</p>
            <p><span className="font-medium">Metadata Available:</span> {bookData.metadataAvailable ? "Yes" : "No"}</p>
          </div>
          
          {characterData && (
            <ClientOnly>
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Character Analysis</h3>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Characters</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
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
                    <h4 className="font-medium mb-2">Interactions</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Characters</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interaction</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strength</th>
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
              </div>
            </ClientOnly>
          )}
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Preview Content:</h3>
            <div className="bg-gray-100 p-3 rounded max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{bookData.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
