/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PatientProfile from "./PatientProfile";
import Announcements from "./Announcements";
import Appointments from "./Appointments";
import HealthcareList from "./HealthcareList";
import PatientMain from "./PatientMain";
import PatientToolsMedicaments from "./PatientToolsMedicaments";
import FavoritesList from "./FavoritesList";
import ChatList from "../Chat/ChatList";
import ChatWindow from "../Chat/ChatWindow";
import Notifications from "../Shared/Notifications";
import { SocketProvider } from "../../context/SocketContext";
import { API_BASE_URL } from "../../../api";


// PatientDashboard component serves as the main interface for patients
export default function PatientDashboard() {
  // State declarations for managing dashboard functionality
  const [loading, setLoading] = useState(false); // Indicate loading state during user fetch
  const [activeSection, setActiveSection] = useState("menu"); // Track the currently active section (e.g., profile, chats)
  const [activeChatId, setActiveChatId] = useState(null); // Track the ID of the selected chat
  const [user, setUser] = useState(null); // Store authenticated user data
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Toggle mobile sidebar menu visibility
  const location = useLocation(); // Access current location and state
  const navigate = useNavigate(); // Enable programmatic navigation

  // Fetch user data on component mount
  useEffect(() => {
    // Async function to fetch user data from API or location state
    const fetchUser = async () => {
      setLoading(true); // Set loading state to true
      const token = localStorage.getItem("token"); // Retrieve auth token from localStorage
      if (!token) {
        navigate("/login"); // Redirect to login if no token is found
        return;
      }

      try {
        let fetchedUser = location.state?.user; // Check for user data in location state
        if (!fetchedUser) {
          // Fetch user data from API if not provided in location state
          const response = await fetch(`${API_BASE_URL}/api/users/current`, {
            headers: {
              Authorization: `Bearer ${token}`, // Include auth token in headers
              "Content-Type": "application/json", // Specify JSON content type
            },
          });
          const data = await response.json(); // Parse response JSON
          if (response.ok && data.user.user_type === "patient") {
            fetchedUser = data.user; // Store fetched user data
            setUser(fetchedUser); // Update user state
          } else if (response.status === 401) {
            localStorage.removeItem("token"); // Remove token if unauthorized
            navigate("/login"); // Redirect to login
            return;
          } else {
            throw new Error("Invalid user type or failed to fetch user"); // Throw error for invalid user
          }
        } else {
          setUser(fetchedUser); // Use user data from location state
        }

        // Set active section and chat ID from location state if provided
        if (location.state?.activeSection) {
          setActiveSection(location.state.activeSection); // Update active section
          if (
            location.state.activeSection === "chats" &&
            location.state.chatId
          ) {
            setActiveChatId(location.state.chatId); // Set active chat ID
          }
        }
      } catch (error) {
        navigate("/login"); // Redirect to login on error
      } finally {
        setLoading(false); // Reset loading state
      }
    };

    fetchUser(); // Call fetch function
  }, [navigate, location]); // Dependencies for useEffect

  // Render loading state if still fetching user data or user is null
  if (loading || !user) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  // Function to get page title based on active section
  const getPageTitle = () => {
    switch (activeSection) {
      case "menu":
        return ""; // No title for main menu
      case "profile":
        return "Profile"; // Title for profile section
      case "doctors":
        return "Doctors"; // Title for doctors section
      case "announcements":
        return "Announcements"; // Title for announcements section
      case "appointments":
        return "Appointments"; // Title for appointments section
      case "favorites":
        return "Favorites"; // Title for favorites section
      case "chats":
        return "Chats"; // Title for chats section
      case "tools-medicaments":
        return "Tools & Medicaments"; // Title for tools and medicaments section
      default:
        return ""; // Default empty title
    }
  };

  // Toggle mobile sidebar menu visibility
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen); // Toggle menu open state
  };

  // Render notifications component with click handlers
  const renderNotifications = () => (
    <Notifications
      userId={user._id} // Pass user ID for fetching notifications
      onNotificationClick={(notification) => {
        // Handle notification click based on type
        if (notification.type === "new_message") {
          setActiveSection("chats"); // Navigate to chats section
          setActiveChatId(notification.related_id); // Set active chat ID
        } else if (
          notification.type === "appointment_request" ||
          notification.type === "appointment_accepted"
        ) {
          setActiveSection("appointments"); // Navigate to appointments section
        }
        setIsMenuOpen(false); // Close mobile menu
      }}
    />
  );

  // Main dashboard UI wrapped in SocketProvider for real-time updates
  return (
    <SocketProvider userId={user._id}> {/* Provide WebSocket context with user ID */}
      <div className="min-h-screen bg-[#E1EEFF] flex flex-col md:flex-row overflow-hidden">
        {/* Hamburger Menu Button for Mobile */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#4285F4] text-white rounded-md"
          onClick={toggleMenu} // Toggle sidebar menu on click
        >
          {isMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg> // Close icon when menu is open
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg> // Hamburger icon when menu is closed
          )}
        </button>

        {/* Sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-[#4285F4] shadow-xl z-40 flex flex-col justify-between transform transition-transform duration-300 md:transform-none ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`} // Sidebar with conditional transform for mobile
        >
          {/* Logo and Menu Items */}
          <div className="flex flex-col">
            <div className="flex items-center justify-center py-8">
              <div className="text-2xl font-bold bg-white px-8 py-3 rounded-full">
                <span className="text-black">Health</span>
                <span className="text-[#4285F4]">Track</span> {/* Logo text */}
              </div>
            </div>
            <div className="flex flex-col px-4 py-1 space-y-6">
              {[
                { label: "Menu", key: "menu" },
                { label: "Profile", key: "profile" },
                { label: "Doctors", key: "doctors" },
                { label: "Announcements", key: "announcements" },
                { label: "Appointments", key: "appointments" },
                { label: "Favorites", key: "favorites" },
                { label: "Chats", key: "chats" },
                { label: "Tools & Medicaments", key: "tools-medicaments" },
              ].map(({ label, key }) => {
                const isActive = activeSection === key; // Check if section is active

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveSection(key); // Set active section
                      if (key !== "chats") setActiveChatId(null); // Clear chat ID unless chats section
                      setIsMenuOpen(false); // Close mobile menu
                    }}
                    className={`cursor-pointer text-center transition-colors duration-200 py-3 text-white text-lg rounded-full ${
                      isActive ? "" : "hover:bg-white hover:text-[#4285F4]"
                    }`} // Conditional styling for active/inactive buttons
                  >
                    {isActive ? (
                      <div className="bg-white text-[#4285F4] px-6 py-3 rounded-full">
                        {label} {/* Highlight active section */}
                      </div>
                    ) : (
                      label // Display label for inactive section
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout Button */}
          <div className="px-4 pb-8">
            <button
              onClick={() => {
                localStorage.removeItem("token"); // Remove auth token
                navigate("/"); // Navigate to home page
              }}
              className="cursor-pointer w-full p-3 text-center rounded-lg text-white hover:bg-blue-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 md:ml-64"> {/* Adjust margin for sidebar */}
          {/* Navbar (only for non-menu sections) */}
          {activeSection !== "menu" && (
            <nav className="relative bg-[#E1EEFF]">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="w-full text-center text-2xl md:text-4xl font-medium text-blue-700">
                  {getPageTitle()} {/* Display page title */}
                </div>
                <div className="flex items-center gap-4">
                  {renderNotifications()} {/* Render notifications */}
                </div>
              </div>
            </nav>
          )}

          {/* Notifications (only for menu section) */}
          {activeSection === "menu" && (
            <div className="fixed top-4 right-4 z-50">
              {renderNotifications()} {/* Render notifications in top-right corner */}
            </div>
          )}

          {/* Main Section Content */}
          <div className={`p-4 ${activeSection !== "menu" ? "pt-4" : "pt-4"}`}> {/* Adjust padding */}
            <div className="max-w-9xl mx-auto">
              <div className="-ml-5 -mr-5 -mt-4 md:-ml-50"> {/* Negative margins for full-width layout */}
                {activeSection === "menu" && <PatientMain />} {/* Render main dashboard */}
              </div>
              {activeSection === "profile" && <PatientProfile user={user} />} {/* Render profile section */}
              {activeSection === "doctors" && <HealthcareList />} {/* Render doctors list */}
              {activeSection === "announcements" && <Announcements />} {/* Render announcements */}
              {activeSection === "appointments" && <Appointments />} {/* Render appointments */}
              {activeSection === "favorites" && <FavoritesList />} {/* Render favorites list */}
              {activeSection === "chats" && (
                <div className="flex flex-col md:flex-row gap-4 h-[80vh]"> {/* Chat layout */}
                  <div className="w-full md:w-1/3">
                    <ChatList
                      userId={user._id} // Pass user ID for chat list
                      onChatSelect={setActiveChatId} // Handle chat selection
                      selectedChatId={activeChatId} // Highlight selected chat
                    />
                  </div>
                  <div className="w-full md:w-2/3">
                    {activeChatId ? (
                      <ChatWindow chatId={activeChatId} userId={user._id} /> // Render chat window
                    ) : (
                      <div className="bg-white rounded-lg shadow p-4 h-full flex items-center justify-center">
                        <p className="text-gray-600">Select a chat to start messaging</p> {/* Placeholder text */}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeSection === "tools-medicaments" && <PatientToolsMedicaments user={user} />} {/* Render tools and medicaments */}
            </div>
          </div>
        </div>
      </div>
    </SocketProvider>
  );
}