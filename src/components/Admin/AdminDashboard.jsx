/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UsersTable from "./UsersTable";
import AdminHealthCare from "./AdminHealthCare";
import AdminReviews from "./AdminReviews";
import AdminReports from "./AdminReports";
import AddAdmin from "./AddAdmin";
import { API_BASE_URL } from "../../../api";

// Component for the admin dashboard, providing navigation and section rendering
export default function AdminDashboard() {
  // State for user data, UI, and navigation
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("allUsers");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch authenticated admin user data
  useEffect(() => {
    const fetchUser = async (retries = 2) => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok && data.user.user_type === "admin") {
          setUser(data.user);
          setError(null);
        } else if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else if (retries > 0) {
          setTimeout(() => fetchUser(retries - 1), 1000);
        } else {
          throw new Error("Invalid user type or failed to fetch user");
        }
      } catch (error) {
        setError("Failed to load dashboard. Please try again.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Toggle mobile menu visibility
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Display loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E1EEFF]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#4285F4]"></div>
      </div>
    );
  }

  // Display error or no user state
  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E1EEFF]">
        <div className="text-red-600 text-lg font-semibold">{error || "Loading user data..."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E1EEFF] flex flex-col md:flex-row overflow-hidden">
      {/* Hamburger Menu Button for Mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#4285F4] text-white rounded-md"
        onClick={toggleMenu}
      >
        {isMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Side Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#4285F4] shadow-xl z-40 flex flex-col transform transition-transform duration-300 md:transform-none ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center py-8">
          <div className="text-2xl font-bold bg-white px-8 py-3 rounded-full">
            <span className="text-black">Health</span>
            <span className="text-[#4285F4]">Track</span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col flex-grow px-4 py-10 space-y-6">
          {[
            { label: "All Users", key: "allUsers" },
            { label: "Healthcare Staff", key: "healthcareStaffs" },
            { label: "Reviews", key: "reviews" },
            { label: "Reports", key: "reports" },
            { label: "Add Admin", key: "addAdmin" },
          ].map(({ label, key }) => {
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveSection(key);
                  setIsMenuOpen(false);
                }}
                className={`cursor-pointer text-center transition-colors duration-200 py-3 text-white text-lg rounded-full ${
                  isActive ? "" : "hover:bg-white hover:text-[#4285F4]"
                }`}
              >
                {isActive ? (
                  <div className="bg-white text-[#4285F4] px-6 py-3 rounded-full">
                    {label}
                  </div>
                ) : (
                  label
                )}
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="px-4 pb-8">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
            className="cursor-pointer w-full p-3 text-center rounded-lg text-white bg-blue-500 hover:bg-blue-700 transition-colors duration-200 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64">
        <div className="p-4 mt-16">
          <div className="max-w-7xl mx-auto">
            {activeSection === "allUsers" && <UsersTable />}
            {activeSection === "healthcareStaffs" && <AdminHealthCare />}
            {activeSection === "reviews" && <AdminReviews />}
            {activeSection === "reports" && <AdminReports />}
            {activeSection === "addAdmin" && <AddAdmin />}
          </div>
        </div>
      </div>
    </div>
  );
}