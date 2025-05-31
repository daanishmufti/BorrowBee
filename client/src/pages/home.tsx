import { useState } from "react";
import Header from "@/components/header";
import SearchSection from "@/components/search-section";
import BookCard from "@/components/book-card";
import LoginModal from "@/components/login-modal";
import RegisterModal from "@/components/register-modal";
import { useBooks } from "@/hooks/use-books";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    genre: "",
    minRating: "",
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 6;

  const { books, isLoading, error } = useBooks(searchQuery, filters);
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Rating mutation for instant updates
  const rateMutation = useMutation({
    mutationFn: async ({ bookId, rating, userId }: { bookId: number; rating: number; userId: number }) => {
      const response = await apiRequest("POST", `/api/books/${bookId}/rate`, {
        userId,
        rating,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Rating saved!",
        description: "Thank you for rating this book!",
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

  // Debug logging
  console.log("Books data:", books);
  console.log("Is loading:", isLoading);
  console.log("Error:", error);
  console.log("Books length:", books.length);
  console.log("User:", user);
  console.log("Should show books:", !isLoading && !error && books.length > 0);



  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Calculate pagination
  const sortedBooks = [...books].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt.toString()).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt.toString()).getTime() : 0;
    return dateB - dateA;
  });
  const totalPages = Math.ceil(sortedBooks.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const currentBooks = sortedBooks.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div>
      <Header 
        user={user}
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={() => setShowRegisterModal(true)}
      />
      
      <main>
        <div className="container">
          {/* Hero Section */}
          <section className="hero">
            <h1 style={{fontWeight: 'bold'}}>Welcome to Your Reading Adventure!</h1>
            <p style={{fontWeight: 'bold'}}>🐝 Buzz into Knowledge - Discover, Borrow, and Enjoy Your Favorite Books! 🍯</p>
          </section>

          <SearchSection 
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            searchQuery={searchQuery}
            filters={filters}
          />

          {/* Books Section */}
          <section className="books-section">
            <h2>🍯 Fresh Arrivals</h2>

            {isLoading && (
              <div className="text-center py-12 text-2xl text-amber-700">
                <div className="loading-bee mb-4"></div>
                Loading magical books...
              </div>
            )}

            {error && (
              <div className="bg-red-100 border-3 border-red-400 rounded-2xl p-6 text-center text-red-800 font-semibold mb-8">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Oops! Our busy bees couldn't find the books right now. Please try again!
              </div>
            )}

            {!isLoading && !error && currentBooks && currentBooks.length > 0 && (
              <>
                <div className="books-grid">
                  {currentBooks.map((book, index) => (
                    <div key={book.id} className="simple-book-card">
                      <div className="simple-book-image">
                        {book.imageUrl ? (
                          <img src={book.imageUrl} alt={book.title} />
                        ) : (
                          <div className="no-image">📚</div>
                        )}
                      </div>
                      <div className="simple-book-info">
                        <h3 style={{ 
                          lineHeight: '1.3',
                          height: '2.6em',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          wordWrap: 'break-word'
                        }}>
                          {book.title.length > 50 ? book.title.substring(0, 50) + '...' : book.title}
                        </h3>
                        <p style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap'
                        }}>
                          by {book.author.length > 30 ? book.author.substring(0, 30) + '...' : book.author}
                        </p>
                        <span className="simple-genre">{book.genre}</span>
                        {book.ageGroup && <p>Ages: {book.ageGroup}</p>}
                        
                        {/* Simple rating display */}
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => {
                                  if (!user) {
                                    alert('Please log in to rate books!');
                                    return;
                                  }
                                  // Rating functionality with logged-in user
                                  rateMutation.mutate({ bookId: book.id, rating: star, userId: user.id });
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  fontSize: '1.2rem',
                                  cursor: 'pointer',
                                  opacity: user ? (star <= (book.averageRating || 0) ? 1 : 0.3) : 0.5
                                }}
                              >
                                🐝
                              </button>
                            ))}
                          </div>
                          <span style={{ fontSize: '0.9rem', color: '#666' }}>
                            {book.averageRating > 0 ? `${book.averageRating.toFixed(1)} (${book.ratingCount})` : 'No ratings'}
                          </span>
                        </div>
                        
                        <button
                          style={{
                            marginTop: '1rem',
                            padding: '0.8rem',
                            background: 'linear-gradient(45deg, #f39c12, #e67e22)',
                            border: '2px solid #d68910',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            width: '100%',
                            fontSize: '1rem'
                          }}
                          onClick={() => {
                            console.log('Navigation button clicked for book:', book.id);
                            window.location.href = `/book/${book.id}`;
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-container">
                    <button 
                      onClick={handlePreviousPage} 
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      <span>🐝</span> Previous
                    </button>
                    
                    <div className="pagination-info">
                      <span>Page {currentPage} of {totalPages}</span>
                      <span className="books-count">({sortedBooks.length} books total)</span>
                    </div>
                    
                    <button 
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Next <span>🐝</span>
                    </button>
                  </div>
                )}
              </>
            )}



            {!isLoading && !error && books.length === 0 && (
              <div className="text-center py-12 text-2xl text-amber-700">
                <div className="text-6xl mb-4">🔍</div>
                No books found matching your search. Try different keywords!
              </div>
            )}
          </section>
        </div>
      </main>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={setUser}
      />
      
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
      />
    </div>
  );
}
