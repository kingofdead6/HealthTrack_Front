import { useState, useEffect } from "react";
import HealthcareCard from "./HealthcareCard";
import { API_BASE_URL } from "../../../api";

// HealthcareList component to display and filter healthcare providers
export default function HealthcareList() {
  // State declarations for managing providers and UI
  const [providers, setProviders] = useState([]); // Store all fetched healthcare providers
  const [filteredProviders, setFilteredProviders] = useState([]); // Store filtered providers based on search and filters
  const [loading, setLoading] = useState(false); // Indicate loading state during API fetch
  const [searchQuery, setSearchQuery] = useState(""); // Store search input query
  const [filters, setFilters] = useState({
    // Store filter criteria
    healthcareType: "", // Filter by healthcare type (e.g., doctor, nurse)
    canDeliver: "", // Filter by delivery capability
    specialty: "", // Filter by specialty
    workingHours: "", // Filter by working hours
    priceRange: "", // Filter by price range
  });

  // Fetch healthcare providers on component mount
  useEffect(() => {
    // Async function to fetch approved healthcare providers from API
    const fetchProviders = async () => {
      const token = localStorage.getItem("token"); // Retrieve auth token from localStorage
      if (!token) return; // Exit if no token is found

      setLoading(true); // Set loading state to true
      try {
        const response = await fetch(`${API_BASE_URL}/api/healthcare/approved-healthcare`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include auth token in headers
            "Content-Type": "application/json", // Specify JSON content type
          },
        });
        const data = await response.json(); // Parse response JSON
        if (response.ok) {
          setProviders(data); // Update providers state with fetched data
          setFilteredProviders(data); // Initialize filtered providers with all providers
        }
      } finally {
        setLoading(false); // Reset loading state
      }
    };
    fetchProviders(); // Call fetch function
  }, []); // Empty dependency array to run once on mount

  // Filter providers based on search query and filter criteria
  useEffect(() => {
    let result = [...providers]; // Create a copy of providers to filter

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase(); // Convert query to lowercase for case-insensitive search
      result = result.filter(
        (provider) =>
          (provider.name?.toLowerCase().includes(query) || false) || // Search by name
          (provider.speciality?.toLowerCase().includes(query) || false) || // Search by specialty
          (provider.clinic_name?.toLowerCase().includes(query) || false) // Search by clinic name
      );
    }

    // Apply healthcare type filter
    if (filters.healthcareType) {
      result = result.filter((provider) => provider.healthcare_type === filters.healthcareType);
    }
    // Apply delivery capability filter
    if (filters.canDeliver !== "") {
      result = result.filter((provider) => provider.can_deliver === (filters.canDeliver === "yes"));
    }
    // Apply specialty filter
    if (filters.specialty) {
      result = result.filter(
        (provider) => provider.speciality?.toLowerCase() === filters.specialty.toLowerCase()
      );
    }
    // Apply working hours filter
    if (filters.workingHours) {
      result = result.filter((provider) => provider.working_hours?.includes(filters.workingHours));
    }
    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split("-").map(Number); // Parse price range
      result = result.filter((provider) => {
        if (provider.healthcare_type !== "doctor" && provider.healthcare_type !== "nurse") return true; // Skip non-doctor/nurse providers
        const price = provider.price; // Get provider price
        return price !== null && price >= min && (max ? price <= max : true); // Filter by price range
      });
    }

    setFilteredProviders(result); // Update filtered providers state
  }, [searchQuery, filters, providers]); // Dependencies for filter effect

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value); // Update search query state
  };

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target; // Extract filter name and value
    setFilters((prev) => ({ ...prev, [name]: value })); // Update filters state
  };

  // Define filter options
  const healthcareTypes = ["doctor", "nurse"]; // Available healthcare types
  const specialties = [...new Set(providers.map((p) => p.speciality?.toLowerCase()))].filter(Boolean); // Unique specialties
  const workingHoursOptions = [...new Set(providers.map((p) => p.working_hours))].filter(Boolean); // Unique working hours

  const priceRangeOptions = [
    { label: "Any", value: "" }, // Any price range
    { label: "$0 - $50", value: "0-50" },
    { label: "$51 - $100", value: "51-100" },
    { label: "$101 - $200", value: "101-200" },
    { label: "$201+", value: "201" },
  ]; // Price range options

  // Main UI for healthcare providers list
  return (
    <div className="min-h-screen bg-[#E1EEFF] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-4xl">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="w-10 h-10 bg-[#4285F4] rounded-full flex items-center justify-center">
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
              onChange={handleSearchChange}
              className="w-full pl-16 pr-3 py-2 h-16 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all duration-200 placeholder:font-bold placeholder:text-gray-500 shadow-sm text-sm sm:text-base"
              placeholder="Search by name, specialty, or clinic..." // Search input
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Healthcare Type</label>
            <select
              name="healthcareType"
              value={filters.healthcareType}
              onChange={handleFilterChange}
              className="cursor-pointer w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] transition-all duration-300 text-sm sm:text-base"
            >
              <option value="">All Types</option> {/* Default option */}
              {healthcareTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} {/* Capitalize type */}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Can Deliver</label>
            <select
              name="canDeliver"
              value={filters.canDeliver}
              onChange={handleFilterChange}
              className="cursor-pointer w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] transition-all duration-300 text-sm sm:text-base"
            >
              <option value="">Any</option> {/* Default option */}
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
            <select
              name="specialty"
              value={filters.specialty}
              onChange={handleFilterChange}
              className="cursor-pointer w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] transition-all duration-300 text-sm sm:text-base"
            >
              <option value="">All Specialties</option> {/* Default option */}
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec.charAt(0).toUpperCase() + spec.slice(1)} {/* Capitalize specialty */}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
            <select
              name="workingHours"
              value={filters.workingHours}
              onChange={handleFilterChange}
              className="cursor-pointer w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] transition-all duration-300 text-sm sm:text-base"
            >
              <option value="">All Hours</option> {/* Default option */}
              {workingHoursOptions.map((hours) => (
                <option key={hours} value={hours}>
                  {hours}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <select
              name="priceRange"
              value={filters.priceRange}
              onChange={handleFilterChange}
              className="cursor-pointer w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] transition-all duration-300 text-sm sm:text-base"
            >
              {priceRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {/* Display price range label */}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Providers List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-12 w-12 text-[#4285F4]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h-8z" /> {/* Loading spinner */}
            </svg>
          </div>
        ) : filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {filteredProviders.map((provider) => {
              if (provider.healthcare_type === "doctor" || provider.healthcare_type === "nurse") {
                return <HealthcareCard key={provider.user_id} provider={provider} />; // Render HealthcareCard for doctors and nurses
              }
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg font-medium">
              No healthcare providers match your criteria. {/* Message for no results */}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}