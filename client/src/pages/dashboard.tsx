import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import Header from "@/components/header";
import { Edit, Trash2, Save, X, MapPin, Phone, Mail, User } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  genre: z.string().min(1, "Genre is required"),
  ageGroup: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
});

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [editingBook, setEditingBook] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  
  // Profile management state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null
  });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch only books owned by the current user
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['/api/books/my-books', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/books/my-books?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch books');
      return response.json();
    },
    retry: false,
    enabled: !!user?.id,
  });

  // Initialize profile data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        latitude: user.latitude ? parseFloat(user.latitude) : null,
        longitude: user.longitude ? parseFloat(user.longitude) : null
      });
    }
  }, [user]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated!",
        description: "Your profile information has been saved successfully.",
      });
      setIsEditingProfile(false);
      // Update the user context with new data
      if (user) {
        const newUserData = { ...user, ...updatedUser };
        localStorage.setItem('borrowbee_user', JSON.stringify(newUserData));
        window.location.reload(); // Refresh to update user context
      }
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setProfileData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
          // Reverse geocode to get address
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please click on the map to set your location.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services. Please click on the map to set your location.",
        variant: "destructive",
      });
    }
  };

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          setProfileData(prev => ({
            ...prev,
            address: data.display_name
          }));
        }
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  // Handle map click to set location
  const handleMapClick = (lat: number, lng: number) => {
    setProfileData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    reverseGeocode(lat, lng);
  };

  // Auto-request location when editing profile starts
  useEffect(() => {
    if (isEditingProfile && !profileData.latitude && !profileData.longitude) {
      getCurrentLocation();
    }
  }, [isEditingProfile]);

  const handleProfileSave = () => {
    if (!profileData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      name: profileData.name,
      phone: profileData.phone,
      address: profileData.address,
      latitude: profileData.latitude?.toString(),
      longitude: profileData.longitude?.toString(),
    });
  };

  const addBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      const response = await apiRequest("POST", "/api/books", bookData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Book added to the library successfully!",
      });
      // Reset form
      setTitle("");
      setAuthor("");
      setGenre("");
      setAgeGroup("");
      setDescription("");
      setImageUrl("");
      setErrors({});
      // Refresh user's books list
      queryClient.invalidateQueries({ 
        queryKey: ['/api/books/my-books', user?.id]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, bookData }: { id: number; bookData: any }) => {
      const response = await apiRequest("PUT", `/api/books/${id}`, bookData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Book updated successfully!",
      });
      setEditingBook(null);
      setEditFormData({});
      queryClient.invalidateQueries({ queryKey: ['/api/books/my-books', user?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Book deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/books/my-books', user?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const bookData = bookSchema.parse({
        title,
        author,
        genre,
        ageGroup: ageGroup || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
      });
      
      // Add owner ID to the book data
      const bookDataWithOwner = { ...bookData, ownerId: user?.id };
      addBookMutation.mutate(bookDataWithOwner);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleEditBook = (book: any) => {
    setEditingBook(book);
    setEditFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      ageGroup: book.ageGroup || "",
      description: book.description || "",
      imageUrl: book.imageUrl || "",
    });
  };

  const handleSaveEdit = () => {
    try {
      const bookData = bookSchema.parse(editFormData);
      updateBookMutation.mutate({ id: editingBook.id, bookData });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: "Please check all required fields.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingBook(null);
    setEditFormData({});
  };

  const handleDeleteBook = (id: number) => {
    if (window.confirm("Are you sure you want to delete this book? This action cannot be undone.")) {
      deleteBookMutation.mutate(id);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header user={null} onLoginClick={() => {}} onRegisterClick={() => {}} />
        <div className="container mx-auto px-5 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-amber-900 mb-4">Access Denied</h1>
            <p className="text-xl text-amber-700">Please log in to access your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        user={user} 
        onLoginClick={() => {}} 
        onRegisterClick={() => {}} 
      />
      
      <main>
        <div className="container">
          <section className="hero">
            <h1>
              <strong>Welcome to Your Dashboard, {user.name}!</strong>
            </h1>
            <p className="subtitle">
              🐝 Add Amazing Books to Our Hive - Share the Joy of Reading! 🍯
            </p>
          </section>

          {/* Profile Management Section */}
          <section className="max-w-4xl mx-auto mb-8">
            <div className="form-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <User size={24} />
                  Your Profile & Delivery Details
                </h2>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                  >
                    <Edit size={16} />
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Profile Form */}
                  <div>
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="flex items-center gap-2">
                          <User size={16} />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                          className="w-full p-3 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="form-group">
                        <label className="flex items-center gap-2">
                          <Phone size={16} />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                          className="w-full p-3 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="form-group">
                        <label className="flex items-center gap-2">
                          <MapPin size={16} />
                          Delivery Address
                        </label>
                        <input
                          id="profile-address"
                          type="text"
                          value={profileData.address || ''}
                          onChange={(e) => {
                            setProfileData(prev => ({ ...prev, address: e.target.value }));
                          }}
                          placeholder="Address will be filled automatically when you select location on map"
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                          readOnly
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={getCurrentLocation}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                          >
                            <MapPin size={14} />
                            Use My Location
                          </button>
                          <p className="text-sm text-gray-500 flex items-center">
                            or click on the map to set your location
                          </p>
                        </div>
                        {profileData.latitude && profileData.longitude && (
                          <p className="text-sm text-green-600 mt-1">
                            📍 Location set: {profileData.latitude.toFixed(4)}, {profileData.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={handleProfileSave}
                          disabled={updateProfileMutation.isPending}
                          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          <Save size={16} />
                          {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Map Display */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin size={20} />
                      Click on Map to Set Location
                    </h3>
                    <div className="w-full h-80 rounded-lg border border-gray-300 overflow-hidden relative">
                      {profileData.latitude && profileData.longitude ? (
                        <div className="relative w-full h-full">
                          <iframe
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${profileData.longitude - 0.01},${profileData.latitude - 0.01},${profileData.longitude + 0.01},${profileData.latitude + 0.01}&layer=mapnik&marker=${profileData.latitude},${profileData.longitude}`}
                            className="w-full h-full"
                            style={{ border: 0 }}
                            title="Location Map"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                              📍 Your Location
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 flex flex-col items-center justify-center p-6">
                          <div className="text-center">
                            <div className="text-4xl mb-4">🗺️</div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">Set Your Location</h4>
                            <p className="text-gray-600 mb-4">
                              Click "Use My Location" or click anywhere on the map to set your delivery location
                            </p>
                            <button
                              type="button"
                              onClick={getCurrentLocation}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mx-auto"
                            >
                              <MapPin size={16} />
                              Use My Current Location
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {profileData.latitude && profileData.longitude 
                        ? `Coordinates: ${profileData.latitude.toFixed(4)}, ${profileData.longitude.toFixed(4)}`
                        : "Click on the map or use your current location to set delivery address"
                      }
                    </p>
                    {profileData.latitude && profileData.longitude && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                        >
                          <MapPin size={12} />
                          Update to Current Location
                        </button>
                        <a
                          href={`https://www.google.com/maps?q=${profileData.latitude},${profileData.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          🗺️ View in Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <User className="text-blue-600" size={24} />
                    <div>
                      <p className="font-semibold text-gray-800">Name</p>
                      <p className="text-gray-600">{profileData.name || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <Phone className="text-green-600" size={24} />
                    <div>
                      <p className="font-semibold text-gray-800">Phone</p>
                      <p className="text-gray-600">{profileData.phone || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                    <MapPin className="text-orange-600" size={24} />
                    <div>
                      <p className="font-semibold text-gray-800">Address</p>
                      <p className="text-gray-600">{profileData.address || "Not set"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="max-w-2xl mx-auto">
            <div className="form-card">
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: '#333', 
                marginBottom: '2rem', 
                textAlign: 'center' 
              }}>
                📚 Add a New Book to the Hive
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Book Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter the book title"
                    style={{ borderColor: errors.title ? '#ef4444' : undefined }}
                  />
                  {errors.title && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.title}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Author *</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Who wrote this amazing book?"
                    style={{ borderColor: errors.author ? '#ef4444' : undefined }}
                  />
                  {errors.author && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.author}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Genre *</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    style={{ borderColor: errors.genre ? '#ef4444' : undefined }}
                  >
                    <option value="">Choose a genre</option>
                    <option value="Fiction">Fiction</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Science Fiction">Science Fiction</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Picture Book">Picture Book</option>
                    <option value="Educational">Educational</option>
                    <option value="Biography">Biography</option>
                  </select>
                  {errors.genre && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.genre}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Age Group</label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                  >
                    <option value="">Select age group (optional)</option>
                    <option value="0-3 years">0-3 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5-8 years">5-8 years</option>
                    <option value="8-12 years">8-12 years</option>
                    <option value="12+ years">12+ years</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us what this book is about..."
                    rows={4}
                    style={{ 
                      resize: 'none',
                      width: '100%',
                      padding: '0.8rem',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FFD700';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Book Cover Image</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/book-cover.jpg"
                    style={{ borderColor: errors.imageUrl ? '#ef4444' : undefined }}
                  />
                  {errors.imageUrl && (
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.imageUrl}</p>
                  )}
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    Add a link to the book cover image (optional)
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={addBookMutation.isPending}
                  style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }}
                >
                  {addBookMutation.isPending ? (
                    "Adding Book..."
                  ) : (
                    "🍯 Add Book to the Hive"
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* Book Management Section */}
          <section className="max-w-6xl mx-auto mt-12">
            <div className="form-card">
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: '#333', 
                marginBottom: '2rem', 
                textAlign: 'center' 
              }}>
                📋 Manage Your Books
              </h2>

              {booksLoading ? (
                <div className="text-center py-8">
                  <p>Loading books...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No books found. Add your first book above!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {books.map((book: any) => (
                    <div key={book.id} className="border border-orange-200 rounded-lg p-4 bg-white shadow-sm">
                      {editingBook?.id === book.id ? (
                        // Edit mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                              <input
                                type="text"
                                value={editFormData.title || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                              <input
                                type="text"
                                value={editFormData.author || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                              <select
                                value={editFormData.genre || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, genre: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="">Choose a genre</option>
                                <option value="Fiction">Fiction</option>
                                <option value="Fantasy">Fantasy</option>
                                <option value="Science Fiction">Science Fiction</option>
                                <option value="Mystery">Mystery</option>
                                <option value="Adventure">Adventure</option>
                                <option value="Picture Book">Picture Book</option>
                                <option value="Educational">Educational</option>
                                <option value="Biography">Biography</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                              <select
                                value={editFormData.ageGroup || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, ageGroup: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="">Select age group</option>
                                <option value="0-3 years">0-3 years</option>
                                <option value="3-5 years">3-5 years</option>
                                <option value="5-8 years">5-8 years</option>
                                <option value="8-12 years">8-12 years</option>
                                <option value="12+ years">12+ years</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={editFormData.description || ""}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                            <input
                              type="url"
                              value={editFormData.imageUrl || ""}
                              onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={updateBookMutation.isPending}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              <Save size={16} />
                              {updateBookMutation.isPending ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                              <X size={16} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display mode
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              {book.imageUrl && (
                                <img
                                  src={book.imageUrl}
                                  alt={book.title}
                                  className="w-16 h-20 object-cover rounded"
                                />
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">{book.title}</h3>
                                <p className="text-gray-600">by {book.author}</p>
                                <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                  <span>Genre: {book.genre}</span>
                                  {book.ageGroup && <span>Age: {book.ageGroup}</span>}
                                  <span>Rating: {book.averageRating}/5 ({book.ratingCount} reviews)</span>
                                </div>
                              </div>
                            </div>
                            {book.description && (
                              <p className="text-gray-700 text-sm mt-2">{book.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditBook(book)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              disabled={deleteBookMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}