/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../api";
import { MapPin } from "lucide-react";

// Component for managing a healthcare provider's profile, schedule, feedback, and announcements
export default function HealthcareProfile({ user }) {
  // State for managing healthcare provider's profile data
  const [healthcare, setHealthcare] = useState(null); // Stores fetched provider profile
  // State to toggle between view and edit modes for the profile
  const [isEditing, setIsEditing] = useState(false); // Controls edit mode
  // State for form input data during profile editing
  const [formData, setFormData] = useState({
    phone_number: "",
    location_link: "",
    working_hours: "",
    can_deliver: false,
    clinic_name: "",
    price: "",
  }); // Stores profile form inputs
  // State for storing the selected profile image file
  const [profileImage, setProfileImage] = useState(null); // Stores selected image file
  // State for previewing the profile image before upload
  const [previewImage, setPreviewImage] = useState(null); // Stores image preview URL
  // State to indicate if profile data is being fetched
  const [loading, setLoading] = useState(true); // Indicates profile fetch status
  // State for storing provider's announcements
  const [announcements, setAnnouncements] = useState([]); // Stores fetched announcements
  // State to indicate if announcements are being fetched
  const [announcementsLoading, setAnnouncementsLoading] = useState(false); // Indicates announcement fetch status
  // State for storing announcement fetch errors
  const [announcementsError, setAnnouncementsError] = useState(""); // Stores announcement fetch errors
  // State for storing unavailable slots and appointments
  const [slots, setSlots] = useState([]); // Stores combined unavailable slots and appointments
  // State to indicate if slots are being fetched
  const [slotsLoading, setSlotsLoading] = useState(false); // Indicates slot fetch status
  // State for storing slot fetch errors
  const [slotsError, setSlotsError] = useState(""); // Stores slot fetch errors
  // State to control the visibility of the slot addition modal
  const [showSlotModal, setShowSlotModal] = useState(false); // Toggles slot addition modal
  // State for storing new unavailable slots before submission
  const [newSlots, setNewSlots] = useState([]); // Stores selected unavailable slots
  // State for the selected date in the slot addition modal
  const [selectedDate, setSelectedDate] = useState(null); // Stores selected date for slots
  // State for storing errors during slot addition
  const [errorMessage, setErrorMessage] = useState(""); // Stores slot addition errors
  // State for managing working hours (parsed from working_hours string)
  const [workingHours, setWorkingHours] = useState({ startHour: 9, endHour: 17 }); // Stores parsed working hours
  // State to toggle marking an entire day as unavailable
  const [markEntireDay, setMarkEntireDay] = useState(false); // Toggles full-day unavailability
  // State for the reason for unavailability (optional)
  const [reason, setReason] = useState(""); // Stores unavailability reason
  // State for slot filter (all, unavailable, pending, active)
  const [slotFilter, setSlotFilter] = useState("all"); // Controls slot display filter
  // State for date search input
  const [searchDate, setSearchDate] = useState(""); // Stores date search input
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Fetch profile, announcements, and slots when the component mounts or user changes
  useEffect(() => {
    // Fetch the healthcare provider's profile data
    const fetchHealthcareProfile = async () => {
      const token = localStorage.getItem("token"); // Retrieve auth token
      if (!token || !user || !user._id) {
        navigate("/login"); // Redirect to login if no token or user data
        return;
      }
      try {
        setLoading(true); // Start loading
        const response = await fetch(`${API_BASE_URL}/api/healthcare/profile/${user._id}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include auth token
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          setHealthcare(data); // Update profile data
          // Initialize form data with fetched profile details
          setFormData({
            phone_number: data.phone_number || "",
            location_link: data.location_link || "",
            working_hours: data.working_hours || "",
            can_deliver: data.can_deliver || false,
            clinic_name: data.clinic_name || "",
            price: data.price || "",
          });
          setPreviewImage(data.profile_image || null); // Set profile image preview
          // Parse working hours to extract start and end hours
          if (data.working_hours) {
            const match = data.working_hours.match(/(\d+)\s*(?:AM|PM)\s*-\s*(\d+)\s*(?:AM|PM)/i);
            if (match) {
              let start = parseInt(match[1]);
              let end = parseInt(match[2]);
              if (data.working_hours.toLowerCase().includes("pm") && end < 12) end += 12;
              if (data.working_hours.toLowerCase().includes("am") && start === 12) start = 0;
              setWorkingHours({ startHour: start, endHour: end }); // Update working hours
            }
          }
        } else if (response.status === 401) {
          localStorage.removeItem("token"); // Clear token on unauthorized access
          navigate("/login");
        } else {
          setHealthcare(null); // Clear profile data on error
        }
      } catch (error) {
        setHealthcare(null); // Handle network or other errors
      } finally {
        setLoading(false); // End loading
      }
    };

    // Fetch announcements created by the healthcare provider
    const fetchAnnouncements = async (retries = 2) => {
      const token = localStorage.getItem("token"); // Retrieve auth token
      if (!token) {
        setAnnouncementsError("Please log in to view announcements.");
        return;
      }
      setAnnouncementsLoading(true); // Start loading
      try {
        const response = await fetch(`${API_BASE_URL}/api/healthcare/announcements`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include auth token
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          // Filter announcements to only include those created by the current user
          const userAnnouncements = data.filter((announcement) => {
            if (!announcement.healthcare_id?._id) return false;
            return announcement.healthcare_id._id.toString() === user._id.toString();
          });
          setAnnouncements(userAnnouncements); // Update announcements
          setAnnouncementsError(""); // Clear errors
        } else if (response.status === 401) {
          localStorage.removeItem("token"); // Clear token on unauthorized access
          navigate("/login");
        } else if (retries > 0) {
          // Retry fetching announcements on failure (up to 2 retries)
          setTimeout(() => fetchAnnouncements(retries - 1), 1000);
        } else {
          throw new Error(data.message || "Failed to fetch announcements");
        }
      } catch (error) {
        setAnnouncementsError(`Failed to load announcements: ${error.message}`); // Set error
      } finally {
        setAnnouncementsLoading(false); // End loading
      }
    };

    // Fetch unavailable slots and appointments
    const fetchSlots = async () => {
      const token = localStorage.getItem("token"); // Retrieve auth token
      if (!token) {
        setSlotsError("Please log in to view slots.");
        return;
      }
      setSlotsLoading(true); // Start loading
      try {
        // Fetch unavailable slots
        const unavailableResponse = await fetch(`${API_BASE_URL}/api/healthcare/unavailable-slots`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include auth token
            "Content-Type": "application/json",
          },
        });
        const unavailableData = await unavailableResponse.json();
        if (!unavailableResponse.ok) {
          throw new Error(unavailableData.message || "Failed to fetch unavailable slots");
        }

        // Fetch appointments
        const appointmentsResponse = await fetch(`${API_BASE_URL}/api/healthcare/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include auth token
            "Content-Type": "application/json",
          },
        });
        const appointmentsData = await appointmentsResponse.json();
        if (!appointmentsResponse.ok) {
          throw new Error(appointmentsData.message || "Failed to fetch appointments");
        }

        // Format appointments for consistent slot structure
        const formattedAppointments = appointmentsData.map((appt) => ({
          type: "appointment",
          status: appt.status,
          date: new Date(appt.date),
          startTime: appt.time,
          endTime: new Date(new Date(appt.date).getTime() + (appt.duration || 30) * 60000)
            .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
          duration: appt.duration || 30,
          reason: appt.message,
          _id: appt._id,
        }));

        // Format unavailable slots
        const formattedUnavailableSlots = unavailableData.map((slot) => ({
          ...slot,
          type: "unavailable",
        }));

        // Combine and store all slots
        const combinedSlots = [...formattedUnavailableSlots, ...formattedAppointments];
        setSlots(combinedSlots); // Update slots
        setSlotsError(""); // Clear errors
      } catch (error) {
        setSlotsError(`Failed to load slots: ${error.message}`); // Set error
      } finally {
        setSlotsLoading(false); // End loading
      }
    };

    // Execute all fetch operations
    fetchHealthcareProfile();
    fetchAnnouncements();
    fetchSlots();
  }, [navigate, user]); // Dependencies: navigate, user

  // Handle changes to form inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value, // Handle checkbox vs text inputs
    });
  };

  // Handle profile image selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file); // Store selected file
      const previewUrl = URL.createObjectURL(file); // Create preview URL
      setPreviewImage(previewUrl); // Update preview
    }
  };

  // Handle date selection for unavailable slots
  const handleDateChange = (e) => {
    const date = new Date(e.target.value);
    setSelectedDate(date); // Update selected date
    setNewSlots([]); // Reset selected slots
    setMarkEntireDay(false); // Reset entire day toggle
  };

  // Handle reason input for unavailable slots
  const handleReasonChange = (e) => {
    setReason(e.target.value); // Update reason
    setErrorMessage(""); // Clear error messages
  };

  // Handle date search input
  const handleSearchDateChange = (e) => {
    setSearchDate(e.target.value); // Update search date
  };

  // Generate time slots based on working hours for a given date
  const generateTimeSlots = (date) => {
    if (!date || isNaN(new Date(date).getTime())) return []; // Return empty for invalid date
    const slots = [];
    for (let hour = workingHours.startHour; hour < workingHours.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date(date);
        time.setHours(hour, minute, 0, 0); // Create 30-minute slots
        slots.push({ time });
      }
    }
    return slots;
  };

  // Determine if a time slot is available or occupied
  const getSlotState = (slotTime) => {
    const slotStart = new Date(slotTime);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30); // Calculate slot end

    const matchingSlot = slots.find((slot) => {
      const slotDate = new Date(slot.date).toISOString().split("T")[0];
      const currentSlotDate = slotStart.toISOString().split("T")[0];
      if (slotDate !== currentSlotDate) return false;

      const slotStartTime = new Date(`${slotDate}T${slot.startTime}:00`);
      const slotEndTime = new Date(`${slotDate}T${slot.endTime}:00`);

      return (
        (slotStart.getTime() === slotStartTime.getTime() &&
         slotEnd.getTime() === slotEndTime.getTime()) ||
        (slotStart < slotEndTime && slotEnd > slotStartTime)
      ); // Check for overlap
    });

    if (!matchingSlot) return { isAvailable: true, state: "available" };

    if (matchingSlot.type === "unavailable") {
      return { isAvailable: false, state: "unavailable" }; // Unavailable slot
    } else if (matchingSlot.type === "appointment") {
      return {
        isAvailable: false,
        state: matchingSlot.status === "pending" ? "pending" : "active", // Appointment status
      };
    }

    return { isAvailable: true, state: "available" };
  };

  // Toggle a time slot for unavailability
  const handleSlotToggle = (slotTime) => {
    const timeStr = slotTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const endTime = new Date(slotTime);
    endTime.setMinutes(endTime.getMinutes() + 30);
    const endTimeStr = endTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const slot = {
      date: slotTime.toISOString().split("T")[0],
      startTime: timeStr,
      endTime: endTimeStr,
      reason: reason,
    };

    setNewSlots((prevSlots) => {
      const slotExists = prevSlots.some(
        (s) => s.date === slot.date && s.startTime === slot.startTime
      );
      if (slotExists) {
        return prevSlots.filter(
          (s) => !(s.date === slot.date && s.startTime === slot.startTime)
        ); // Remove slot if already selected
      } else {
        return [...prevSlots, slot]; // Add new slot
      }
    });
  };

  // Mark an entire day as unavailable
  const handleMarkEntireDay = (e) => {
    const checked = e.target.checked;
    setMarkEntireDay(checked);
    if (checked && selectedDate) {
      const allSlots = generateTimeSlots(selectedDate)
        .filter(({ time }) => getSlotState(time).isAvailable)
        .map(({ time }) => {
          const timeStr = time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          const endTime = new Date(time);
          endTime.setMinutes(endTime.getMinutes() + 30);
          const endTimeStr = endTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          return {
            date: time.toISOString().split("T")[0],
            startTime: timeStr,
            endTime: endTimeStr,
            reason: reason,
          };
        });
      setNewSlots(allSlots); // Set all available slots for the day
    } else {
      setNewSlots([]); // Clear slots
    }
  };

  // Submit profile updates to the server
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      navigate("/login");
      return;
    }

    // Prepare form data for submission
    const formDataToSend = new FormData();
    formDataToSend.append("phone_number", formData.phone_number);
    formDataToSend.append("location_link", formData.location_link);
    formDataToSend.append("working_hours", formData.working_hours);
    formDataToSend.append("can_deliver", formData.can_deliver);
    if (["doctor", "nurse", "laboratory"].includes(healthcare?.healthcare_type)) {
      formDataToSend.append("clinic_name", formData.clinic_name);
    }
    if (["doctor", "nurse"].includes(healthcare?.healthcare_type)) {
      formDataToSend.append("price", formData.price);
    }
    if (profileImage) {
      formDataToSend.append("profile_image", profileImage); // Include image if selected
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/profile`, {
        method: "PUT", // Update profile
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
        },
        body: formDataToSend,
      });
      const data = await response.json();
      if (response.ok) {
        setHealthcare(data.healthcare); // Update profile data
        // Reset form data with updated values
        setFormData({
          phone_number: data.healthcare.phone_number || "",
          location_link: data.healthcare.location_link || "",
          working_hours: data.healthcare.working_hours || "",
          can_deliver: data.healthcare.can_deliver || false,
          clinic_name: data.healthcare.clinic_name || "",
          price: data.healthcare.price || "",
        });
        setPreviewImage(data.healthcare.profile_image || null); // Update preview
        setProfileImage(null); // Clear selected image
        setIsEditing(false); // Exit edit mode
      } else if (response.status === 401) {
        localStorage.removeItem("token"); // Clear token on unauthorized access
        navigate("/login");
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      alert("Error updating profile: " + error.message); // Show error
    }
  };

  // Add unavailable slots to the server
  const handleAddSlot = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      navigate("/login");
      return;
    }

    if (newSlots.length === 0) {
      setErrorMessage("Please select at least one time slot."); // Require at least one slot
      return;
    }

    // Prevent setting slots in the past
    const now = new Date();
    for (const slot of newSlots) {
      const selectedDateTime = new Date(`${slot.date}T${slot.startTime}:00Z`);
      if (selectedDateTime < now) {
        setErrorMessage("Cannot set unavailability in the past."); // Block past slots
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/unavailable-slots`, {
        method: "POST", // Create unavailable slots
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSlots),
      });
      const data = await response.json();
      if (response.ok) {
        const newUnavailableSlots = Array.isArray(data.slot) ? data.slot : [data.slot];
        setSlots((prevSlots) => [
          ...prevSlots,
          ...newUnavailableSlots.map((slot) => ({ ...slot, type: "unavailable" })), // Add new slots
        ]);
        // Reset modal state
        setNewSlots([]);
        setSelectedDate(null);
        setMarkEntireDay(false);
        setReason("");
        setShowSlotModal(false);
      } else {
        throw new Error(data.message || "Failed to add unavailable slots");
      }
    } catch (error) {
      setErrorMessage(`Error adding unavailable slots: ${error.message}`); // Set error
    }
  };

  // Delete a slot (unavailable or appointment)
  const handleDeleteSlot = async (slotId, slotType) => {
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      navigate("/login");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete this ${slotType} slot?`)) {
      return;
    }

    try {
      const endpoint =
        slotType === "unavailable"
          ? `${API_BASE_URL}/api/healthcare/unavailable-slots/${slotId}`
          : `${API_BASE_URL}/api/healthcare/appointments/${slotId}`;
      const response = await fetch(endpoint, {
        method: "DELETE", // Delete slot
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSlots(slots.filter((slot) => slot._id !== slotId)); // Remove deleted slot
      } else {
        throw new Error(data.message || `Failed to delete ${slotType} slot`);
      }
    } catch (error) {
      alert(`Error deleting ${slotType} slot: ${error.message}`); // Show error
    }
  };

  // Request account deletion
  const handleDeleteRequest = async () => {
    const token = localStorage.getItem("token"); // Retrieve auth token
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
        method: "POST", // Request account deletion
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ frontendUrl }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("A confirmation email has been sent. Please check your inbox."); // Notify user
      } else {
        throw new Error(data.message || "Failed to request account deletion");
      }
    } catch (error) {
      alert(`Error requesting account deletion: ${error.message}`); // Show error
    }
  };

  // Delete an announcement
  const handleDeleteAnnouncement = async (announcementId) => {
    const token = localStorage.getItem("token"); // Retrieve auth token
    if (!token) {
      navigate("/login");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/announcements/${announcementId}`, {
        method: "DELETE", // Delete announcement
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAnnouncements(announcements.filter((ann) => ann._id !== announcementId)); // Remove deleted announcement
      } else {
        throw new Error(data.message || "Failed to delete announcement");
      }
    } catch (error) {
      alert(`Error deleting announcement: ${error.message}`); // Show error
    }
  };

  // Determine the account status for display
  const getAccountStatus = () => {
    if (healthcare?.isBanned) return { text: "banned", color: "bg-red-200 text-red-800" }; // Banned account
    if (!healthcare?.isApproved) return { text: "pending approval", color: "bg-yellow-200 text-yellow-800" }; // Pending approval
    return { text: "activated", color: "bg-green-200 text-green-800" }; // Active account
  };

  // Filter slots based on type and search date
  const getFilteredSlots = () => {
    let filteredSlots = slots;

    // Filter by slot type
    if (slotFilter === "unavailable") {
      filteredSlots = slots.filter((slot) => slot.type === "unavailable");
    } else if (slotFilter === "pending") {
      filteredSlots = slots.filter((slot) => slot.type === "appointment" && slot.status === "pending");
    } else if (slotFilter === "active") {
      filteredSlots = slots.filter((slot) => slot.type === "appointment" && slot.status === "active");
    }

    // Filter by search date
    if (searchDate) {
      const searchDateStr = new Date(searchDate).toISOString().split("T")[0];
      filteredSlots = filteredSlots.filter(
        (slot) => new Date(slot.date).toISOString().split("T")[0] === searchDateStr
      );
    }

    return filteredSlots;
  };

  const accountStatus = getAccountStatus();
  const isRestricted = !healthcare?.isApproved || healthcare?.isBanned; // Check if account is restricted

  if (!user) {
    return <p className="text-center text-gray-500 mt-10">Loading user data...</p>; // Handle missing user
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
                // Edit mode form
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                              e.target.src = "https://via.placeholder.com/128?text=No+Image"; // Fallback image
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
                          className="w-full cursor-pointer p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                          key={profileImage ? profileImage.name : "file-input"}
                        />
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Upload a profile picture (optional)</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-base sm:text-lg">Phone Number</label>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
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
                        className="mr-2 h-5 w-5 text-blue-600 border-gray-300 rounded cursor-pointer focus:ring-blue-500"
                      />
                      Can Deliver Services
                    </label>
                  </div>
                  {["doctor", "nurse"].includes(healthcare?.healthcare_type) && (
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
                  {["doctor", "nurse"].includes(healthcare?.healthcare_type) && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-2 text-base sm:text-lg">Starting Price ($)</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="10"
                        step="10"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                        placeholder="Enter starting price"
                      />
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false); // Exit edit mode
                        setProfileImage(null); // Clear selected image
                        setPreviewImage(healthcare?.profile_image || null); // Reset preview
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
                // View mode display
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                      {healthcare?.profile_image ? (
                        <img
                          src={healthcare.profile_image}
                          alt={`${user.name}'s profile`}
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-200 shadow-md"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/128?text=Image+Not+Found"; // Fallback image
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
                              <MapPin className="inline-block cursor-pointer mr-1" />
                            </a>
                          ) : (
                            "Not set"
                          )}
                        </p>
                        <p className="text-gray-700">
                          <strong>Working Hours:</strong> <br /> {healthcare?.working_hours || "Not set"}
                        </p>
                      </div>
                      {healthcare?.healthcare_type === "doctor" && (
                        <>
                          <p className="text-gray-700">
                            <strong>Speciality:</strong> {healthcare?.speciality || "Not set"}
                          </p>
                          <p className="text-gray-700">
                            <strong>Starting Price:</strong>{" "}
                            {healthcare?.price ? `$${healthcare.price.toFixed(2)}` : "Not set"}
                          </p>
                        </>
                      )}
                      {healthcare?.healthcare_type === "nurse" && (
                        <>
                          <p className="text-gray-700">
                            <strong>Ward:</strong> {healthcare?.ward || "Not set"}
                          </p>
                          <p className="text-gray-700">
                            <strong>Starting Price:</strong>{" "}
                            {healthcare?.price ? `$${healthcare.price.toFixed(2)}` : "Not set"}
                          </p>
                        </>
                      )}
                      {["doctor", "nurse"].includes(healthcare?.healthcare_type) && (
                        <p className="text-gray-700">
                          <strong>Clinic Name:</strong> {healthcare?.clinic_name || "Not set"}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <p className="text-gray-700">
                          <strong>Average Rating:</strong> {healthcare?.averageRating || "Not rated yet"}
                        </p>
                        <p className="text-gray-700 ml-45">
                          <strong>Account Status:</strong>{" "}
                          <span className={`px-2 py-1 rounded-lg ${accountStatus.color}`}>
                            {accountStatus.text}
                          </span>
                        </p>
                      </div>
                    </div>
                    {!isRestricted && (
                      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-4">
                        <button
                          onClick={handleDeleteRequest}
                          className="w-full sm:w-auto px-6 py-3 cursor-pointer bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 uppercase text-sm sm:text-base font-medium"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full sm:w-auto px-6 py-3 cursor-pointer bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 uppercase text-sm sm:text-base font-medium"
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

        {/* Schedule Section */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-800">Your Schedule</h3>
            {!isRestricted && (
              <button
                onClick={() => setShowSlotModal(true)}
                className="px-4 py-2 bg-blue-500 cursor-pointer text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base"
              >
                Add Unavailable Slot
              </button>
            )}
          </div>
          {isRestricted ? (
            <p className="text-red-600 text-center text-sm sm:text-base">
              You cannot manage your schedule until your account is approved.
            </p>
          ) : slotsLoading ? (
            <p className="text-gray-600 text-center animate-pulse text-sm sm:text-base">Loading schedule...</p>
          ) : slotsError ? (
            <p className="text-red-600 text-center text-sm sm:text-base">{slotsError}</p>
          ) : slots.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                <strong>Notice:</strong> You have no scheduled slots or appointments. Add an unavailable slot to block off a time.
              </p>
            </div>
          ) : (
            <>
              {/* Filters and Search */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSlotFilter("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      slotFilter === "all"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSlotFilter("unavailable")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      slotFilter === "unavailable"
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Unavailable
                  </button>
                  <button
                    onClick={() => setSlotFilter("pending")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      slotFilter === "pending"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setSlotFilter("active")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      slotFilter === "active"
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Active
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search by Date</label>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={handleSearchDateChange}
                    className="w-full sm:w-64 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 shadow-sm"
                  />
                </div>
              </div>
              {/* Slots Display */}
              <div className="max-h-96 overflow-y-auto pr-2">
                {getFilteredSlots().length === 0 ? (
                  <p className="text-gray-600 text-center text-sm sm:text-base">
                    No slots match the selected filter or date.
                  </p>
                ) : (
                  <>
                    {/* Unavailable Slots Section */}
                    {getFilteredSlots().some((slot) => slot.type === "unavailable") && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Unavailable Slots</h4>
                        <div className="space-y-4">
                          {getFilteredSlots()
                            .filter((slot) => slot.type === "unavailable")
                            .map((slot) => (
                              <div
                                key={slot._id}
                                className="p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center bg-red-50"
                              >
                                <div>
                                  <p className="text-gray-700 text-sm sm:text-base">
                                    <strong>Date:</strong> {new Date(slot.date).toLocaleDateString()}
                                  </p>
                                  <p className="text-gray-700 text-sm sm:text-base">
                                    <strong>Time:</strong> {slot.startTime} - {slot.endTime}
                                  </p>
                                  <p className="text-gray-700 text-sm sm:text-base">
                                    <strong>Status:</strong> Unavailable
                                  </p>
                                  {slot.reason && (
                                    <p className="text-gray-600 text-sm sm:text-base">
                                      <strong>Reason:</strong> {slot.reason}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteSlot(slot._id, slot.type)}
                                  className="mt-2 cursor-pointer sm:mt-0 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm sm:text-base"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {/* Pending Appointments Section */}
                    {getFilteredSlots().some((slot) => slot.type === "appointment" && slot.status === "pending") && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Pending Appointments</h4>
                        <div className="space-y-4">
                          {getFilteredSlots()
                            .filter((slot) => slot.type === "appointment" && slot.status === "pending")
                            .map((slot) => (
                              <div
                                key={slot._id}
                                className="p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center bg-yellow-50"
                              >
                                <div>
                                  <p className="text-gray-700 text-sm sm:text-base">
                                    <strong>Date:</strong> {new Date(slot.date).toLocaleDateString()}
                                  </p>
                                  <p className="text-gray-700 text-sm sm:text-base">
                                    <strong>Time:</strong> {slot.startTime} - {slot.endTime}
                                  </p>
                                  <p className="text-gray-700 text-sm sm:text-base">
                                    <strong>Status:</strong> Pending
                                  </p>
                                  {slot.reason && (
                                    <p className="text-gray-600 text-sm sm:text-base">
                                      <strong>Message:</strong> {slot.reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {/* Active Appointments Section */}
                    {getFilteredSlots().some((slot) => slot.type === "appointment" && slot.status === "active") && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Active Appointments</h4>
                        <div className="space-y-4">
                          {getFilteredSlots()
                            .filter((slot) => slot.type === "appointment" && slot.status === "active")
                            .map((slot) => (
                              <div
                                key={slot._id}
                                className="p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center bg-green-50"
                              >
                                <div>
                                  <p className="text-gray-700 text-sm sm:text-base">
                                    <strong>Date:</strong> {new Date(slot.date).toLocaleDateString()}
                                  </p>
                                  <p className="text-gray-700 text-sm sm:text-base">
                                    <strong>Time:</strong> {slot.startTime} - {slot.endTime}
                                  </p>
                                  <p className="text-gray-700 text-sm sm:text-base">
                                    <strong>Status:</strong> Active
                                  </p>
                                  {slot.reason && (
                                    <p className="text-gray-600 text-sm sm:text-base">
                                      <strong>Message:</strong> {slot.reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Unavailable Slot Modal */}
        {showSlotModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#00000247] backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Add Unavailable Slot</h3>
                <button
                  onClick={() => {
                    setShowSlotModal(false); // Close modal
                    setSelectedDate(null); // Clear date
                    setNewSlots([]); // Clear slots
                    setMarkEntireDay(false); // Reset toggle
                    setReason(""); // Clear reason
                    setErrorMessage(""); // Clear errors
                  }}
                  className="cursor-pointer text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddSlot} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    onChange={handleDateChange}
                    min={new Date().toISOString().split("T")[0]} // Minimum date is today
                    className="cursor-pointer w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 shadow-sm"
                    required
                  />
                </div>
                {selectedDate && (
                  <>
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <input
                          type="checkbox"
                          checked={markEntireDay}
                          onChange={handleMarkEntireDay}
                          className="cursor-pointer mr-2 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        Mark entire day as unavailable
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Time Slots
                      </label>
                      <div className="max-h-48 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                        {generateTimeSlots(selectedDate).length === 0 ? (
                          <p className="text-gray-500 text-sm text-center">
                            No available slots within working hours.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {generateTimeSlots(selectedDate).map(({ time }) => {
                              const { isAvailable, state } = getSlotState(time);
                              const timeStr = time.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              });
                              const isSelected = newSlots.some(
                                (slot) => slot.date === time.toISOString().split("T")[0] && slot.startTime === timeStr
                              );
                              let buttonStyle = "";
                              let textColor = "text-gray-800";
                              let badge = null;

                              if (state === "unavailable") {
                                buttonStyle = "cursor-not-allowed bg-red-100 border-red-200 text-red-600 opacity-80";
                                badge = (
                                  <span className="absolute top-0 right-0 text-xs bg-red-500 text-white rounded-full px-1">
                                    Unavailable
                                  </span>
                                );
                              } else if (state === "pending") {
                                buttonStyle = "cursor-not-allowed bg-yellow-100 border-yellow-200 text-yellow-600 opacity-80";
                                badge = (
                                  <span className="absolute top-0 right-0 text-xs bg-yellow-500 text-white rounded-full px-1">
                                    Pending
                                  </span>
                                );
                              } else if (state === "active") {
                                buttonStyle = "cursor-not-allowed bg-green-100 border-green-200 text-green-600 opacity-80";
                                badge = (
                                  <span className="absolute top-0 right-0 text-xs bg-green-500 text-white rounded-full px-1">
                                    Active
                                  </span>
                                );
                              } else if (isSelected) {
                                buttonStyle = "cursor-pointer bg-blue-500 text-white shadow-md";
                              } else {
                                buttonStyle = "cursor-pointer bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-500";
                              }

                              return (
                                <button
                                  key={time.toISOString()}
                                  type="button"
                                  onClick={() => handleSlotToggle(time)}
                                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm relative ${buttonStyle} ${textColor}`}
                                  disabled={!isAvailable}
                                >
                                  {time.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {badge}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                  <textarea
                    value={reason}
                    onChange={handleReasonChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 resize-none shadow-sm"
                    rows="3"
                    placeholder="Reason for unavailability..."
                  />
                </div>
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
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSlotModal(false); // Close modal
                      setSelectedDate(null); // Clear date
                      setNewSlots([]); // Clear slots
                      setMarkEntireDay(false); // Reset toggle
                      setReason(""); // Clear reason
                      setErrorMessage(""); // Clear errors
                    }}
                    className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200 font-medium shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center shadow-sm ${
                      newSlots.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                    disabled={newSlots.length === 0}
                  >
                    Add Slots
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Patient Feedback Section */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 border-b border-blue-500 pb-1 mb-4 sm:mb-6">Patient Feedback</h3>
          {loading ? (
            <p className="text-gray-600 text-center text-sm sm:text-base">Loading feedback...</p>
          ) : !healthcare?.comments || healthcare.comments.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                <strong>Notice:</strong> You have no patient reviews yet. Reviews will appear here once patients rate your services.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-2">
              <div className="space-y-4">
                {healthcare.comments.map((comment, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                      <span className="text-gray-700 font-medium text-sm sm:text-base">{comment.patientName}</span>
                      <span className="ml-0 sm:ml-2 text-yellow-500 text-sm sm:text-base">
                        {"★".repeat(comment.rating) + "☆".repeat(5 - comment.rating)}
                      </span>
                    </div>
                    <p className="text-gray-600 italic text-sm sm:text-base">"{comment.comment}"</p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-2">
                      <strong>Date:</strong> {new Date(comment.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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
                    {!isRestricted && (
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement._id)}
                        className="absolute cursor-pointer top-3 right-3 flex items-center space-x-1 px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                      {healthcare?.profile_image ? (
                        <img
                          src={healthcare.profile_image}
                          alt={`${user.name}'s profile`}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-indigo-200 shadow-sm"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/64?text=Image+Not+Found"; // Fallback image
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