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
import PharLabList from "./PharLabList";

export default function PatientDashboard() {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("menu");
  const [activeChatId, setActiveChatId] = useState(null);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        let fetchedUser = location.state?.user;
        if (!fetchedUser) {
          const response = await fetch(`${API_BASE_URL}/api/users/current`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const data = await response.json();
          if (response.ok && data.user.user_type === "patient") {
            fetchedUser = data.user;
            setUser(fetchedUser);
          } else if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          } else {
            throw new Error("Invalid user type or failed to fetch user");
          }
        } else {
          setUser(fetchedUser);
        }

        if (location.state?.activeSection) {
          setActiveSection(location.state.activeSection);
          if (
            location.state.activeSection === "chats" &&
            location.state.chatId
          ) {
            setActiveChatId(location.state.chatId);
          }
        }
      } catch (error) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, location]);

  if (loading || !user) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  const getPageTitle = () => {
    switch (activeSection) {
      case "menu":
        return "";
      case "profile":
        return "Profile";
      case "doctors":
        return "Doctors-Nurses";
      case "lab":
        return "Laboratories-Pharmacies";
      case "announcements":
        return "Announcements";
      case "appointments":
        return "Appointments";
      case "favorites":
        return "Favorites";
      case "chats":
        return "Chats";
      case "tools-medicaments":
        return "Tools & Medicaments";
      default:
        return "";
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const renderNotifications = () => (
    <Notifications
      userId={user._id}
      onNotificationClick={(notification) => {
        if (notification.type === "new_message") {
          setActiveSection("chats");
          setActiveChatId(notification.related_id);
        } else if (
          notification.type === "appointment_request" ||
          notification.type === "appointment_accepted"
        ) {
          setActiveSection("appointments");
        }
        setIsMenuOpen(false);
      }}
    />
  );

  return (
    <SocketProvider userId={user._id}>
      {/* Custom scrollbar styles */}
      <style>
        {`
          /* Custom scrollbar for WebKit browsers */
          .custom-scrollbar-y::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar-y::-webkit-scrollbar-track {
            background: rgba(209, 213, 219, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar-y::-webkit-scrollbar-thumb {
            background: #4285F4;
            border-radius: 4px;
            transition: background 0.2s;
          }
          .custom-scrollbar-y::-webkit-scrollbar-thumb:hover {
            background: #3367D6;
          }

          /* Firefox scrollbar styling */
          .custom-scrollbar-y {
            scrollbar-width: thin;
            scrollbar-color: #4285F4 rgba(209, 213, 219, 0.3);
          }
        `}
      </style>
      
      <div className="min-h-screen bg-[#E1EEFF] flex flex-col md:flex-row overflow-y-scroll">
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

        {/* Sidebar with custom scrollbar */}
        <div
          className={`overflow-y-scroll custom-scrollbar-y fixed top-0 left-0 h-full w-64 bg-[#4285F4] shadow-xl z-40 flex flex-col justify-between transform transition-transform duration-300 md:transform-none ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        >
          {/* Logo and Menu Items */}
          <div className="flex flex-col">
            <div className="flex items-center justify-center py-8">
              <div className="text-2xl font-bold bg-white px-8 py-3 rounded-full">
                <span className="text-black">Health</span>
                <span className="text-[#4285F4]">Track</span>
              </div>
            </div>
            <div className="flex flex-col px-4 py-1 space-y-6">
              {[
                { label: "Menu", key: "menu" },
                { label: "Profile", key: "profile" },
                { label: "Doctors", key: "doctors" },
                { label: "Laboratories & Pharmacies", key: "lab" },
                { label: "Announcements", key: "announcements" },
                { label: "Appointments", key: "appointments" },
                { label: "Favorites", key: "favorites" },
                { label: "Chats", key: "chats" },
                { label: "Tools & Medicaments", key: "tools-medicaments" },
              ].map(({ label, key }) => {
                const isActive = activeSection === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveSection(key);
                      if (key !== "chats") setActiveChatId(null);
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
          {/* Navbar (only for non-menu sections) */}
          {activeSection !== "menu" && (
            <nav className="relative bg-[#E1EEFF]">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="w-full text-center text-2xl md:text-4xl font-medium text-blue-700">
                  {getPageTitle()}
                </div>
                <div className="flex items-center gap-4">
                  {renderNotifications()}
                </div>
              </div>
            </nav>
          )}

          {/* Notifications (only for menu section) */}
          {activeSection === "menu" && (
            <div className="fixed top-4 right-4 z-50">
              {renderNotifications()}
            </div>
          )}

          {/* Main Section Content with custom scrollbar */}
          <div className={`p-4 ${activeSection !== "menu" ? "pt-4" : "pt-4"} custom-scrollbar-y`} style={{ maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
            <div className="max-w-9xl mx-auto">
              <div className="-ml-5 -mr-5 -mt-4 md:-ml-50">
                {activeSection === "menu" && <PatientMain />}
              </div>
              {activeSection === "profile" && <PatientProfile user={user} />}
              {activeSection === "doctors" && <HealthcareList />}
              {activeSection === "lab" && <PharLabList />}
              {activeSection === "announcements" && <Announcements />}
              {activeSection === "appointments" && <Appointments />}
              {activeSection === "favorites" && <FavoritesList />}
              {activeSection === "chats" && (
                <div className="flex flex-col md:flex-row gap-4 h-[80vh]">
                  <div className="w-full md:w-1/3 custom-scrollbar-y" style={{ maxHeight: '100%', overflowY: 'auto' }}>
                    <ChatList
                      userId={user._id}
                      onChatSelect={setActiveChatId}
                      selectedChatId={activeChatId}
                    />
                  </div>
                  <div className="w-full md:w-2/3 custom-scrollbar-y" style={{ maxHeight: '100%', overflowY: 'auto' }}>
                    {activeChatId ? (
                      <ChatWindow chatId={activeChatId} userId={user._id} />
                    ) : (
                      <div className="bg-white rounded-lg shadow p-4 h-full flex items-center justify-center">
                        <p className="text-gray-600">Select a chat to start messaging</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeSection === "tools-medicaments" && <PatientToolsMedicaments user={user} />}
            </div>
          </div>
        </div>
      </div>
    </SocketProvider>
  );
}