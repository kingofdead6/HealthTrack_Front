import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../api";
import axios from "axios";

// PatientAppointments component to manage and display patient appointments
export default function PatientAppointments() {
  // State declarations for managing appointments and UI
  const [appointments, setAppointments] = useState([]); // Store all fetched appointments
  const [filteredAppointments, setFilteredAppointments] = useState([]); // Store filtered appointments
  const [loading, setLoading] = useState(false); // Indicate loading state during API fetch
  const [error, setError] = useState(""); // Store error messages
  const [ratingData, setRatingData] = useState({ appointmentId: null, rating: 0, comment: "" }); // Store rating form data
  const [showRatingModal, setShowRatingModal] = useState(false); // Toggle rating modal
  const [searchQuery, setSearchQuery] = useState(""); // Store search input query
  const [selectedDate, setSelectedDate] = useState(""); // Store selected date filter
  const [sortOrder, setSortOrder] = useState("newest"); // Store sort order (newest/oldest)
  const [statusFilter, setStatusFilter] = useState(""); // Store status filter
  const [patient, setPatient] = useState(null); // Store patient profile data
  const navigate = useNavigate(); // Enable programmatic navigation

  // Fetch appointments and patient profile on component mount
  useEffect(() => {
    // Async function to fetch patient appointments
    const fetchAppointments = async () => {
      setLoading(true); // Set loading state to true
      const token = localStorage.getItem("token"); // Retrieve auth token
      if (!token) {
        navigate("/login"); // Redirect to login if no token
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/patients/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include auth token
            "Content-Type": "application/json", // Specify JSON content type
          },
        });
        const data = await response.json(); // Parse response JSON
        if (response.ok) {
          setAppointments(data); // Update appointments state
          setFilteredAppointments(data); // Initialize filtered appointments
        } else {
          throw new Error(data.message || "Failed to fetch appointments"); // Throw error on failure
        }
      } catch (err) {
        setError(err.message); // Set error message
      } finally {
        setLoading(false); // Reset loading state
      }
    };

    // Async function to fetch patient profile
    const fetchPatientProfile = async () => {
      const token = localStorage.getItem("token"); // Retrieve auth token
      if (!token) {
        navigate("/login"); // Redirect to login if no token
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/patients/profile`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include auth token
            "Content-Type": "application/json", // Specify JSON content type
          },
        });
        const data = await response.json(); // Parse response JSON
        if (response.ok) {
          setPatient(data.patient); // Update patient state
        } else {
          throw new Error(data.message || "Failed to fetch patient profile"); // Throw error on failure
        }
      } catch (err) {
        setError(err.message); // Set error message
      }
    };

    fetchAppointments(); // Call fetch appointments
    fetchPatientProfile(); // Call fetch patient profile
  }, [navigate]); // Dependency for navigation changes

  // Filter and sort appointments based on search, date, status, and sort order
  useEffect(() => {
    let result = [...appointments]; // Create a copy of appointments

    // Apply search query filter
    if (searchQuery) {
      result = result.filter((appt) =>
        (appt.user_id?.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase()) // Search by provider name
      );
    }

    // Apply date filter
    if (selectedDate) {
      result = result.filter(
        (appt) => new Date(appt.date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString() // Filter by selected date
      );
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter((appt) => appt.status === statusFilter); // Filter by status
    }

    // Sort appointments by date
    result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB; // Sort newest or oldest first
    });

    setFilteredAppointments(result); // Update filtered appointments
  }, [appointments, searchQuery, selectedDate, sortOrder, statusFilter]); // Dependencies for filtering/sorting

  // Handle downloading appointment PDF with QR code
  const handleDownloadAppointmentPDF = async (appointment) => {
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      navigate("/login"); // Redirect to login if no token
      return;
    }

    try {
      // Prepare QR code data
      const qrData = JSON.stringify({
        patientName: patient?.name || "Unknown",
        doctorName: appointment.user_id.name,
        date: new Date(appointment.date).toLocaleDateString(),
        time: appointment.time,
        appointmentId: appointment._id,
      });

      // Request PDF from API
      const response = await axios.post(
        `${API_BASE_URL}/api/healthcare/qr-code/validate`,
        { qrData },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include auth token
            "Content-Type": "application/json", // Specify JSON content type
          },
          responseType: "blob", // Expect binary response
        }
      );

      // Create and trigger download of PDF
      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `appointment_${appointment._id}_${patient?.name || "patient"}.pdf`; // Set file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl); // Clean up URL
    } catch (error) {
      setError(error.response?.data?.message || "Failed to download PDF"); // Set error message
    }
  };

  // Handle submission of appointment rating
  const handleRatingSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    const token = localStorage.getItem("token"); // Retrieve auth token
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/appointments/rate`, {
        method: "POST", // Use POST to submit rating
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
          "Content-Type": "application/json", // Specify JSON content type
        },
        body: JSON.stringify(ratingData), // Send rating data
      });
      const data = await response.json(); // Parse response JSON
      if (response.ok) {
        // Update appointment with new rating and comment
        setAppointments((prev) =>
          prev.map((appt) =>
            appt._id === ratingData.appointmentId
              ? { ...appt, rating: ratingData.rating, comment: ratingData.comment }
              : appt
          )
        );
        setShowRatingModal(false); // Close modal
        setRatingData({ appointmentId: null, rating: 0, comment: "" }); // Reset rating form
      } else {
        throw new Error(data.message || "Failed to submit rating"); // Throw error on failure
      }
    } catch (err) {
      setError(err.message); // Set error message
    }
  };

  // Handle star rating selection
  const handleStarClick = (rating) => {
    setRatingData({ ...ratingData, rating }); // Update rating in form data
  };

  // Render star rating UI
  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-5 h-5 ${
            i <= rating ? "text-yellow-400 fill-current" : "text-gray-500 fill-current"
          } ${interactive ? "cursor-pointer hover:text-yellow-500" : ""}`} // Conditional styling
          onClick={interactive ? () => handleStarClick(i) : undefined} // Enable click for interactive stars
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /> {/* Star shape */}
        </svg>
      );
    }
    return stars;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] flex items-center justify-center">
        <div className="text-gray-600 text-lg animate-pulse">Loading appointments...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] flex items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Main UI for appointments
  return (
    <div className="min-h-screen bg-[#e1eeff1b] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Filters and Sorting Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <input
            type="text"
            placeholder="Search by provider name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query
            className="w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 placeholder-gray-400"
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)} // Update date filter
            className="cursor-pointer w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)} // Update status filter
            className="cursor-pointer w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)} // Update sort order
            className="cursor-pointer w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg font-medium">
              {searchQuery || selectedDate || statusFilter
                ? "No matching appointments found."
                : "No appointments found. Book one today!"} {/* Message for no results */}
            </p>
          </div>
        ) : (
          <div className="grid gap-10 grid-cols-1 md:grid-cols-2">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-100"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  {/* Appointment Details */}
                  <div className="flex-1 space-y-3">
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                      <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-800">Provider:</strong>{" "}
                        {appointment.user_id?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                      <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-800">Date:</strong>{" "}
                        {new Date(appointment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                      <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-800">Time:</strong>{" "}
                        {appointment.time ||
                          new Date(appointment.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} {/* Fallback to date if no time */}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                      <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-800">Message:</strong>{" "}
                        {appointment.message || "No message provided"}
                      </p>
                    </div>
                    {(appointment.status === "active" || appointment.status === "completed") && (
                      <button
                        onClick={() => handleDownloadAppointmentPDF(appointment)} // Download PDF
                        className="cursor-pointer mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 font-medium shadow-sm"
                      >
                        Download PDF
                      </button>
                    )}
                    {appointment.status === "completed" && !appointment.rating && (
                      <button
                        onClick={() => {
                          setRatingData({ ...ratingData, appointmentId: appointment._id }); // Set appointment ID for rating
                          setShowRatingModal(true); // Open rating modal
                        }}
                        className="cursor-pointer mt-2 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 font-medium shadow-sm"
                      >
                        Rate This Appointment
                      </button>
                    )}
                  </div>
                  {/* Status, Rating, and QR Code */}
                  <div className="flex flex-col items-center md:w-1/3 space-y-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        appointment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "active"
                          ? "bg-blue-100 text-blue-800"
                          : appointment.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`} // Conditional styling for status
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)} {/* Capitalize status */}
                    </span>
                    {appointment.rating && (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-1">
                          {renderStars(appointment.rating)} {/* Display rating stars */}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          {appointment.comment || "No comment"}
                        </p>
                      </div>
                    )}
                    {(appointment.status === "active" || appointment.status === "completed") &&
                      appointment.qrCodeUrl && (
                        <div className="mt-4 text-center">
                          <p className="text-gray-700 text-sm font-semibold mb-2">Appointment QR Code:</p>
                          <img
                            src={appointment.qrCodeUrl}
                            alt="Appointment QR Code"
                            className="ml-3 w-32 h-32 object-contain"
                          />
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-[#0000006c] flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Rate Your Appointment</h3>
                <button
                  onClick={() => setShowRatingModal(false)} // Close modal
                  className="cursor-pointer text-gray-500 hover:text-red-500 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> {/* Close icon */}
                  </svg>
                </button>
              </div>
              <form onSubmit={handleRatingSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Rating</label>
                  <div className="flex space-x-2">
                    {renderStars(ratingData.rating, true)} {/* Interactive stars for rating */}
                  </div>
                  {ratingData.rating === 0 && (
                    <p className="text-red-500 text-sm mt-1">Please select a rating</p> // Validation message
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Comment</label>
                  <textarea
                    value={ratingData.comment}
                    onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })} // Update comment
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 resize-none"
                    rows="4"
                    placeholder="Share your feedback..."
                    required // Make comment mandatory
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)} // Close modal
                    className="cursor-pointer px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300 font-medium shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ratingData.rating === 0} // Disable if no rating selected
                    className={`cursor-pointer px-6 py-2 rounded-lg text-white font-medium transition-colors duration-300 shadow-sm ${
                      ratingData.rating === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`} // Conditional styling
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}