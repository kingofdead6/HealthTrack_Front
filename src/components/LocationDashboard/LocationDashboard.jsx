/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Profile from "./Profile";
import HealthcareAnnouncements from "../HealthCareDashboard/HealthcareAnnouncements";
import Notifications from "../Shared/Notifications";
import { SocketProvider } from "../../context/SocketContext";
import { API_BASE_URL } from "../../../api";
import ToolsMedicaments from "./ToolsMedicaments";
import HealthCareMain from "../HealthCareDashboard/HealthcareMain";

// Main dashboard component for healthcare users
export default function LocationDashboard() {
  // State for user data, loading, and UI navigation
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("menu");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
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
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          throw new Error(data.message || "Failed to fetch user data");
        }

        if (data.user.user_type !== "healthcare") {
          throw new Error("Invalid user type: Must be healthcare");
        }

        if (
          data.user.healthcare_type !== "pharmacy" &&
          data.user.healthcare_type !== "laboratory"
        ) {
          throw new Error(
            `Invalid healthcare type: Must be pharmacy or laboratory, received ${data.user.healthcare_type}`
          );
        }

        setUser(data.user);
      } catch (error) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Display loading state if user data is not ready
  if (loading || !user) return <p className="text-center mt-10">Loading...</p>;

  const isPharmacy = user.healthcare_type === "pharmacy";
  const toolsOrMedicamentsLabel = isPharmacy ? "Medicaments" : "Tools";

  // Get title for the active section
  const getPageTitle = () => {
    switch (activeSection) {
      case "menu":
        return "";
      case "profile":
        return "Profile";
      case "announcements":
        return "Announcements";
      case "toolsOrMedicaments":
        return toolsOrMedicamentsLabel;
      default:
        return "Menu";
    }
  };

  // Toggle mobile menu visibility
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <SocketProvider userId={user._id}>
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

          {/* Menu Items */}
          <div className="flex flex-col flex-grow px-4 py-10 space-y-6">
            {["menu", "profile", "announcements", "toolsOrMedicaments"].map((section) => {
              const isActive = activeSection === section;

              return (
                <button
                  key={section}
                  onClick={() => {
                    setActiveSection(section);
                    setIsMenuOpen(false);
                  }}
                  className={`cursor-pointer text-center transition-colors duration-200 py-3 text-white text-lg rounded-full ${
                    isActive ? "" : "hover:bg-white hover:text-[#4285F4]"
                  }`}
                >
                  {isActive ? (
                    <div className="bg-white text-[#4285F4] px-6 py-3 rounded-full">
                      {section === "toolsOrMedicaments"
                        ? toolsOrMedicamentsLabel
                        : section.charAt(0).toUpperCase() + section.slice(1)}
                    </div>
                  ) : (
                    section === "toolsOrMedicaments"
                      ? toolsOrMedicamentsLabel
                      : section.charAt(0).toUpperCase() + section.slice(1)
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
              className="cursor-pointer w-full p-3 text-center rounded-lg text-white hover:bg-blue-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 md:ml-64">
          {/* Navigation Bar */}
          <nav className="relative bg-[#E1EEFF]">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="w-full text-center text-2xl md:text-4xl font-medium text-blue-700">
                {getPageTitle()}
              </div>
              <div className="flex items-center gap-4">
                <Notifications
                  userId={user._id}
                  onNotificationClick={() => {
                    setIsMenuOpen(false);
                  }}
                />
              </div>
            </div>
          </nav>

          {/* Content Sections */}
          <div className="p-4 pt-4">
            <div className="max-w-9xl mx-auto">
              <div className="-ml-5 -mr-5 -mt-20 -mb-30 md:-ml-50">
                {activeSection === "menu" && <HealthCareMain />}
              </div>
              <div className="mt-20">
                {activeSection === "profile" && <Profile user={user} />}
                {activeSection === "announcements" && <HealthcareAnnouncements />}
                {activeSection === "toolsOrMedicaments" && <ToolsMedicaments user={user} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SocketProvider>
  );
}