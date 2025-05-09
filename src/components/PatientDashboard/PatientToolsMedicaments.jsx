/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from "react";
import ToolMedicamentPopup from "../LocationDashboard/ToolMedicamentPopup";
import CreateToolMedicamentPopup from "../LocationDashboard/CreateToolMedicamentPopup";
import HealthcareProfilePopup from "../LocationDashboard/HealthcareProfilePopup";
import ReportUser from "../Shared/ReportUser";
import { API_BASE_URL } from "../../../api";

// ToolsMedicaments component to display and manage tools or medicaments
export default function ToolsMedicaments({ user }) {
  // State for tools/medicaments, filters, and UI control
  const [toolsMedicaments, setToolsMedicaments] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [selectedHealthcare, setSelectedHealthcare] = useState(null);
  const [healthcareLoading, setHealthcareLoading] = useState(false);
  const [healthcareError, setHealthcareError] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUserId, setReportUserId] = useState(null);
  const [reportSuccess, setReportSuccess] = useState("");
  
  // Determine if user is a pharmacy and set item label
  const isPharmacy = user?.healthcare_type === "pharmacy";
  const itemLabel = isPharmacy ? "Medicament" : "Tool";

  // Validate user prop
  if (!user) {
    return <p className="text-red-500">Error: User data is missing.</p>;
  }

  // Fetch tools/medicaments on component mount
  useEffect(() => {
    const fetchToolsMedicaments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/tools-medicaments`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setToolsMedicaments(data.toolsMedicaments);
          setFilteredTools(data.toolsMedicaments);
        } else {
          setError(data.message || "Failed to fetch items");
        }
      } catch (err) {
        setError("Server error");
      } finally {
        setLoading(false);
      }
    };
    fetchToolsMedicaments();
  }, []);

  // Filter tools/medicaments based on search, type, and user posts
  useEffect(() => {
    let filtered = toolsMedicaments;
    if (showMyPosts) {
      filtered = filtered.filter((item) => item.user_id._id === user._id);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterType) {
      filtered = filtered.filter((item) => item.healthcare_type === filterType);
    }
    setFilteredTools(filtered);
  }, [searchQuery, filterType, showMyPosts, toolsMedicaments, user._id]);

  // Handle successful creation of a new tool/medicament
  const handleCreateSuccess = (newTool) => {
    setToolsMedicaments([newTool, ...toolsMedicaments]);
    setShowCreatePopup(false);
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

  // Determine rating color based on value
  const getRatingColor = (rating) => {
    if (!rating || rating === "No ratings yet") return "bg-gray-200 text-gray-700";
    const numRating = parseFloat(rating);
    if (numRating >= 4) return "bg-green-100 text-green-800";
    if (numRating >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Main UI with header, search, filters, and item cards
  return (
    <div className="min-h-screen bg-[#E1EEFF]">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header Section with Create and Toggle Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
          <div className="flex space-x-4">
            {user.user_type === "healthcare" && (
              <>
                <button
                  onClick={() => setShowCreatePopup(true)}
                  className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm"
                >
                  Create {itemLabel}
                </button>
                <button
                  onClick={() => setShowMyPosts(!showMyPosts)}
                  className={`py-2 px-4 rounded-lg transition-colors duration-200 font-medium shadow-sm ${
                    showMyPosts
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {showMyPosts ? "Show All Posts" : "Show My Posts"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-16 flex justify-center">
          <div className="relative w-full max-w-4xl flex items-center gap-4">
            <div className="relative flex-1">
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
                placeholder={`Search by name or category...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-3 py-2 h-16 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:font-bold placeholder:text-gray-500 shadow-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="cursor-pointer w-48 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            >
              <option value="">All Types</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="laboratory">Laboratory</option>
            </select>
          </div>
        </div>

        {/* Tools/Medicaments List */}
        {loading ? (
          <p className="text-gray-600 text-center animate-pulse">Loading {itemLabel.toLowerCase()}s...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : filteredTools.length === 0 ? (
          <p className="text-gray-600 text-center">No {itemLabel.toLowerCase()}s found.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((item) => (
              <div
                key={item._id}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => item.user_id && handleHealthcareClick(item.user_id._id)}
                    title="View Profile"
                  >
                    {item.user_id.profile_image ? (
                      <img
                        src={item.user_id.profile_image}
                        alt={`${item.user_id.name}'s profile`}
                        className="w-16 h-16 rounded-full object-cover border-4 border-indigo-200 shadow-sm hover:opacity-80 transition-opacity duration-200"
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
                      <span className="text-indigo-600 font-semibold block text-lg">
                        {item.user_id.name}
                      </span>
                      <button
                        onClick={() => handleReportClick(item.user_id._id)}
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
                    <span className="text-sm text-gray-500 block">
                      {item.healthcare_type.charAt(0).toUpperCase() + item.healthcare_type.slice(1)}
                    </span>
                  </div>
                </div>
                <div
                  className="bg-blue-50 p-4 rounded-lg shadow-sm cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <img
                    src={item.picture}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-base font-semibold text-gray-800 mb-2">{item.name.toUpperCase()}</h3>
                  <p className="text-gray-600 text-sm">Price: ${item.price.toFixed(2)}</p>
                  <p className="text-gray-600 text-sm">Category: {item.category || "None"}</p>
                  <p className="text-sm text-gray-500 mt-2 truncate">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Tool/Medicament Popup */}
        {showCreatePopup && (
          <CreateToolMedicamentPopup
            user={user}
            onClose={() => setShowCreatePopup(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {/* View Tool/Medicament Popup */}
        {selectedItem && (
          <ToolMedicamentPopup
            items={filteredTools}
            initialItem={selectedItem}
            user={user}
            onClose={() => setSelectedItem(null)}
            onDelete={(id) => setToolsMedicaments(toolsMedicaments.filter((item) => item._id !== id))}
            getRatingColor={getRatingColor}
          />
        )}

        {/* Healthcare Profile Popup */}
        {selectedHealthcare && (
          <HealthcareProfilePopup
            healthcare={selectedHealthcare}
            loading={healthcareLoading}
            error={healthcareError}
            onClose={() => setSelectedHealthcare(null)}
            getRatingColor={getRatingColor}
          />
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