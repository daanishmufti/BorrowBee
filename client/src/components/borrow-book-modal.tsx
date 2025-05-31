import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

interface BorrowBookModalProps {
  book: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function BorrowBookModal({ book, isOpen, onClose }: BorrowBookModalProps) {
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [borrowDuration, setBorrowDuration] = useState(14);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const borrowBookMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await apiRequest("POST", "/api/books/borrow", requestData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Borrow Request Sent!",
        description: "Your book borrowing request has been submitted successfully. You'll be contacted soon!",
      });
      onClose();
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit borrowing request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setBorrowerName("");
    setBorrowerEmail("");
    setBorrowerPhone("");
    setDeliveryAddress("");
    setSpecialInstructions("");
    setBorrowDuration(14);
    setDeliveryCoords(null);
    setErrors({});
  };

  // Initialize user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setBorrowerName(user.name || "");
      setBorrowerEmail(user.email || "");
      setBorrowerPhone(user.phone || "");
      setDeliveryAddress(user.address || "");
    }
  }, [isOpen, user]);

  // Initialize Google Maps
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const initializeMap = () => {
      if (!window.google) {
        console.error("Google Maps not loaded");
        return;
      }

      // Initialize map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom: 13,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // Initialize autocomplete
      const addressInput = document.getElementById('delivery-address') as HTMLInputElement;
      if (addressInput) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInput, {
          types: ['address']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry && place.geometry.location) {
            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            setDeliveryCoords(location);
            setDeliveryAddress(place.formatted_address);

            // Update map
            mapInstanceRef.current.setCenter(location);
            mapInstanceRef.current.setZoom(15);

            // Add/update marker
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }
            markerRef.current = new window.google.maps.Marker({
              position: location,
              map: mapInstanceRef.current,
              title: "Delivery Location"
            });
          }
        });
      }
    };

    // Load Google Maps if not already loaded
    if (!window.google) {
      fetch('/api/google-maps-key')
        .then(response => response.text())
        .then(apiKey => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = initializeMap;
          document.head.appendChild(script);
        })
        .catch(() => {
          console.error("Failed to load Google Maps API key");
        });
    } else {
      initializeMap();
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!borrowerName.trim()) newErrors.borrowerName = "Name is required";
    if (!borrowerEmail.trim()) newErrors.borrowerEmail = "Email is required";
    if (!borrowerPhone.trim()) newErrors.borrowerPhone = "Phone number is required";
    if (!deliveryAddress.trim()) newErrors.deliveryAddress = "Delivery address is required";
    if (borrowDuration < 1 || borrowDuration > 30) newErrors.borrowDuration = "Borrow duration must be between 1 and 30 days";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (borrowerEmail && !emailRegex.test(borrowerEmail)) {
      newErrors.borrowerEmail = "Please enter a valid email address";
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
    if (borrowerPhone && !phoneRegex.test(borrowerPhone)) {
      newErrors.borrowerPhone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const requestData = {
      bookId: book.id,
      borrowerName,
      borrowerEmail,
      borrowerPhone,
      deliveryAddress,
      deliveryLatitude: deliveryCoords?.lat,
      deliveryLongitude: deliveryCoords?.lng,
      specialInstructions,
      borrowDuration,
    };

    borrowBookMutation.mutate(requestData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(5px)'
    }} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-300 p-8 w-full max-w-4xl relative mx-4 max-h-[90vh] overflow-y-auto" 
           style={{zIndex: 10000}} onClick={(e) => e.stopPropagation()}>
        
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-orange-600 hover:text-yellow-400 transition-all duration-300 hover:scale-110"
        >
          ×
        </button>
        
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#333', 
          marginBottom: '1rem', 
          textAlign: 'center' 
        }}>
          📚 Borrow: {book.title}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Book Info and Form */}
          <div>
            <div className="flex items-center gap-4 mb-6 p-4 bg-orange-50 rounded-lg">
              {book.imageUrl && (
                <img src={book.imageUrl} alt={book.title} className="w-16 h-20 object-cover rounded" />
              )}
              <div>
                <h3 className="font-semibold text-gray-800">{book.title}</h3>
                <p className="text-gray-600">by {book.author}</p>
                <p className="text-sm text-gray-500">{book.genre} • {book.ageGroup}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <Mail size={16} />
                  Your Name *
                </label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{ borderColor: errors.borrowerName ? '#ef4444' : undefined }}
                />
                {errors.borrowerName && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.borrowerName}</p>
                )}
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2">
                  <Mail size={16} />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  style={{ borderColor: errors.borrowerEmail ? '#ef4444' : undefined }}
                />
                {errors.borrowerEmail && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.borrowerEmail}</p>
                )}
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2">
                  <Phone size={16} />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  style={{ borderColor: errors.borrowerPhone ? '#ef4444' : undefined }}
                />
                {errors.borrowerPhone && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.borrowerPhone}</p>
                )}
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2">
                  <MapPin size={16} />
                  Delivery Address *
                </label>
                <input
                  id="delivery-address"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  style={{ borderColor: errors.deliveryAddress ? '#ef4444' : undefined }}
                />
                {errors.deliveryAddress && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.deliveryAddress}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Start typing your address for suggestions</p>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2">
                  <Clock size={16} />
                  Borrow Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={borrowDuration}
                  onChange={(e) => setBorrowDuration(parseInt(e.target.value))}
                  style={{ borderColor: errors.borrowDuration ? '#ef4444' : undefined }}
                />
                {errors.borrowDuration && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.borrowDuration}</p>
                )}
              </div>

              <div className="form-group">
                <label>Special Instructions</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special delivery instructions..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={borrowBookMutation.isPending}
                style={{ fontSize: '1.1rem', padding: '0.8rem' }}
              >
                {borrowBookMutation.isPending ? "Submitting Request..." : "📚 Request This Book"}
              </button>
            </form>
          </div>

          {/* Right Column - Map */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Delivery Location
            </h3>
            <div 
              ref={mapRef}
              className="w-full h-96 rounded-lg border border-gray-300"
              style={{ minHeight: '400px' }}
            />
            <p className="text-sm text-gray-500 mt-2">
              📍 Select your delivery address above to see it on the map
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}