/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../api";
import { MapPin } from "lucide-react";

// Component for displaying and editing healthcare profile
export default function HealthcareProfile({ user }) {
  // State for profile data and UI management
  const [healthcare, setHealthcare] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: "",
    location_link: "",
    working_hours: "",
    can_deliver: false,
    clinic_name: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [workingHours, setWorkingHours] = useState({ startHour: 9, endHour: 17 });

  const navigate = useNavigate();

  // Fetch profile and announcements on mount
  useEffect(() => {
    const fetchHealthcareProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token || !user || !user._id) {
        navigate("/login");
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/healthcare/profile/${user._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          setHealthcare(data);
          setFormData({
            phone_number: data.phone_number || "",
            location_link: data.location_link || "",
            working_hours: data.working_hours || "",
            can_deliver: data.can_deliver || false,
            clinic_name: data.clinic_name || "",
            price: data.price || "",
          });
          setPreviewImage(data.profile_image || null);
          if (data.working_hours) {
            const match = data.working_hours.match(/(\d+)\s*(?:AM|PM)\s*-\s*(\d+)\s*(?:AM|PM)/i);
            if (match) {
              let start = parseInt(match[1]);
              let end = parseInt(match[2]);
              if (data.working_hours.toLowerCase().includes("pm") && end < 12) end += 12;
              if (data.working_hours.toLowerCase().includes("am") && start === 12) start = 0;
              setWorkingHours({ startHour: start, endHour: end });
            }
          }
        } else if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setHealthcare(null);
        }
      } catch (error) {
        setHealthcare(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchAnnouncements = async (retries = 2) => {
      const token = localStorage.getItem("token");
      if (!token) {
        setAnnouncementsError("Please log in to view announcements.");
        return;
      }
      setAnnouncementsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/healthcare/announcements`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          const userAnnouncements = data.filter((announcement) => {
            if (!announcement.healthcare_id?._id) {
              return false;
            }
            return announcement.healthcare_id._id.toString() === user._id.toString();
          });
          setAnnouncements(userAnnouncements);
          setAnnouncementsError("");
        } else if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else if (retries > 0) {
          setTimeout(() => fetchAnnouncements(retries - 1), 1000);
        } else {
          throw new Error(data.message || "Failed to fetch announcements");
        }
      } catch (error) {
        setAnnouncementsError(`Failed to load announcements: ${error.message}`);
      } finally {
        setAnnouncementsLoading(false);
      }
    };
    fetchHealthcareProfile();
    fetchAnnouncements();
  }, [navigate, user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle profile image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
    }
  };

  // Submit updated profile data
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("phone_number", formData.phone_number);
    formDataToSend.append("location_link", formData.location_link);
    formDataToSend.append("working_hours", formData.working_hours);
    formDataToSend.append("can_deliver", formData.can_deliver);

    if (["laboratory"].includes(healthcare?.healthcare_type)) {
      formDataToSend.append("clinic_name", formData.clinic_name);
    }
    if (profileImage) {
      formDataToSend.append("profile_image", profileImage);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      const data = await response.json();
      if (response.ok) {
        setHealthcare(data.healthcare);
        setFormData({
          phone_number: data.healthcare.phone_number || "",
          location_link: data.healthcare.location_link || "",
          working_hours: data.healthcare.working_hours || "",
          can_deliver: data.healthcare.can_deliver || false,
          clinic_name: data.healthcare.clinic_name || "",
        });
        setPreviewImage(data.healthcare.profile_image || null);
        setProfileImage(null);
        setIsEditing(false);
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      alert("Error updating profile: " + error.message);
    }
  };

  // Request account deletion
  const handleDeleteRequest = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    try {
      const frontendUrl = window.location.origin;
      const response = await fetch(`${API_BASE_URL}/api/healthcare/delete-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ frontendUrl }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("A confirmation email has been sent. Please check your inbox.");
      } else {
        throw new Error(data.message || "Failed to request account deletion");
      }
    } catch (error) {
      alert(`Error requesting account deletion: ${error.message}`);
    }
  };

  // Delete an announcement
  const handleDeleteAnnouncement = async (announcementId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/announcements/${announcementId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAnnouncements(announcements.filter((ann) => ann._id !== announcementId));
      } else {
        throw new Error(data.message || "Failed to delete announcement");
      }
    } catch (error) {
      alert(`Error deleting announcement: ${error.message}`);
    }
  };

  // Determine account status
  const getAccountStatus = () => {
    if (healthcare?.isBanned) return { text: "banned", color: "bg-red-200 text-red-800" };
    if (!healthcare?.isApproved) return { text: "pending approval", color: "bg-yellow-200 text-yellow-800" };
    return { text: "activated", color: "bg-green-200 text-green-800" };
  };

  const accountStatus = getAccountStatus();
  const isRestricted = !healthcare?.isApproved || healthcare?.isBanned;

  // Handle missing user data
  if (!user) {
    return <p className="text-center text-gray-500 mt-10">Loading user data...</p>;
  }

  return (
    <div className="min-h-screen bg-[#E1EEFF] p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Profile Details Section */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Your Profile Details</h2>
          {loading ? (
            <p className="text-center text-gray-500 text-base sm:text-lg">Loading healthcare details...</p>
          ) : (
            <>
              {isEditing && !isRestricted ? (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space for sm:space-y-6">
                  {/* Profile Image Upload */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-base sm:text-lg">Profile Image</label>
                    <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                        {previewImage ? (
                          <img src={previewImage} alt="Profile preview" className="w-full h-full object-cover" />
                        ) : healthcare?.profile_image ? (
                          <img
                            src={healthcare.profile_image}
                            alt="Current profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/128?text=No+Image";
                            }}
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">No Image</span>
                        )}
                      </div>
                      <div className="flex-1 w-full">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full p-3 border cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                          key={profileImage ? profileImage.name : "file-input"}
                        />
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Upload a profile picture (optional)</p>
                      </div>
                    </div>
                  </div>
                  {/* Form Fields */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-base sm:text-lg">Phone Number</label>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring\u2026lg focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-base sm:text-lg">Location Link</label>
                    <input
                      type="url"
                      name="location_link"
                      value={formData.location_link}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-base sm:text-lg">Working Hours</label>
                    <input
                      type="text"
                      name="working_hours"
                      value={formData.working_hours}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      required
                      placeholder="e.g., Mon-Fri 9 AM - 5 PM"
                    />
                  </div>
                  <div>
                    <label className="flex items-center text-gray-700 font-medium mb-2 text-base sm:text-lg">
                      <input
                        type="checkbox"
                        name="can_deliver"
                        checked={formData.can_deliver}
                        onChange={handleChange}
                        className="mr-2 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      Can Deliver Services
                    </label>
                  </div>
                  {["laboratory"].includes(healthcare?.healthcare_type) && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-base sm:text-lg">Clinic Name</label>
                      <input
                        type="text"
                        name="clinic_name"
                        value={formData.clinic_name}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      />
                    </div>
                  )}
                  {/* Form Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setProfileImage(null);
                        setPreviewImage(healthcare?.profile_image || null);
                      }}
                      className="w-full cursor-pointer sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-200 text-sm sm:text-base uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full cursor-pointer sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base uppercase"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Profile Info */}
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                      {healthcare?.profile_image ? (
                        <img
                          src={healthcare.profile_image}
                          alt={`${user.name}'s profile`}
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-200 shadow-md"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/128?text=Image+Not+Found";
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm sm:text-base font-medium shadow-md">
                          No Image
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm sm:text-base text-gray-700">{user.email}</p>
                    <p className="text-sm sm:text-base text-gray-700 capitalize">{healthcare?.healthcare_type || "Healthcare"} Profile</p>
                  </div>
                  {/* Healthcare Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-blue-500 pb-1">Healthcare Details</h3>
                    <div className="space-y-2 text-sm sm:text-base">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <p className="text-gray-700">
                          <strong>Phone Number:</strong> {healthcare?.phone_number || "Not set"}
                        </p>
                        <p className="text-gray-700">
                          <strong>Can Deliver:</strong> {healthcare?.can_deliver ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <p className="text-gray-700">
                          <strong>Location Link:</strong>{" "}
                          {healthcare?.location_link ? (
                            <a
                              href={healthcare.location_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              <br />
                              <MapPin className="inline-block mr-1" />
                            </a>
                          ) : (
                            "Not set"
                          )}
                        </p>
                        <p className="text-gray-700">
                          <strong>Working Hours:</strong> <br /> {healthcare?.working_hours || "Not set"}
                        </p>
                      </div>
                      {healthcare?.healthcare_type === "pharmacy" && (
                        <p className="text-gray-700">
                          <strong>Pharmacy Name:</strong> {healthcare?.pharmacy_name || "Not set"}
                        </p>
                      )}
                      {healthcare?.healthcare_type === "laboratory" && (
                        <p className="text-gray-700">
                          <strong>Lab Name:</strong> {healthcare?.lab_name || "Not set"}
                        </p>
                      )}
                      {["laboratory"].includes(healthcare?.healthcare_type) && (
                        <p className="text-gray-700">
                          <strong>Clinic Name:</strong> {healthcare?.clinic_name || "Not set"}
                        </p>
                      )}
                      <p className="text-gray-700 ">
                        <strong>Account Status:</strong>{" "}
                        <span className={`px-2 py-1 rounded-lg ${accountStatus.color}`}>
                          {accountStatus.text}
                        </span>
                      </p>
                    </div>
                    {!isRestricted && (
                      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-4">
                        <button
                          onClick={handleDeleteRequest}
                          className="w-full sm:w-auto px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 uppercase text-sm sm:text-base font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 uppercase text-sm sm:text-base font-medium cursor-pointer"
                        >
                          Edit Profile
                        </button>
                      </div>
                    )}
                    {isRestricted && (
                      <p className="text-center text-red-600 text-sm sm:text-base">
                        {healthcare?.isBanned
                          ? "Your account is banned. Contact support for assistance."
                          : "Your account is pending approval. You cannot perform actions until approved."}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {/* Announcements Section */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Your Announcements</h3>
          {isRestricted ? (
            <p className="text-red-600 text-center text-sm sm:text-base">
              You cannot view or manage announcements until your account is approved.
            </p>
          ) : announcementsLoading ? (
            <p className="text-gray-600 text-center animate-pulse text-sm sm:text-base">Loading announcements...</p>
          ) : announcementsError ? (
            <p className="text-red-600 text-center text-sm sm:text-base">{announcementsError}</p>
          ) : announcements.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                <strong>Notice:</strong> You have no announcements yet. Create one from the Announcements page.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-2">
              <div className="space-y-6">
                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 relative"
                  >
                    {/* Delete Announcement Button */}
                    {!isRestricted && (
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement._id)}
                        className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        disabled={announcementsLoading}
                        title="Delete Announcement"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12M10 11v6m4-6v6"
                          />
                        </svg>
                      </button>
                    )}
                    {/* Announcement Content */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                      {healthcare?.profile_image ? (
                        <img
                          src={healthcare.profile_image}
                          alt={`${user.name}'s profile`}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-indigo-200 shadow-sm"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/64?text=Image+Not+Found";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs sm:text-sm">
                          No Image
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="text-indigo-600 font-semibold block text-base sm:text-lg">
                          {user.name || "Unknown Provider"}
                        </span>
                        {healthcare?.speciality && (
                          <span className="text-xs sm:text-sm text-gray-500 block">{healthcare.speciality}</span>
                        )}
                        {healthcare?.location_link && (
                          <a
                            href={healthcare.location_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline text-xs sm:text-sm block"
                          >
                            View Location
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">
                        {announcement.title.toUpperCase()}
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm">{announcement.content}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        {new Date(announcement.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}