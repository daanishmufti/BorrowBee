import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Book, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface BookCardProps {
  book: Book & { averageRating: number; ratingCount: number };
  user: User | null;
  delay?: number;
}

export default function BookCard({ book, user, delay = 0 }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get user's current rating for this book
  const sessionUserId = user?.id || 999; // Use a default session user ID
  const { data: userRating } = useQuery({
    queryKey: [`/api/books/${book.id}/rating/${sessionUserId}`],
    enabled: true,
  });

  const rateMutation = useMutation({
    mutationFn: async ({ rating, userId }: { rating: number; userId: number }) => {
      const response = await apiRequest("POST", `/api/books/${book.id}/rate`, {
        userId,
        rating,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${book.id}/rating/${sessionUserId}`] });
      toast({
        title: "Rating saved! 🐝",
        description: "Thank you for buzzing about this book!",
      });
    },
    onError: () => {
      toast({
        title: "Rating failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleRating = (rating: number) => {
    rateMutation.mutate({ rating, userId: sessionUserId });
  };

  const renderStars = () => {
    const currentRating = (userRating as any)?.rating || 0;
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => handleRating(i)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`text-2xl transition-all duration-200 hover:scale-125 ${
            i <= currentRating ? "opacity-100" : "opacity-30"
          }`}
          disabled={rateMutation.isPending}
        >
          🐝
        </button>
      );
    }
    
    return stars;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    console.log('Book card clicked, book ID:', book.id);
    console.log('Event target:', e.target);
    console.log('Event currentTarget:', e.currentTarget);
    console.log('Navigating to:', `/book/${book.id}`);
    e.preventDefault();
    e.stopPropagation();
    setLocation(`/book/${book.id}`);
  };

  return (
    <div 
      className="book-card fade-in bounce-in"
      style={{ 
        animationDelay: `${delay}ms`,
        cursor: 'pointer',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div 
        className="book-image"
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
        {book.imageUrl ? (
          <img 
            src={book.imageUrl} 
            alt={`Cover of ${book.title}`}
            style={{ cursor: 'pointer' }}
            onClick={handleCardClick}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<span style="font-size: 3rem; color: white; position: relative; z-index: 10; cursor: pointer;">📚</span>';
              }
            }}
          />
        ) : (
          <span 
            style={{ fontSize: '3rem', color: 'white', position: 'relative', zIndex: 10, cursor: 'pointer' }}
            onClick={handleCardClick}
          >
            📚
          </span>
        )}
      </div>
      
      <div 
        style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
        onClick={handleCardClick}
      >
        <h3>{book.title}</h3>
        <p className="author">by {book.author}</p>
        <span className="genre">{book.genre}</span>
        {book.ageGroup && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ 
              background: 'linear-gradient(45deg, #87CEEB, #4682B4)', 
              color: '#1e3a8a', 
              padding: '0.2rem 0.8rem', 
              borderRadius: '15px', 
              fontSize: '0.8rem', 
              fontWeight: '600',
              display: 'inline-block'
            }}>
              Ages {book.ageGroup}
            </span>
          </div>
        )}
        
        <div 
          className="bee-ratings"
          onClick={(e) => e.stopPropagation()}
        >
          {renderStars()}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
          {book.averageRating > 0 ? book.averageRating : "No ratings"} 
          {book.ratingCount > 0 && ` (${book.ratingCount} buzzes)`}
        </div>
        
        <button
          style={{
            marginTop: '1rem',
            padding: '0.8rem',
            background: 'red',
            border: '3px solid black',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            fontSize: '1.2rem',
            zIndex: 9999,
            position: 'relative'
          }}
          onClick={() => {
            console.log('BUTTON CLICKED - BOOK ID:', book.id);
            alert(`Clicking book ${book.id}`);
            window.location.href = `/book/${book.id}`;
          }}
        >
          TEST BUTTON - CLICK ME
        </button>

      </div>
    </div>
  );
}
