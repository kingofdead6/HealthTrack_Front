/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HealthcareAppointments from "./HealthcareAppointments";
import HealthcareProfile from "./HealthcareProfile";
import HealthcareMenu from "./HealthcareMain";
import HealthcareAnnouncements from "./HealthcareAnnouncements";
import ChatList from "../Chat/ChatList";
import ChatWindow from "../Chat/ChatWindow";
import Notifications from "../Shared/Notifications";
import { SocketProvider } from "../../context/SocketContext";
import { API_BASE_URL } from "../../../api";

// Main dashboard component for healthcare providers, managing navigation and section rendering
export default function HealthcareDashboard() {
  // State to store the authenticated user's data
  const [user, setUser] = useState(null);
  // State to indicate if user data is being fetched
  const [loading, setLoading] = useState(false);
  // State to track the currently active section (e.g., menu, profile, chats)
  const [activeSection, setActiveSection] = useState("menu");
  // State to store the ID of the currently active chat
  const [activeChatId, setActiveChatId] = useState(null);
  // State to toggle the mobile menu visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // Fetch user data when the component mounts
  useEffect(() => {
    // Function to fetch authenticated user details
    const fetchUser = async () => {
      setLoading(true); // Start loading state
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login"); // Redirect to login if no token
        return;
      }

      try {
        // Make API call to fetch user data
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok && data.user.user_type === "healthcare") {
          setUser(data.user); // Store user data if valid healthcare user
        } else if (response.status === 401) {
          localStorage.removeItem("token"); // Clear token on unauthorized access
          navigate("/login");
        } else {
          throw new Error("Invalid user type or failed to fetch user");
        }
      } catch (error) {
        navigate("/login"); // Redirect to login on error
      } finally {
        setLoading(false); // End loading state
      }
    };

    fetchUser(); // Execute fetch operation
  }, [navigate]);

  // Display loading message while fetching user data
  if (loading || !user) return <p className="text-center mt-10">Loading...</p>;

  // Function to determine the page title based on the active section
  const getPageTitle = () => {
    switch (activeSection) {
      case "menu":
        return ""; // No title for menu section
      case "profile":
        return "Profile";
      case "appointments":
        return "Appointments";
      case "announcements":
        return "Announcements";
      case "chats":
        return "Chats";
      default:
        return ""; // Default to empty title
    }
  };

  // Toggle the mobile menu visibility
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Render the notifications component with click handlers
  const renderNotifications = () => (
    <Notifications
      userId={user._id} // Pass user ID for fetching notifications
      onNotificationClick={(notification) => {
        // Handle notification clicks based on type
        if (notification.type === "new_message") {
          setActiveSection("chats"); // Switch to chats section
          setActiveChatId(notification.related_id); // Set active chat
        } else if (
          notification.type === "appointment_request" ||
          notification.type === "appointment_accepted"
        ) {
          setActiveSection("appointments"); // Switch to appointments section
        }
        setIsMenuOpen(false); // Close mobile menu
      }}
    />
  );

  return (
    // Wrap the dashboard in SocketProvider for real-time updates
    <SocketProvider userId={user._id}>
      <div className="min-h-screen bg-[#E1EEFF] flex flex-col md:flex-row overflow-hidden">
        {/* Hamburger Menu Button for Mobile */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#4285F4] text-white rounded-md"
          onClick={toggleMenu}
        >
          {isMenuOpen ? (
            // Close icon for open menu
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Hamburger icon for closed menu
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
          {/* Logo Section */}
          <div className="flex items-center justify-center py-8">
            <div className="text-2xl font-bold bg-white px-8 py-3 rounded-full">
              <span className="text-black">Health</span>
              <span className="text-[#4285F4]">Track</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col flex-grow px-4 py-10 space-y-6">
            {["menu", "profile", "appointments", "announcements", "chats"].map((section) => {
              const isActive = activeSection === section;

              return (
                // Navigation button for each section
                <button
                  key={section}
                  onClick={() => {
                    setActiveSection(section); // Set active section
                    setActiveChatId(null); // Clear active chat
                    setIsMenuOpen(false); // Close mobile menu
                  }}
                  className={`cursor-pointer text-center transition-colors duration-200 py-3 text-white text-lg rounded-full ${
                    isActive ? "" : "hover:bg-white hover:text-[#4285F4]"
                  }`}
                >
                  {isActive ? (
                    // Highlight active section
                    <div className="bg-white text-[#4285F4] px-6 py-3 rounded-full">
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </div>
                  ) : (
                    section.charAt(0).toUpperCase() + section.slice(1)
                  )}
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="px-4 pb-8">
            <button
              onClick={() => {
                localStorage.removeItem("token"); // Clear token
                navigate("/"); // Redirect to home
              }}
              className="cursor-pointer w-full p-3 text-center rounded-lg text-white hover:bg-blue-700 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 md:ml-64">
          {/* Navbar (displayed for non-menu sections) */}
          {activeSection !== "menu" && (
            <nav className="relative bg-[#E1EEFF]">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="w-full text-center text-2xl md:text-4xl font-medium text-blue-700">
                  {getPageTitle()} {/* Display section title */}
                </div>
                <div className="flex items-center gap-4">
                  {renderNotifications()} {/* Render notifications */}
                </div>
              </div>
            </nav>
          )}

          {/* Notifications (displayed for menu section) */}
          {activeSection === "menu" && (
            <div className="fixed top-4 right-4 z-50">
              {renderNotifications()}
            </div>
          )}

          {/* Content Section */}
          <div className={`p-4 ${activeSection !== "menu" ? "pt-4" : "pt-4"}`}>
            <div className="max-w-9xl mx-auto">
              <div className="-ml-5 -mr-5 -mt-4 md:-ml-50">
                {/* Render the appropriate component based on active section */}
                {activeSection === "menu" && <HealthcareMenu />}
              </div>
              {activeSection === "profile" && <HealthcareProfile user={user} />}
              {activeSection === "appointments" && <HealthcareAppointments />}
              {activeSection === "announcements" && <HealthcareAnnouncements />}
              {activeSection === "chats" && (
                // Chat section layout with list and window
                <div className="flex flex-col md:flex-row gap-4 h-[80vh]">
                  <div className="w-full md:w-1/3">
                    <ChatList
                      userId={user._id} // Pass user ID for chat list
                      onChatSelect={setActiveChatId} // Handle chat selection
                      selectedChatId={activeChatId} // Highlight selected chat
                    />
                  </div>
                  <div className="w-full md:w-2/3">
                    {activeChatId ? (
                      // Render chat window if a chat is selected
                      <ChatWindow chatId={activeChatId} userId={user._id} />
                    ) : (
                      // Placeholder when no chat is selected
                      <div className="bg-white rounded-lg shadow p-4 h-full flex items-center justify-center">
                        <p>Select a chat to start messaging</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SocketProvider>
  );
}