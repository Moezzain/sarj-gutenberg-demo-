"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormData = {
  bookId: string;
};

type BookData = {
  success: boolean;
  bookId: string;
  metadataAvailable: boolean;
  content: string;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    if (!data.bookId) return;
    
    setIsLoading(true);
    setBookData(null);
    
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
      console.error('Error in onSubmit:', error);
      toast.error("An error occurred while fetching the book.");
    } finally {
      setIsLoading(false);
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
        <div className="mt-8 w-full max-w-2xl border p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Book Information</h2>
          <div className="mb-2">
            <p><span className="font-medium">Book ID:</span> {bookData.bookId}</p>
            <p><span className="font-medium">Metadata Available:</span> {bookData.metadataAvailable ? "Yes" : "No"}</p>
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Preview Content:</h3>
            <div className="bg-gray-100 p-3 rounded max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{bookData.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
