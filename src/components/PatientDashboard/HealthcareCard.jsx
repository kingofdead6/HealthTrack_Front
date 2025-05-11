/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../api";
import DocPlaceHolder from "/docPic.png"
// HealthcareCard component to display provider details and manage appointments/favorites
export default function HealthcareCard({ provider }) {
  // State declarations for managing UI and data
  const [showAppointmentModal, setShowAppointmentModal] = useState(false); // Toggle appointment modal
  const [appointmentData, setAppointmentData] = useState({
    date: "",
    time: "",
    message: "",
    duration: "30",
  }); // Store appointment form data
  const [isSubmitting, setIsSubmitting] = useState(false); // Indicate submission state
  const [errorMessage, setErrorMessage] = useState(""); // Store error messages
  const [isFavorite, setIsFavorite] = useState(false); // Store favorite status
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false); // Indicate favorite toggle loading
  const [showProfileModal, setShowProfileModal] = useState(false); // Toggle profile modal
  const [profileData, setProfileData] = useState(null); // Store provider profile data
  const [profileLoading, setProfileLoading] = useState(false); // Indicate profile loading state
  const [profileError, setProfileError] = useState(""); // Store profile error messages
  const [availableSlots, setAvailableSlots] = useState([]); // Store available appointment slots
  const [selectedDate, setSelectedDate] = useState(null); // Store selected appointment date
  const [workingHours, setWorkingHours] = useState({ startHour: 8, endHour: 17 }); // Store provider working hours

  // Predefined message suggestions for appointment form
  const messageSuggestions = [
    "General check-up needed",
    "Follow-up appointment",
    "Consultation for symptoms",
    "Prescription refill request",
    "Health screening appointment",
  ];

  // Check if provider is in user's favorites on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const token = localStorage.getItem("token"); // Retrieve auth token
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/patients/favorites`, {
          headers: { Authorization: `Bearer ${token}` }, // Include auth token
        });
        const favorites = await response.json();
        if (response.ok) {
          setIsFavorite(favorites.some((fav) => fav.user_id === provider?.user_id)); // Update favorite status
        }
      } catch (error) {
        console.error("Error checking favorite status:", error); // Log error
      }
    };

    if (provider?.user_id) checkFavoriteStatus(); // Run if provider ID exists
  }, [provider?.user_id]); // Dependency on provider ID

  // Fetch available appointment slots when appointment modal opens
  useEffect(() => {
    if (showAppointmentModal) fetchAvailableSlots(); // Fetch slots when modal is shown
  }, [showAppointmentModal, provider?.user_id]); // Dependencies for fetching slots

  // Async function to fetch available appointment slots
  const fetchAvailableSlots = async () => {
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token || !provider?.user_id) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/patients/appointments/availability/${provider.user_id}`,
        {
          headers: { Authorization: `Bearer ${token}` }, // Include auth token
        }
      );
      const data = await response.json();
      if (response.ok) {
        setAvailableSlots(data.slots || []); // Update available slots
        setWorkingHours(data.workingHours || { startHour: 8, endHour: 17 }); // Update working hours
      } else {
        throw new Error(data.message || "Failed to fetch availability");
      }
    } catch (error) {
      setErrorMessage(`Error fetching availability: ${error.message}`); // Set error message
    }
  };

  // Generate time slots for a given date based on working hours
  const generateTimeSlots = (date) => {
    if (!date || isNaN(new Date(date).getTime())) return []; // Return empty if invalid date
    const slots = [];
    for (let hour = workingHours.startHour; hour < workingHours.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date(date);
        time.setHours(hour, minute, 0, 0); // Create slot at 30-minute intervals
        slots.push(time);
      }
    }
    return slots;
  };

  // Check if a time slot is available (not overlapping with booked slots)
  const isSlotAvailable = (slotTime) => {
    const slotStart = new Date(slotTime);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + parseInt(appointmentData.duration || 30)); // Calculate slot end

    return !availableSlots.some((booked) => {
      const bookedStart = new Date(booked.start);
      const bookedEnd = new Date(booked.end);
      return slotStart < bookedEnd && slotEnd > bookedStart; // Check for overlap
    });
  };

  // Handle date selection for appointment
  const handleDateChange = (e) => {
    const date = new Date(e.target.value);
    setSelectedDate(date); // Update selected date
    setAppointmentData({ ...appointmentData, date: "", time: "" }); // Reset date/time
  };

  // Handle selection of a time slot
  const handleSlotSelect = (slotTime) => {
    const timeStr = slotTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    setAppointmentData({
      ...appointmentData,
      date: slotTime.toISOString().split("T")[0], // Set date
      time: timeStr, // Set time
    });
  };

  // Handle input changes for appointment form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData({ ...appointmentData, [name]: value }); // Update form data
    setErrorMessage(""); // Clear error message
  };

  // Handle selection of message suggestion
  const handleMessageSuggestionClick = (message) => {
    setAppointmentData({ ...appointmentData, message }); // Set message
    setErrorMessage(""); // Clear error message
  };

  // Handle appointment form submission
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      setErrorMessage("Please log in to book an appointment."); // Prompt login
      return;
    }

    const selectedDateTime = new Date(`${appointmentData.date}T${appointmentData.time}:00`);
    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setDate(now.getDate() + 30); // Max 30 days in advance

    // Validate appointment date
    if (selectedDateTime < now) {
      setErrorMessage("Cannot book an appointment in the past.");
      return;
    }
    if (selectedDateTime > maxDate) {
      setErrorMessage("Appointments can only be booked up to 30 days in advance.");
      return;
    }
    if (!appointmentData.message.trim()) {
      setErrorMessage("Message cannot be empty.");
      return;
    }

    setIsSubmitting(true); // Set submitting state
    setErrorMessage(""); // Clear error message

    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/appointments`, {
        method: "POST", // Use POST to create appointment
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
          "Content-Type": "application/json", // Specify JSON content type
        },
        body: JSON.stringify({
          user_id: provider.user_id,
          date: appointmentData.date,
          time: appointmentData.time,
          message: appointmentData.message,
          duration: parseInt(appointmentData.duration),
        }), // Send appointment data
      });

      const data = await response.json();
      if (response.ok) {
        setShowAppointmentModal(false); // Close modal
        setAppointmentData({ date: "", time: "", message: "", duration: "30" }); // Reset form
        setSelectedDate(null); // Clear selected date
        fetchAvailableSlots(); // Refresh available slots
      } else {
        throw new Error(data.message || "Failed to request appointment");
      }
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`); // Set error message
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  // Determine rating color based on average rating
  const getRatingColor = (rating) => {
    if (!rating) return "text-gray-500"; // Default for no rating
    const numRating = parseFloat(rating);
    if (numRating >= 4) return "text-green-600"; // High rating
    if (numRating >= 3) return "text-yellow-500"; // Medium rating
    return "text-red-600"; // Low rating
  };

  // Determine review background color based on rating
  const getReviewBackground = (rating) => {
    if (!rating) return "bg-gray-50"; // Default for no rating
    const numRating = parseFloat(rating);
    if (numRating >= 4) return "bg-green-50"; // High rating
    if (numRating >= 3) return "bg-yellow-50"; // Medium rating
    return "bg-red-50"; // Low rating
  };

  // Toggle favorite status for provider
  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      return;
    }

    setIsFavoriteLoading(true); // Set loading state
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/favorites`, {
        method: isFavorite ? "DELETE" : "POST", // Use DELETE to remove, POST to add
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
          "Content-Type": "application/json", // Specify JSON content type
        },
        body: JSON.stringify({ healthcare_id: provider.user_id }), // Send provider ID
      });

      const data = await response.json();
      if (response.ok) {
        setIsFavorite(!isFavorite); // Toggle favorite status
      } else {
        throw new Error(data.message || "Failed to update favorites");
      }
    } catch (error) {
      console.error("Error updating favorite:", error); // Log error
    } finally {
      setIsFavoriteLoading(false); // Reset loading state
    }
  };

  // Fetch provider profile data
  const fetchProfile = async () => {
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      return;
    }

    setProfileLoading(true); // Set loading state
    setProfileError(""); // Clear previous errors
    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/profile/${provider.user_id}`, {
        headers: { Authorization: `Bearer ${token}` }, // Include auth token
      });

      if (!response.ok) throw new Error(`Server error: ${await response.text()}`);
      const data = await response.json();
      setProfileData(data); // Update profile data
      setShowProfileModal(true); // Open profile modal
    } catch (error) {
      setProfileError(`Failed to load profile: ${error.message}`); // Set error message
    } finally {
      setProfileLoading(false); // Reset loading state
    }
  };

  // Render provider details based on healthcare type
  const renderProviderDetails = () => {
    if (!provider.healthcare_type) {
      return <div className="text-gray-500 text-sm">Provider type not available</div>; // Handle missing type
    }

    // Common details for all provider types
    const commonDetails = (
      <div className="space-y-3 text-gray-600 text-sm">
        <div className="flex justify-between">
          <span className="font-semibold">Type:</span>
          <span>{provider.healthcare_type.charAt(0).toUpperCase() + provider.healthcare_type.slice(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Email:</span>
          <span>{provider.email || "Not provided"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Phone:</span>
          <span>{provider.phone_number || "Not provided"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">Location:</span>
          {provider.location_link ? (
            <a
              href={provider.location_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          ) : (
            <span>Not provided</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Hours:</span>
          <span>{provider.working_hours || "Not specified"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Delivery:</span>
          <span className={provider.can_deliver ? "text-green-600" : "text-red-600"}>
            {provider.can_deliver ? "Yes" : "No"}
          </span>
        </div>
      </div>
    );

    // Render additional details based on provider type
    switch (provider.healthcare_type) {
      case "doctor":
        return (
          <>
            {commonDetails}
            <div className="space-y-3 text-gray-600 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Specialty:</span>
                <span>{provider.speciality || "Not specified"}</span>
              </div>
              {provider.clinic_name && (
                <div className="flex justify-between">
                  <span className="font-semibold">Clinic:</span>
                  <span>{provider.clinic_name}</span>
                </div>
              )}
              {provider.price !== null && provider.price !== undefined && (
                <div className="flex justify-between">
                  <span className="font-semibold">Consultation Fee From:</span>
                  <span>{provider.price.toFixed(2)}$</span>
                </div>
              )}
            </div>
          </>
        );
      case "nurse":
        return (
          <>
            {commonDetails}
            <div className="space-y-3 text-gray-600 text-sm">
              {provider.ward && (
                <div className="flex justify-between">
                  <span className="font-semibold">Ward:</span>
                  <span>{provider.ward}</span>
                </div>
              )}
              {provider.clinic_name && (
                <div className="flex justify-between">
                  <span className="font-semibold">Clinic:</span>
                  <span>{provider.clinic_name}</span>
                </div>
              )}
              {provider.price !== null && provider.price !== undefined && (
                <div className="flex justify-between">
                  <span className="font-semibold">Service Fee:</span>
                  <span>${provider.price.toFixed(2)}</span>
                </div>
              )}
            </div>
          </>
        );
      case "pharmacy":
        return (
          <>
            {commonDetails}
            <div className="space-y-3 text-gray-600 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Name:</span>
                <span>{provider.pharmacy_name || "Not specified"}</span>
              </div>
            </div>
          </>
        );
      case "laboratory":
        return (
          <>
            {commonDetails}
            <div className="space-y-3 text-gray-600 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Name:</span>
                <span>{provider.lab_name || "Not specified"}</span>
              </div>
              {provider.equipment && (
                <div className="flex justify-between">
                  <span className="font-semibold">Equipment:</span>
                  <span>{provider.equipment}</span>
                </div>
              )}
              {provider.clinic_name && (
                <div className="flex justify-between">
                  <span className="font-semibold">Clinic:</span>
                  <span>{provider.clinic_name}</span>
                </div>
              )}
            </div>
          </>
        );
      default:
        return commonDetails;
    }
  };

  // Render provider profile details in modal
  const renderProfileDetails = () => {
    if (profileLoading) return <p className="text-gray-600 text-center">Loading profile...</p>;
    if (profileError) return <p className="text-red-600 text-center">{profileError}</p>;
    if (!profileData) return <p className="text-gray-600 text-center">No profile data available.</p>;

    return (
      <div className="space-y-6">
        {/* Profile Image and Name */}
        <div className="flex flex-col items-center mb-6">
          {profileData.profile_image ? (
            <img
              src={profileData.profile_image}
              alt={`${profileData.name}'s profile`}
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-lg"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/96?text=No+Image"; // Fallback image
              }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
              <img
              src={DocPlaceHolder}
              alt={`${profileData.name}'s profile`}
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-lg"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/96?text=No+Image"; // Fallback image
              }}
            />
            </div>
          )}
          <h3 className="mt-4 text-2xl font-bold text-gray-900">{profileData.name}</h3>
        </div>
        {/* Profile Details */}
        <div className="text-gray-600 text-sm space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold">Type:</span>
            <span>{profileData.healthcare_type.charAt(0).toUpperCase() + profileData.healthcare_type.slice(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Email:</span>
            <span>{profileData.email || "Not provided"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Phone:</span>
            <span>{profileData.phone_number || "Not provided"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Location:</span>
            <span>
              {profileData.location_link ? (
                <a
                  href={profileData.location_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Map
                </a>
              ) : (
                "Not provided"
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Hours:</span>
            <span>{profileData.working_hours || "Not specified"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Delivery:</span>
            <span>{profileData.can_deliver ? "Yes" : "No"}</span>
          </div>
          {profileData.healthcare_type === "doctor" && (
            <>
              <div className="flex justify-between">
                <span className="font-semibold">Specialty:</span>
                <span>{profileData.speciality || "Not specified"}</span>
              </div>
              {profileData.clinic_name && (
                <div className="flex justify-between">
                  <span className="font-semibold">Clinic:</span>
                  <span>{profileData.clinic_name}</span>
                </div>
              )}
              {profileData.price !== null && profileData.price !== undefined && (
                <div className="flex justify-between">
                  <span className="font-semibold">Consultation Fee From:</span>
                  <span>{profileData.price.toFixed(2)}$</span>
                </div>
              )}
            </>
          )}
          {profileData.healthcare_type === "nurse" && (
            <>
              {profileData.ward && (
                <div className="flex justify-between">
                  <span className="font-semibold">Ward:</span>
                  <span>{profileData.ward}</span>
                </div>
              )}
              {profileData.clinic_name && (
                <div className="flex justify-between">
                  <span className="font-semibold">Clinic:</span>
                  <span>{profileData.clinic_name}</span>
                </div>
              )}
              {profileData.price !== null && profileData.price !== undefined && (
                <div className="flex justify-between">
                  <span className="font-semibold">Service Fee:</span>
                  <span>${profileData.price.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>
        {/* Ratings and Reviews */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Ratings & Reviews</h4>
          <p className="flex justify-between">
            <span className="font-semibold">Average Rating:</span>
            <span className={getRatingColor(profileData.averageRating)}>
              {profileData.averageRating ? `${profileData.averageRating}/5` : "No ratings yet"}
            </span>
          </p>
          {profileData.comments && profileData.comments.length > 0 ? (
            <div className="mt-4 space-y-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {profileData.comments.map((comment, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] ${getReviewBackground(
                    comment.rating
                  )}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-gray-800 text-base">{comment.patientName}</p>
                    <div className="flex items-center space-x-1">
                      <svg
                        className={`w-5 h-5 ${getRatingColor(comment.rating)}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <p className={`text-sm font-medium ${getRatingColor(comment.rating)}`}>
                        {comment.rating}/5
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{comment.comment || "No comment"}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(comment.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 mt-2 text-sm">No reviews yet.</p>
          )}
        </div>
      </div>
    );
  };

  // Render loading state if no provider data
  if (!provider) {
    return (
      <div className="p-6 text-gray-500 text-center">Loading provider data...</div>
    );
  }

  // Main UI for healthcare card
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 max-w-sm w-full mx-auto relative">
      {/* Favorite Button */}
      <button
        onClick={handleToggleFavorite}
        disabled={isFavoriteLoading}
        className={`cursor-pointer absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
          isFavorite
            ? "text-red-500 hover:text-red-600 bg-red-50"
            : "text-gray-400 hover:text-gray-500 bg-gray-50"
        } ${isFavoriteLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavoriteLoading ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8h-8z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>

      {/* Provider Summary */}
      <div
        className="flex items-center space-x-4 mb-6 cursor-pointer"
        onClick={fetchProfile} // Fetch and show profile on click
      >
        {provider.profile_image ? (
          <img
            src={provider.profile_image}
            alt={`${provider.name}'s profile`}
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 shadow-sm"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/64?text=No+Image"; // Fallback image
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium">
            <img
              src={DocPlaceHolder}
              alt={`${provider.name}'s profile`}
              className="w-16 h-16 rounded-full object-cover border-4 border-blue-100 shadow-lg"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/96?text=No+Image"; // Fallback image
              }}
            />
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {provider.name || "Unknown Provider"}
          </h3>
          <p className="text-sm text-gray-500">
            {provider.healthcare_type
              ? provider.healthcare_type.charAt(0).toUpperCase() +
                provider.healthcare_type.slice(1)
              : "Type not specified"}
          </p>
        </div>
      </div>

      {/* Provider Details */}
      <div className="mb-6">{renderProviderDetails()}</div>

      {/* Schedule Appointment Button */}
      <button
        onClick={() => setShowAppointmentModal(true)} // Open appointment modal
        className="cursor-pointer w-full bg-blue-600 text-white py-3 px-4 rounded-full hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
      >
        Schedule Appointment
      </button>

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#00000247] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                Schedule with {provider.name || "Provider"}
              </h3>
              <button
                onClick={() => {
                  setShowAppointmentModal(false); // Close modal
                  setSelectedDate(null); // Clear selected date
                  setErrorMessage(""); // Clear error message
                }}
                className="cursor-pointer text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAppointmentSubmit} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  onChange={handleDateChange}
                  min={new Date().toISOString().split("T")[0]} // Minimum date is today
                  max={new Date(
                    new Date().setDate(new Date().getDate() + 30)
                  ).toISOString().split("T")[0]} // Maximum date is 30 days from now
                  className="cursor-pointer w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 shadow-sm"
                  required
                />
              </div>

              {/* Duration and Time Slots */}
              {selectedDate && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Duration
                    </label>
                    <select
                      name="duration"
                      value={appointmentData.duration}
                      onChange={handleInputChange} // Update duration
                      className="cursor-pointer w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 shadow-sm"
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Time Slots
                    </label>
                    <div className="max-h-48 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                      {generateTimeSlots(selectedDate).length === 0 ? (
                        <p className="text-gray-500 text-sm text-center">
                          No available slots within working hours.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {generateTimeSlots(selectedDate).map((time) => {
                            const isAvailable = isSlotAvailable(time); // Check if slot is available
                            const timeStr = time.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            });
                            const isSelected = appointmentData.time === timeStr; // Check if slot is selected
                            const displayTime = new Date(time);

                            return (
                              <button
                                key={time.toISOString()}
                                type="button"
                                onClick={() => handleSlotSelect(time)} // Select time slot
                                className={`cursor-pointer p-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                                  isAvailable
                                    ? isSelected
                                      ? "bg-blue-500 text-white shadow-md"
                                      : "bg-white text-gray-800 border border-gray-200 hover:bg-blue-50 hover:border-blue-500"
                                    : "bg-gray-200 text-gray-500 cursor-not-allowed opacity-80"
                                }`}
                                disabled={!isAvailable}
                              >
                                {displayTime.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reason for Visit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Visit
                </label>
                <div className="mb-3 flex overflow-x-auto space-x-2 pb-2">
                  {messageSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMessageSuggestionClick(suggestion)} // Select suggestion
                      className="cursor-pointer px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-all duration-200 whitespace-nowrap"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <textarea
                  name="message"
                  value={appointmentData.message}
                  onChange={handleInputChange} // Update message
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 resize-none shadow-sm"
                  rows="3"
                  placeholder="Reason for visit..."
                  required
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {errorMessage}
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAppointmentModal(false); // Close modal
                    setSelectedDate(null); // Clear selected date
                    setErrorMessage(""); // Clear error message
                  }}
                  className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center shadow-sm ${
                    isSubmitting || !appointmentData.time
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  disabled={isSubmitting || !appointmentData.time} // Disable if submitting or no time selected
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8h-8z"
                        />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Book Appointment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-[#00000336] bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full transform transition-all duration-500 ease-out scale-100 hover:scale-[1.01] border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Provider Profile
              </h3>
              <button
                onClick={() => setShowProfileModal(false)} // Close modal
                className="cursor-pointer text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 -top-4 -z-10 bg-gradient-to-b from-blue-50 to-transparent rounded-3xl opacity-50"></div>
              {renderProfileDetails()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}