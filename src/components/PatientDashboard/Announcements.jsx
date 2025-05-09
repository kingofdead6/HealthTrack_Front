import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../api";
import ReportUser from "../Shared/ReportUser";

// HealthcareAnnouncements component to manage and display healthcare announcements
export default function HealthcareAnnouncements({ user }) {
  // State declarations for managing announcements and UI
  const [announcements, setAnnouncements] = useState([]); // Store fetched announcements
  const [loading, setLoading] = useState(false); // Indicate loading state during API fetch
  const [error, setError] = useState(""); // Store error messages
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" }); // Store new announcement input
  const [isSubmitting, setIsSubmitting] = useState(false); // Indicate submission state for new announcement
  const [searchQuery, setSearchQuery] = useState(""); // Store search input query
  const [visitedDoctorsOnly, setVisitedDoctorsOnly] = useState(false); // Toggle filter for visited doctors
  const [showCreateModal, setShowCreateModal] = useState(false); // Toggle create announcement modal
  const [selectedHealthcare, setSelectedHealthcare] = useState(null); // Store selected healthcare provider profile
  const [healthcareLoading, setHealthcareLoading] = useState(false); // Indicate loading state for healthcare profile
  const [healthcareError, setHealthcareError] = useState(""); // Store healthcare profile error messages
  const [showReportModal, setShowReportModal] = useState(false); // Toggle report user modal
  const [reportUserId, setReportUserId] = useState(null); // Store ID of user to report
  const [reportSuccess, setReportSuccess] = useState(""); // Store success message for reporting
  // Determine if user can create announcements (healthcare, approved, not banned)
  const canCreateAnnouncement = user?.user_type === "healthcare" && user?.isApproved && !user?.isBanned;

  // Fetch announcements on mount and when visitedDoctorsOnly changes
  useEffect(() => {
    fetchAnnouncements(); // Call fetch function
  }, [visitedDoctorsOnly]); // Dependency for refetching on filter change

  // Async function to fetch announcements from API
  const fetchAnnouncements = async () => {
    setLoading(true); // Set loading state to true
    const token = localStorage.getItem("token"); // Retrieve auth token from localStorage
    if (!token) {
      setError("Please log in to view announcements."); // Set error if no token
      setLoading(false); // Reset loading state
      return;
    }

    try {
      const url = new URL(`${API_BASE_URL}/api/healthcare/announcements`); // Create URL for API request
      if (visitedDoctorsOnly) {
        url.searchParams.append("visited", "true"); // Add visited filter if enabled
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token in headers
          "Content-Type": "application/json", // Specify JSON content type
        },
      });
      const data = await response.json(); // Parse response JSON
      if (response.ok) {
        setAnnouncements(data); // Update announcements state
      } else {
        throw new Error(data.message || "Failed to fetch announcements"); // Throw error on failure
      }
    } catch (err) {
      setError(err.message); // Set error message from exception
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Handle input changes for new announcement form
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Extract input name and value
    setNewAnnouncement((prev) => ({ ...prev, [name]: value })); // Update new announcement state
  };

  // Handle submission of new announcement
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      setError("Please log in to create an announcement."); // Set error if no token
      return;
    }

    // Validate announcement title and content
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      setError("Title and content are required."); // Set error if fields are empty
      return;
    }

    setIsSubmitting(true); // Set submitting state to true
    setError(""); // Clear previous errors

    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/announcements`, {
        method: "POST", // Use POST method to create announcement
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
          "Content-Type": "application/json", // Specify JSON content type
        },
        body: JSON.stringify(newAnnouncement), // Send new announcement data
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Server error: ${response.status}`); // Throw error on failure
      }

      const data = await response.json(); // Parse response JSON
      setAnnouncements([data.announcement, ...announcements]); // Prepend new announcement to list
      setNewAnnouncement({ title: "", content: "" }); // Reset form
      setShowCreateModal(false); // Close modal
    } catch (err) {
      setError(err.message || "An unexpected error occurred"); // Set error message
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  // Async function to fetch healthcare provider profile
  const fetchHealthcareProfile = async (healthcareId) => {
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      return; // Exit if no token
    }

    setHealthcareLoading(true); // Set loading state to true
    setHealthcareError(""); // Clear previous errors
    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/profile/${healthcareId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
          "Content-Type": "application/json", // Specify JSON content type
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 50)}...`); // Throw error on failure
      }

      const data = await response.json(); // Parse response JSON
      setSelectedHealthcare(data); // Update selected healthcare state
    } catch (err) {
      setHealthcareError(`Failed to load profile: ${err.message}`); // Set error message
    } finally {
      setHealthcareLoading(false); // Reset loading state
    }
  };

  // Handle click on healthcare provider to view profile
  const handleHealthcareClick = (healthcareId) => {
    fetchHealthcareProfile(healthcareId); // Fetch profile for given ID
  };

  // Handle click to report a healthcare provider
  const handleReportClick = (healthcareId) => {
    setReportUserId(healthcareId); // Set ID of user to report
    setShowReportModal(true); // Open report modal
  };

  // Handle successful report submission
  const handleReportSuccess = () => {
    setShowReportModal(false); // Close report modal
    setReportUserId(null); // Clear reported user ID
    setReportSuccess("Report submitted successfully!"); // Show success message
    setTimeout(() => setReportSuccess(""), 3000); // Clear message after 3 seconds
  };

  // Filter announcements based on search query
  const filteredAnnouncements = announcements
    .filter(
      (announcement) =>
        announcement.healthcare_id?._id && // Ensure healthcare ID exists
        announcement.healthcare_id?.name !== "User deleted" && // Exclude deleted users
        (announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) || // Search by title
          announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) || // Search by content
          announcement.healthcare_id?.name.toLowerCase().includes(searchQuery.toLowerCase())) // Search by provider name
    );

  // Determine rating color based on average rating
  const getRatingColor = (rating) => {
    if (!rating || rating === "No ratings yet") return "bg-gray-200 text-gray-700"; // Default for no rating
    const numRating = parseFloat(rating); 
    if (numRating >= 4) return "bg-green-100 text-green-800"; // High rating
    if (numRating >= 3) return "bg-yellow-100 text-yellow-800"; // Medium rating
    return "bg-red-100 text-red-800"; // Low rating
  };

  // Main UI for healthcare announcements
  return (
    <div className="min-h-screen bg-[#E1EEFF]">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
          <div className="flex space-x-4">
            {user?.user_type === "healthcare" && (
              <button
                onClick={() => canCreateAnnouncement && setShowCreateModal(true)} // Open modal if allowed
                className={`py-2 px-4 rounded-lg transition-colors duration-200 font-medium shadow-sm ${
                  canCreateAnnouncement
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`} // Conditional styling based on permission
                disabled={!canCreateAnnouncement} // Disable if not allowed
                title={
                  !canCreateAnnouncement
                    ? user.isBanned
                      ? "Banned accounts cannot create announcements"
                      : "Your account must be approved to create announcements"
                    : "Create Announcement"
                } // Tooltip for disabled state
              >
                Create Announcement
              </button>
            )}
          </div>
          <label className="flex items-center space-x-2 text-gray-700">
            <input
              type="checkbox"
              checked={visitedDoctorsOnly}
              onChange={(e) => setVisitedDoctorsOnly(e.target.checked)} // Toggle visited doctors filter
              className="h-5 w-5 text-blue-600 rounded-full focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 appearance-none border-2 border-gray-300 checked:bg-blue-600 checked:border-blue-600 cursor-pointer"
            />
            <span>Show only doctors I’ve visited</span>
          </label>
        </div>

        {/* Search Bar */}
        <div className="mb-16 flex justify-center">
          <div className="relative w-full max-w-4xl">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  /> {/* Search icon */}
                </svg>
              </div>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Update search query
              className="w-full pl-16 pr-3 py-2 h-16 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:font-bold placeholder:text-gray-500 shadow-sm"
              placeholder="Search announcements..." // Search input
            />
          </div>
        </div>

        {/* Report Success Message */}
        {reportSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">
            {reportSuccess}
          </div>
        )}

        {/* Announcements List */}
        {loading ? (
          <p className="text-gray-600 text-center animate-pulse">Loading announcements...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : filteredAnnouncements.length === 0 ? (
          <p className="text-gray-600 text-center">
            {visitedDoctorsOnly
              ? "No announcements from doctors you’ve visited."
              : "No announcements found."} {/* Message for no results */}
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
              >
                {/* Provider Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => handleHealthcareClick(announcement.healthcare_id._id)} // Fetch profile on click
                  >
                    {announcement.healthcare_id?.profile_image ? (
                      <img
                        src={announcement.healthcare_id.profile_image}
                        alt={`${announcement.healthcare_id.name}'s profile`}
                        className="w-16 h-16 rounded-full object-cover border-4 border-indigo-200 shadow-sm"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/64?text=Image+Not+Found")} // Fallback image
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-indigo-600 font-semibold hover:underline block text-lg cursor-pointer"
                        onClick={() => handleHealthcareClick(announcement.healthcare_id._id)} // Fetch profile on click
                      >
                        {announcement.healthcare_id?.name || "Unknown Provider"}
                      </span>
                      <button
                        onClick={() => handleReportClick(announcement.healthcare_id._id)} // Open report modal
                        className="cursor-pointer text-red-600 hover:text-red-800 transition-colors duration-200 border-2 rounded-full"
                        title="Report this provider"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v3m0 0v3m0-3h3m-3 0H9 Community Guidelinesm12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          /> {/* Report icon */}
                        </svg>
                      </button>
                    </div>
                    {announcement.healthcare_id?.speciality && (
                      <span className="text-sm text-gray-500 block">
                        {announcement.healthcare_id.speciality}
                      </span>
                    )}
                    {announcement.healthcare_id?.location_link && (
                      <a
                        href={announcement.healthcare_id.location_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline text-sm block"
                      >
                        View Location
                      </a>
                    )}
                  </div>
                </div>
                {/* Announcement Content */}
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-2">{announcement.title.toUpperCase()}</h3>
                  <p className="text-gray-600 text-sm">{announcement.content}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(announcement.createdAt).toLocaleString()} {/* Display creation date */}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Announcement Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-[#00000034] flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Create Announcement</h3>
                <button
                  onClick={() => setShowCreateModal(false)} // Close modal
                  className="cursor-pointer text-gray-500 hover:text-red-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> {/* Close icon */}
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newAnnouncement.title}
                    onChange={handleInputChange} // Update title input
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400"
                    placeholder="Enter announcement title"
                    disabled={isSubmitting} // Disable during submission
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">Content</label>
                  <textarea
                    name="content"
                    value={newAnnouncement.content}
                    onChange={handleInputChange} // Update content input
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400 resize-y"
                    rows="4"
                    placeholder="Enter announcement content"
                    disabled={isSubmitting} // Disable during submission
                  />
                </div>
                {error && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> {/* Error icon */}
                    </svg>
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)} // Close modal
                    className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium shadow-sm"
                    disabled={isSubmitting} // Disable during submission
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`} // Conditional styling for submitting state
                    disabled={isSubmitting} // Disable during submission
                  >
                    {isSubmitting ? "Submitting..." : "Submit"} {/* Display submitting or default text */}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Healthcare Profile Modal */}
        {selectedHealthcare && (
          <div className="fixed inset-0 bg-[#00000034] flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Healthcare Profile</h3>
                <button
                  onClick={() => setSelectedHealthcare(null)} // Close modal
                  className="cursor-pointer text-gray-500 hover:text-red-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> {/* Close icon */}
                  </svg>
                </button>
              </div>
              {healthcareLoading ? (
                <p className="text-gray-600 text-center animate-pulse">Loading healthcare details...</p>
              ) : healthcareError ? (
                <p className="text-red-600 text-center">{healthcareError}</p>
              ) : (
                <div className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex justify-center mb-4">
                    {selectedHealthcare.profile_image ? (
                      <img
                        src={selectedHealthcare.profile_image}
                        alt={`${selectedHealthcare.name}'s profile`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-md"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/96?text=Image+Not+Found")} // Fallback image
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium shadow-md">
                        No Image
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 text-center">{selectedHealthcare.name}</h3>
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Basic Info</h4>
                      <div className="text-gray-700 text-sm space-y-3">
                        <p>
                          <strong>Type:</strong>{" "}
                          {selectedHealthcare.healthcare_type.charAt(0).toUpperCase() +
                            selectedHealthcare.healthcare_type.slice(1)} {/* Capitalize type */}
                        </p>
                        <p>
                          <strong>Email:</strong> {selectedHealthcare.email || "Not provided"}
                        </p>
                        <p>
                          <strong>Phone:</strong> {selectedHealthcare.phone_number || "Not provided"}
                        </p>
                      </div>
                    </div>
                    {/* Additional Details */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Additional Details</h4>
                      <div className="text-gray-700 text-sm space-y-3">
                        <p>
                          <strong>Location:</strong>{" "}
                          {selectedHealthcare.location_link ? (
                            <a
                              href={selectedHealthcare.location_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              View Location
                            </a>
                          ) : (
                            "Not provided"
                          )}
                        </p>
                        <p>
                          <strong>Hours:</strong> {selectedHealthcare.working_hours || "Not specified"}
                        </p>
                        <p>
                          <strong>Delivery:</strong> {selectedHealthcare.can_deliver ? "Yes" : "No"}
                        </p>
                        {selectedHealthcare.speciality && (
                          <p>
                            <strong>Specialty:</strong> {selectedHealthcare.speciality}
                          </p>
                        )}
                        {selectedHealthcare.ward && (
                          <p>
                            <strong>Ward:</strong> {selectedHealthcare.ward}
                          </p>
                        )}
                        {selectedHealthcare.pharmacy_name && (
                          <p>
                            <strong>Pharmacy:</strong> {selectedHealthcare.pharmacy_name}
                          </p>
                        )}
                        {selectedHealthcare.lab_name && (
                          <p>
                            <strong>Laboratory:</strong> {selectedHealthcare.lab_name}
                          </p>
                        )}
                        {selectedHealthcare.clinic_name && (
                          <p>
                            <strong>Clinic:</strong> {selectedHealthcare.clinic_name}
                          </p>
                        )}
                        {(selectedHealthcare.healthcare_type === "doctor" ||
                          selectedHealthcare.healthcare_type === "nurse") && (
                          <p>
                            <strong>
                              {selectedHealthcare.healthcare_type === "doctor"
                                ? "Consultation Fee"
                                : "Service Fee"}
                              :
                            </strong>{" "}
                            {selectedHealthcare.price !== null && selectedHealthcare.price !== undefined
                              ? `$${selectedHealthcare.price.toFixed(2)}`
                              : "Not available"} {/* Format price */}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Ratings & Reviews */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Ratings & Reviews</h4>
                    <p>
                      <strong>Average Rating:</strong>{" "}
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(
                          selectedHealthcare.averageRating
                        )}`} // Apply rating color
                      >
                        {selectedHealthcare.averageRating || "No ratings yet"}
                      </span>
                    </p>
                    {selectedHealthcare.comments && selectedHealthcare.comments.length > 0 ? (
                      <div className="mt-4 space-y-3 max-h-40 overflow-y-auto">
                        {selectedHealthcare.comments.map((comment, index) => (
                          <div key={index} className="border p-3 rounded-lg bg-gray-50 shadow-sm">
                            <p className="font-medium text-gray-800">
                              {comment.patientName} - <span className="text-yellow-500">{comment.rating}/5</span>
                            </p>
                            <p className="text-gray-600">{comment.comment || "No comment"}</p>
                            <p className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 mt-2">No reviews yet.</p>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedHealthcare(null)} // Close modal
                  className="cursor-pointer px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report User Modal */}
        {showReportModal && (
          <ReportUser
            reportedId={reportUserId} // Pass ID of user to report
            onClose={() => {
              setShowReportModal(false); // Close modal
              setReportUserId(null); // Clear reported user ID
            }}
            onSuccess={handleReportSuccess} // Handle successful report
          />
        )}
      </div>
    </div>
  );
}