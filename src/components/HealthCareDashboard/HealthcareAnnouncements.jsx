import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../../api";
import ReportUser from "../Shared/ReportUser";

// HealthcareAnnouncements component to manage and display announcements
export default function HealthcareAnnouncements() {
  // State for announcements, UI control, and form inputs
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHealthcare, setSelectedHealthcare] = useState(null);
  const [healthcareLoading, setHealthcareLoading] = useState(false);
  const [healthcareError, setHealthcareError] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUserId, setReportUserId] = useState(null);
  const [reportSuccess, setReportSuccess] = useState("");

  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to view announcements.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/announcements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAnnouncements(data);
      } else {
        throw new Error(data.message || "Failed to fetch announcements");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for new announcement form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAnnouncement((prev) => ({ ...prev, [name]: value }));
  };

  // Submit new announcement
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to create an announcement.");
      return;
    }

    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Create announcement via API
      const response = await fetch(`${API_BASE_URL}/api/healthcare/announcements`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAnnouncement),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create announcement");
      }

      const data = await response.json();
      let healthcareData = null;

      // Fetch healthcare profile for additional details
      if (data.announcement.healthcare_id) {
        try {
          const profileResponse = await fetch(`${API_BASE_URL}/api/healthcare/profile/${data.announcement.healthcare_id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (profileResponse.ok) {
            healthcareData = await profileResponse.json();
          }
        } catch (profileErr) {
          console.warn("Failed to fetch healthcare profile in handleSubmit:", profileErr.message);
        }
      }

      // Create enhanced announcement with healthcare details
      const enhancedAnnouncement = {
        ...data.announcement,
        healthcare_id: healthcareData
          ? {
              _id: healthcareData._id,
              name: healthcareData.name,
              profile_image: healthcareData.profile_image || null,
              speciality: healthcareData.speciality || null,
              location_link: healthcareData.location_link || null,
            }
          : {
              _id: data.announcement.healthcare_id,
              name: "Current User",
              profile_image: null,
              speciality: null,
              location_link: null,
            },
        createdAt: data.announcement.createdAt || new Date().toISOString(),
      };

      setAnnouncements([enhancedAnnouncement, ...announcements]);
      setNewAnnouncement({ title: "", content: "" });
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch healthcare profile by ID
  const fetchHealthcareProfile = async (healthcareId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    setHealthcareLoading(true);
    setHealthcareError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/profile/${healthcareId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 50)}...`);
      }

      const data = await response.json();
      setSelectedHealthcare(data);
    } catch (err) {
      setHealthcareError(`Failed to load profile: ${err.message}`);
      console.error("Error fetching healthcare profile:", err.message, { healthcareId });
    } finally {
      setHealthcareLoading(false);
    }
  };

  // Handle click on healthcare provider to fetch profile
  const handleHealthcareClick = (healthcareId) => {
    fetchHealthcareProfile(healthcareId);
  };

  // Open report modal for a healthcare provider
  const handleReportClick = (healthcareId) => {
    setReportUserId(healthcareId);
    setShowReportModal(true);
  };

  // Handle successful report submission
  const handleReportSuccess = () => {
    setShowReportModal(false);
    setReportUserId(null);
    setReportSuccess("Report submitted successfully!");
    setTimeout(() => setReportSuccess(""), 3000);
  };

  // Filter announcements based on search query
  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.healthcare_id?._id &&
      announcement.healthcare_id?.name !== "User deleted" &&
      (announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.healthcare_id?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Determine rating color based on value
  const getRatingColor = (rating) => {
    if (!rating || rating === "No ratings yet") return "bg-gray-200 text-gray-700";
    const numRating = parseFloat(rating);
    if (numRating >= 4) return "bg-green-100 text-green-800";
    if (numRating >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Main UI with create button, search, and announcement cards
  return (
    <div className="min-h-screen bg-[#E1EEFF]">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm"
          >
            Create Announcement
          </button>
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
                  />
                </svg>
              </div>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-3 py-2 h-16 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:font-bold placeholder:text-gray-500 shadow-sm"
              placeholder="Search"
            />
          </div>
        </div>

        {/* Report Success Message */}
        {reportSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">
            {reportSuccess}
          </div>
        )}

        {/* Loading, Error, or No Announcements */}
        {loading ? (
          <p className="text-gray-600 text-center animate-pulse">Loading announcements...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : filteredAnnouncements.length === 0 ? (
          <p className="text-gray-600 text-center">No announcements found.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2">
            {filteredAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => handleHealthcareClick(announcement.healthcare_id._id)}
                  >
                    {announcement.healthcare_id?.profile_image ? (
                      <img
                        src={announcement.healthcare_id.profile_image}
                        alt={`${announcement.healthcare_id.name}'s profile`}
                        className="w-16 h-16 rounded-full object-cover border-4 border-indigo-200 shadow-sm"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/64?text=Image+Not+Found")}
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
                        onClick={() => handleHealthcareClick(announcement.healthcare_id._id)}
                      >
                        {announcement.healthcare_id?.name || "Unknown Provider"}
                      </span>
                      <button
                        onClick={() => handleReportClick(announcement.healthcare_id._id)}
                        className="cursor-pointer text-red-600 hover:text-red-800 transition-colors duration-200"
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
                            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
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
                <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-2">{announcement.title.toUpperCase()}</h3>
                  <p className="text-gray-600 text-sm">{announcement.content}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(announcement.createdAt).toLocaleString()}
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
                  onClick={() => setShowCreateModal(false)}
                  className="cursor-pointer text-gray-500 hover:text-red-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400"
                    placeholder="Enter announcement title"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">Content</label>
                  <textarea
                    name="content"
                    value={newAnnouncement.content}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400 resize-y"
                    rows="4"
                    placeholder="Enter announcement content"
                    disabled={isSubmitting}
                  />
                </div>
                {error && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium shadow-sm"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
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
                  onClick={() => setSelectedHealthcare(null)}
                  className="cursor-pointer text-gray-500 hover:text-red-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {healthcareLoading ? (
                <p className="text-gray-600 text-center animate-pulse">Loading healthcare details...</p>
              ) : healthcareError ? (
                <p className="text-red-600 text-center">{healthcareError}</p>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-center mb-4">
                    {selectedHealthcare.profile_image ? (
                      <img
                        src={selectedHealthcare.profile_image}
                        alt={`${selectedHealthcare.name}'s profile`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-md"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/96?text=Image+Not+Found")}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium shadow-md">
                        No Image
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 text-center">{selectedHealthcare.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Basic Info</h4>
                      <div className="text-gray-700 text-sm space-y-3">
                        <p><strong>Type:</strong> {selectedHealthcare.healthcare_type.charAt(0).toUpperCase() + selectedHealthcare.healthcare_type.slice(1)}</p>
                        <p><strong>Email:</strong> {selectedHealthcare.email || "Not provided"}</p>
                        <p><strong>Phone:</strong> {selectedHealthcare.phone_number || "Not provided"}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Additional Details</h4>
                      <div className="text-gray-700 text-sm space-y-3">
                        <p><strong>Location:</strong> {selectedHealthcare.location_link ? <a href={selectedHealthcare.location_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">View Location</a> : "Not provided"}</p>
                        <p><strong>Hours:</strong> {selectedHealthcare.working_hours || "Not specified"}</p>
                        <p><strong>Delivery:</strong> {selectedHealthcare.can_deliver ? "Yes" : "No"}</p>
                        {selectedHealthcare.speciality && <p><strong>Specialty:</strong> {selectedHealthcare.speciality}</p>}
                        {selectedHealthcare.ward && <p><strong>Ward:</strong> {selectedHealthcare.ward}</p>}
                        {selectedHealthcare.pharmacy_name && <p><strong>Pharmacy:</strong> {selectedHealthcare.pharmacy_name}</p>}
                        {selectedHealthcare.lab_name && <p><strong>Laboratory:</strong> {selectedHealthcare.lab_name}</p>}
                        {selectedHealthcare.equipment && <p><strong>Equipment:</strong> {selectedHealthcare.equipment}</p>}
                        {selectedHealthcare.clinic_name && <p><strong>Clinic:</strong> {selectedHealthcare.clinic_name}</p>}
                        {(selectedHealthcare.healthcare_type === "doctor" || selectedHealthcare.healthcare_type === "nurse") && (
                          <p>
                            <strong>{selectedHealthcare.healthcare_type === "doctor" ? "Consultation Fee" : "Service Fee"}:</strong>{" "}
                            {selectedHealthcare.price !== null && selectedHealthcare.price !== undefined
                              ? `$${selectedHealthcare.price.toFixed(2)}`
                              : "Not available"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Ratings & Reviews</h4>
                    <p>
                      <strong>Average Rating:</strong>{" "}
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(selectedHealthcare.averageRating)}`}>
                        {selectedHealthcare.averageRating || "No ratings yet"}
                      </span>
                    </p>
                    {selectedHealthcare.comments && selectedHealthcare.comments.length > 0 ? (
                      <div className="mt-4 space-y-3 max-h-40 overflow-y-auto">
                        {selectedHealthcare.comments.map((comment, index) => (
                          <div key={index} className="border p-3 rounded-lg bg-gray-50 shadow-sm">
                            <p className="font-medium text-gray-800">{comment.patientName} - <span className="text-yellow-500">{comment.rating}/5</span></p>
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
                  onClick={() => setSelectedHealthcare(null)}
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
            reportedId={reportUserId}
            onClose={() => {
              setShowReportModal(false);
              setReportUserId(null);
            }}
            onSuccess={handleReportSuccess}
          />
        )}
      </div>
    </div>
  );
}