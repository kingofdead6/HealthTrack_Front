/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../api";

// Component for managing pending healthcare provider registrations in an admin dashboard
export default function AdminHealthCare() {
  // State for pending healthcare providers, modals, and UI management
  const [pendingHealthCare, setPendingHealthCare] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHealthcare, setSelectedHealthcare] = useState(null);
  const navigate = useNavigate();

  // Fetch pending healthcare registrations with retry logic
  const fetchPendingHealthCare = async (retries = 2) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/healthcare/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else if (retries > 0) {
          setTimeout(() => fetchPendingHealthCare(retries - 1), 1000);
          return;
        }
        throw new Error(data.message || "Failed to fetch pending requests");
      }
      setPendingHealthCare(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending registrations on component mount
  useEffect(() => {
    fetchPendingHealthCare();
  }, [navigate]);

  // Approve a healthcare provider
  const handleApprove = async (userId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/healthcare/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to approve");
      setPendingHealthCare(pendingHealthCare.filter((hc) => hc.user._id !== userId));
      setSelectedHealthcare(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Reject a healthcare provider (deletes their account)
  const handleReject = async (userId) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Are you sure you want to reject this healthcare provider? This will delete their account.")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/healthcare/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to reject");
      setPendingHealthCare(pendingHealthCare.filter((hc) => hc.user._id !== userId));
      setSelectedHealthcare(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Format key names for display
  const formatLabel = (key) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Display loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E1EEFF]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#4285F4]"></div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E1EEFF]">
        <div className="text-red-600 text-lg font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E1EEFF] p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-[#4285F4] mb-8">Healthcare Staffs</h2>

        {/* Pending healthcare providers grid or empty state */}
        {pendingHealthCare.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg font-medium">No pending healthcare registrations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingHealthCare.map((hc) => (
              <div
                key={hc.user._id}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedHealthcare(hc)}
              >
                <h3 className="text-lg font-semibold text-[#4285F4] mb-4">Healthcare Staff Details</h3>
                <div className="flex items-center mb-4">
                  <img
                    src={hc.user.profile_image || "https://res.cloudinary.com/dtwa3lxdk/image/upload/v1744767024/account_aw7iyt.png"}
                    alt={`${hc.user.name}'s profile`}
                    className="w-14 h-14 rounded-full mr-4 object-cover border-2 border-[#4285F4]"
                    onError={(e) => (e.target.src = "https://res.cloudinary.com/dtwa3lxdk/image/upload/v1744767024/account_aw7iyt.png")}
                  />
                  <div>
                    <p className="text-gray-800 font-medium">{hc.user.name}</p>
                    <p className="text-gray-600 text-sm">
                      {hc.healthcare.healthcare_type.charAt(0).toUpperCase() +
                        hc.healthcare.healthcare_type.slice(1).toLowerCase()}{" "}
                      <a href={hc.healthcare.location_link} target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">
                        [Location]
                      </a>
                    </p>
                    <p className="text-gray-600 text-sm">{hc.user.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing healthcare provider details */}
      {selectedHealthcare && (
        <div className="fixed inset-0 bg-[#0000025e] backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto transform transition-all duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-[#4285F4]">Healthcare Staff Details</h2>
              <button
                onClick={() => setSelectedHealthcare(null)}
                className="cursor-pointer text-gray-500 hover:text-red-500 transition-colors duration-200"
                aria-label="Close modal"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-8">
              {/* User Details */}
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h3 className="text-xl font-semibold text-[#4285F4] mb-6">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(selectedHealthcare.user)
                    .filter(([key]) => !["_id", "__v", "profile_image"].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="text-gray-700 flex flex-col">
                        <strong className="text-gray-800 text-sm font-medium">{formatLabel(key)}:</strong>
                        <div className="mt-1">
                          {key === "createdAt" ? (
                            <span className="text-gray-600">{new Date(value).toLocaleString()}</span>
                          ) : value ? (
                            <span className="text-gray-600">{value.toString()}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not provided</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Healthcare Details */}
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h3 className="text-xl font-semibold text-[#4285F4] mb-6">Healthcare Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(selectedHealthcare.healthcare)
                    .filter(([key]) => !["_id", "healthcare_id", "user_id", "__v"].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="text-gray-700 flex flex-col">
                        <strong className="text-gray-800 text-sm font-medium">{formatLabel(key)}:</strong>
                        <div className="mt-1">
                          {key === "certificate" && value ? (
                            <a href={value} download>
                              <img
                                src={value}
                                alt="Certificate"
                                className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200 cursor-pointer"
                                onError={(e) => (e.target.src = "https://via.placeholder.com/128?text=Certificate+Not+Found")}
                              />
                            </a>
                          ) : key === "location_link" && value ? (
                            <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#4285F4] hover:underline">
                              Link
                            </a>
                          ) : value ? (
                            <span className="text-gray-600">{value.toString()}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not provided</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-10">
              <button
                onClick={() => handleApprove(selectedHealthcare.user._id)}
                className="cursor-pointer bg-[#4285F4] text-white px-8 py-3 rounded-full hover:bg-[#3267D6] transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(selectedHealthcare.user._id)}
                className="cursor-pointer bg-red-600 text-white px-8 py-3 rounded-full hover:bg-red-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}