import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";

interface BookWithRating extends Book {
  averageRating: number;
  ratingCount: number;
}

export function useBooks(
  searchQuery: string, 
  filters: { genre: string; minRating: string }
) {
  const queryParams = new URLSearchParams();
  
  if (searchQuery) queryParams.append('search', searchQuery);
  if (filters.genre) queryParams.append('genre', filters.genre);
  if (filters.minRating) queryParams.append('minRating', filters.minRating);

  const { data: books = [], isLoading, error } = useQuery<BookWithRating[]>({
    queryKey: ['/api/books', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/books?${queryParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      
      return response.json();
    },
  });

  return { books, isLoading, error };
}
