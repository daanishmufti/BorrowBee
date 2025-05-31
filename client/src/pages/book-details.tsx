import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Book, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";


export default function BookDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showOwnerInfo, setShowOwnerInfo] = useState(false);
  const { toast } = useToast();

  const { user } = useAuth();

  const { data: book, isLoading } = useQuery<Book>({
    queryKey: [`/api/books/${id}`],
    enabled: !!id,
  });

  // Get owner information
  const { data: owner } = useQuery<User>({
    queryKey: [`/api/users/${book?.ownerId}`],
    enabled: !!book?.ownerId,
  });

  const sendBorrowAlert = useMutation({
    mutationFn: async () => {
      if (!user || !owner || !book) {
        throw new Error('Missing required information');
      }
      return await apiRequest('POST', '/api/send-borrow-alert', {
        borrowerName: user.name,
        borrowerEmail: user.email,
        borrowerPhone: user.phone,
        ownerEmail: owner.email,
        bookTitle: book.title,
        bookAuthor: book.author,
      });
    },
    onSuccess: () => {
      toast({
        title: "Borrow alert sent!",
        description: "The book owner has been notified via email about your interest.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send request",
        description: "Please try again later or contact the owner directly.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '2rem',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🐝</div>
          <div>Loading book details...</div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '2rem',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          <div>Book not found</div>
          <button 
            onClick={() => setLocation('/')}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
      padding: '2rem 0'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
        <button 
          onClick={() => setLocation('/')}
          style={{
            marginBottom: '2rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #f39c12',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ← Back to Library
        </button>

        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          <div>
            {/* Book Image */}
            <div style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFA500 100%)',
              borderRadius: '15px',
              aspectRatio: '3/4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              {book.imageUrl ? (
                <img 
                  src={book.imageUrl}
                  alt={book.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '15px'
                  }}
                />
              ) : (
                <span style={{ fontSize: '4rem', color: 'white' }}>📚</span>
              )}
            </div>

            {/* Borrow Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '1.5rem',
              borderRadius: '15px',
              border: '2px solid #f39c12'
            }}>
              <h3 style={{ 
                fontSize: '1.2rem', 
                marginBottom: '1rem', 
                color: '#333',
                textAlign: 'center'
              }}>
                📚 Borrow This Book
              </h3>
              
              {!user ? (
                <div style={{
                  textAlign: 'center',
                  padding: '0.8rem',
                  background: '#fff3cd',
                  borderRadius: '10px',
                  border: '2px solid #ffeaa7',
                  fontSize: '0.9rem'
                }}>
                  <p style={{ color: '#856404', margin: '0' }}>
                    Please log in to borrow books
                  </p>
                </div>
              ) : (
                <>
                  {!showOwnerInfo ? (
                    <div style={{ textAlign: 'center' }}>
                      <button
                        style={{
                          background: 'linear-gradient(45deg, #f39c12, #e67e22)',
                          color: 'white',
                          padding: '0.8rem 1.5rem',
                          borderRadius: '10px',
                          border: '2px solid #d68910',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          width: '100%'
                        }}
                        onClick={() => setShowOwnerInfo(true)}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(243, 156, 18, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        📞 Contact Owner
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '10px',
                        marginBottom: '1rem',
                        border: '1px solid #dee2e6',
                        fontSize: '0.9rem'
                      }}>
                        <h4 style={{ marginBottom: '0.8rem', color: '#333', fontSize: '1rem' }}>Owner Contact:</h4>
                        {owner ? (
                          <div style={{ display: 'grid', gap: '0.3rem' }}>
                            <p><strong>Name:</strong> {owner.name}</p>
                            <p><strong>Email:</strong> {owner.email}</p>
                            <p><strong>Phone:</strong> {owner.phone}</p>
                            <p><strong>Location:</strong> {owner.address}</p>
                          </div>
                        ) : (
                          <p>Loading owner information...</p>
                        )}
                      </div>
                      
                      <button
                        style={{
                          background: 'linear-gradient(45deg, #28a745, #20c997)',
                          color: 'white',
                          padding: '0.8rem 1.5rem',
                          borderRadius: '10px',
                          border: '2px solid #1e7e34',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          width: '100%',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => sendBorrowAlert.mutate()}
                        disabled={sendBorrowAlert.isPending || !owner}
                        onMouseOver={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 167, 69, 0.4)';
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {sendBorrowAlert.isPending ? '📧 Sending...' : '📧 Send Borrow Alert'}
                      </button>
                      
                      <div style={{
                        background: '#e3f2fd',
                        padding: '0.8rem',
                        borderRadius: '8px',
                        marginTop: '0.8rem',
                        fontSize: '0.8rem',
                        color: '#1565c0'
                      }}>
                        <strong>Note:</strong> Confirms your interest and logs the request.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Book Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                marginBottom: '0.5rem', 
                color: '#333',
                fontWeight: '700'
              }}>
                {book.title}
              </h1>
              <p style={{ 
                fontSize: '1.3rem', 
                color: '#666', 
                fontStyle: 'italic',
                marginBottom: '1rem'
              }}>
                by {book.author}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                background: 'linear-gradient(45deg, #f39c12, #e67e22)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                {book.genre}
              </span>
              {book.ageGroup && (
                <span style={{
                  background: 'linear-gradient(45deg, #87CEEB, #4682B4)',
                  color: '#1e3a8a',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Ages {book.ageGroup}
                </span>
              )}
            </div>

            <div style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '15px',
              border: '2px solid #e9ecef'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#333' }}>Description</h3>
              <p style={{ 
                lineHeight: '1.6', 
                color: '#555',
                fontSize: '1rem'
              }}>
                {book.description || 'No description available.'}
              </p>
            </div>



          </div>
        </div>
      </div>


    </div>
  );
}