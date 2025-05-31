import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, User, X } from "lucide-react";

interface BookOwnerModalProps {
  book: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookOwnerModal({ book, isOpen, onClose }: BookOwnerModalProps) {
  const [ownerData, setOwnerData] = useState<any>(null);

  // Get owner information from the book's ownerId
  const { data: owner, isLoading } = useQuery({
    queryKey: [`/api/users/${book.ownerId}`],
    enabled: isOpen && !!book.ownerId,
  });

  useEffect(() => {
    if (owner) {
      setOwnerData(owner);
    }
  }, [owner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">📚 Book Owner Information</h2>
              <h3 className="text-xl opacity-90">{book.title}</h3>
              <p className="opacity-80">by {book.author}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-4">🐝</div>
              <p>Loading owner information...</p>
            </div>
          ) : ownerData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Owner Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <User size={20} />
                    Owner Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <User size={20} className="text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-semibold">{ownerData.name}</p>
                      </div>
                    </div>

                    {ownerData.email && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                        <Mail size={20} className="text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <a 
                            href={`mailto:${ownerData.email}`}
                            className="font-semibold text-green-700 hover:underline"
                          >
                            {ownerData.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {ownerData.phone && (
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                        <Phone size={20} className="text-yellow-600" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <a 
                            href={`tel:${ownerData.phone}`}
                            className="font-semibold text-yellow-700 hover:underline"
                          >
                            {ownerData.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {ownerData.address && (
                      <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                        <MapPin size={20} className="text-purple-600 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-semibold text-purple-700">{ownerData.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Book Description */}
                {book.description && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">📖 About This Book</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">{book.description}</p>
                    </div>
                  </div>
                )}

                {/* Book Details */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">📚 Book Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Genre</p>
                      <p className="font-semibold">{book.genre}</p>
                    </div>
                    {book.ageGroup && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Age Group</p>
                        <p className="font-semibold">{book.ageGroup}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Map Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Owner Location
                </h3>
                
                <div className="h-80 rounded-lg border border-gray-300 overflow-hidden">
                  {ownerData.latitude && ownerData.longitude ? (
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(ownerData.longitude) - 0.01},${parseFloat(ownerData.latitude) - 0.01},${parseFloat(ownerData.longitude) + 0.01},${parseFloat(ownerData.latitude) + 0.01}&layer=mapnik&marker=${ownerData.latitude},${ownerData.longitude}`}
                      className="w-full h-full"
                      style={{ border: 0 }}
                      title="Owner Location Map"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
                      <div className="text-center">
                        <div className="text-4xl mb-4">📍</div>
                        <h4 className="text-xl font-semibold text-gray-800 mb-2">Location Not Available</h4>
                        <p className="text-gray-600">
                          Please contact the owner directly for pickup/delivery arrangements
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {ownerData.latitude && ownerData.longitude && (
                  <div className="mt-4 flex gap-2">
                    <a
                      href={`https://www.google.com/maps?q=${ownerData.latitude},${ownerData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      🗺️ View in Google Maps
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${ownerData.latitude},${ownerData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      🧭 Get Directions
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Owner Information Not Available</h3>
              <p className="text-gray-600">
                This book doesn't have owner information available.
              </p>
            </div>
          )}

          {/* Contact Actions */}
          {ownerData && (
            <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 text-center">📞 Contact Owner</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {ownerData.email && (
                  <a
                    href={`mailto:${ownerData.email}?subject=Book Request: ${book.title}&body=Hello ${ownerData.name}, I'm interested in borrowing your book "${book.title}" by ${book.author}. Could we arrange a pickup or delivery?`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Mail size={16} />
                    Send Email
                  </a>
                )}
                
                {ownerData.phone && (
                  <a
                    href={`tel:${ownerData.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Phone size={16} />
                    Call Now
                  </a>
                )}

                {ownerData.phone && (
                  <a
                    href={`sms:${ownerData.phone}?body=Hi ${ownerData.name}, I'm interested in borrowing your book "${book.title}". Are you available for pickup or delivery?`}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    💬 Send SMS
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-600 text-center mt-3">
                Please contact the owner to arrange book pickup or delivery
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}