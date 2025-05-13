/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSocket } from "../../context/SocketContext";
import { API_BASE_URL } from "../../../api";
import { HiDotsVertical } from "react-icons/hi";
import ReportUser from "../Shared/ReportUser";
import { useMediaQuery } from "react-responsive";

// Displays a list of chats for the user with options to select, delete, or report chats
export default function ChatList({ userId, onChatSelect, selectedChatId }) {
  // State for managing chats, errors, and menu visibility
  const [chats, setChats] = useState([]); // List of user's chats
  const [error, setError] = useState(""); // Error messages for API failures
  const [menuOpen, setMenuOpen] = useState(null); // Tracks which chat's menu is open
  const [reportOpen, setReportOpen] = useState(null); // Tracks which user is being reported
  const socket = useSocket(); // Socket context for real-time updates
  const menuRef = useRef(null); // Ref for menu to handle outside clicks
  const longPressTimer = useRef(null); // Tracks long-press timeout for mobile
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" }); // Detects mobile view (≤768px)

  // Generates dynamic background color for avatars based on name
  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-orange-500",
    ];
    const index = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Sorts chats by last message timestamp (newest first)
  const sortChatsByLastMessageTime = (chatsArray) => {
    return [...chatsArray].sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  };

  // Deletes a chat via API and updates state
  const handleDeleteChat = async (chatId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));
      if (selectedChatId === chatId) {
        onChatSelect(null); // Deselect chat if deleted
      }
      setMenuOpen(null); // Close menu
    } catch (error) {
      setError("Failed to delete chat");
    }
  };

  // Selects a chat and marks messages/notifications as read
  const handleChatSelect = (chatId) => {
    onChatSelect(chatId); // Notify parent of chat selection
    if (socket) {
      socket.emit("mark_notifications_read", { chatId, userId });
      socket.emit("mark_messages_read", { chatId, userId });
    }
    setMenuOpen(null); // Close menu
  };

  // Starts long-press timer for mobile menu (500ms)
  const handleLongPressStart = (chatId) => {
    longPressTimer.current = setTimeout(() => {
      setMenuOpen(chatId); // Show bottom sheet menu
    }, 500);
  };

  // Cancels long-press or triggers chat selection on single tap
  const handleLongPressEnd = (chatId) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      if (!menuOpen) {
        handleChatSelect(chatId); // Select chat on single tap
      }
    }
  };

  // Opens ReportUser modal for reporting a user
  const handleReportUser = (reportedId) => {
    setReportOpen(reportedId); // Show ReportUser modal
    setMenuOpen(null); // Close menu
  };

  // Toggles dropdown menu for desktop view
  const toggleMenu = (chatId) => {
    setMenuOpen(menuOpen === chatId ? null : chatId);
  };

  // Closes menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetches chats and sets up socket listeners for real-time updates
  useEffect(() => {
    // Fetch user's chats from API
    const fetchChats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/chats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setChats(sortChatsByLastMessageTime(response.data));
      } catch (error) {
        setError("Failed to load chats");
      }
    };

    fetchChats();

    if (socket) {
      // Update chat list when a new message is received
      socket.on("receive_message", (message) => {
        setChats((prevChats) => {
          const chatExists = prevChats.find((chat) => chat._id === message.chat_id);
          const updatedChats = prevChats.map((chat) =>
            chat._id === message.chat_id
              ? {
                  ...chat,
                  lastMessage: message.file_url
                    ? `[${message.file_type === "pdf" ? "PDF" : "Image"}]`
                    : message.content,
                  lastMessageTime: message.createdAt,
                  unreadCount:
                    message.sender_id._id !== userId
                      ? (chat.unreadCount || 0) + 1
                      : chat.unreadCount,
                }
              : chat
          );

          // Fetch updated chat list if chat doesn't exist
          if (!chatExists) {
            axios
              .get(`${API_BASE_URL}/api/chats`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
              })
              .then((response) => {
                setChats(sortChatsByLastMessageTime(response.data));
              });
            return updatedChats;
          }

          return sortChatsByLastMessageTime(updatedChats);
        });
      });

      // Add new chat to list
      socket.on("new_chat", (newChat) => {
        setChats((prevChats) => {
          if (prevChats.find((chat) => chat._id === newChat._id)) {
            return prevChats;
          }
          return sortChatsByLastMessageTime([...prevChats, newChat]);
        });
      });

      // Remove deleted chat from list
      socket.on("chat_deleted", ({ chatId }) => {
        setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));
        if (selectedChatId === chatId) {
          onChatSelect(null);
        }
      });

      // Reset unread count when messages are read
      socket.on("messages_read", ({ chatId }) => {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      });

      // Reset unread count when notifications are read
      socket.on("notifications_read", ({ chatId }) => {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      });
    }

    // Cleanup socket listeners on unmount
    return () => {
      if (socket) {
        socket.off("receive_message");
        socket.off("new_chat");
        socket.off("chat_deleted");
        socket.off("messages_read");
        socket.off("notifications_read");
      }
    };
  }, [socket, userId, selectedChatId, onChatSelect]);

  // Render mobile view with bottom sheet menu
  if (isMobile) {
    return (
      <div className="bg-gradient-to-b from-white to-gray-50 p-4 h-full overflow-y-hidden rounded-2xl">
        {error ? (
          <div className="flex items-center justify-center h-full bg-red-50 rounded-2xl p-4 shadow-md">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-lg font-medium opacity-80">No chats available</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {chats.map((chat) => {
              const displayName =
                chat.patient_id._id === userId
                  ? chat.healthcare_id.name
                  : chat.patient_id.name;
              const isDeleted =
                chat.patient_id._id === userId
                  ? chat.healthcare_id.isDeleted
                  : chat.patient_id.isDeleted;
              const reportedId =
                chat.patient_id._id === userId
                  ? chat.healthcare_id._id
                  : chat.patient_id._id;
              const profileImage =
                chat.patient_id._id === userId
                  ? chat.healthcare_id.profile_image
                  : chat.patient_id.profile_image;

              return (
                <div key={chat._id} className="flex flex-col items-center relative">
                  {/* Chat avatar with long-press for menu */}
                  <div
                    className={` mt-2 relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-blue-100 to-blue-200 shadow-md transition-transform duration-200 active:scale-95 ${
                      selectedChatId === chat._id ? "ring-2 ring-[#1a73e8] scale-105" : ""
                    }`}
                    onTouchStart={() => handleLongPressStart(chat._id)}
                    onTouchEnd={() => handleLongPressEnd(chat._id)}
                    onTouchCancel={() => handleLongPressEnd(chat._id)}
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={displayName}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/72?text=No+Image")}
                      />
                    ) : (
                      <span
                        className={`text-2xl font-bold text-white ${getAvatarColor(
                          displayName
                        )} rounded-full w-full h-full flex items-center justify-center`}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#e63946] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-2 text-center font-semibold ${
                      isDeleted ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {displayName.split(" ")[0]}
                  </p>
                  {/* Bottom sheet menu for mobile */}
                  {menuOpen === chat._id && (
                    <div
                      ref={menuRef}
                      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 z-50 animate-slide-up max-h-[50vh]"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Chat Options</h3>
                      <button
                        onClick={() => handleReportUser(reportedId)}
                        className="w-full px-4 py-3 mb-2 bg-[#1a73e8] text-white rounded-lg hover:bg-[#1565c0] transition-colors duration-200 font-medium"
                      >
                        Report User
                      </button>
                      <button
                        onClick={() => handleDeleteChat(chat._id)}
                        className="w-full px-4 py-3 mb-2 bg-[#e63946] text-white rounded-lg hover:bg-[#d32f2f] transition-colors duration-200 font-medium"
                      >
                        Delete Chat
                      </button>
                      <button
                        onClick={() => setMenuOpen(null)}
                        className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {/* ReportUser modal */}
                  {reportOpen === reportedId && (
                    <ReportUser
                      userId={userId}
                      reportedId={reportedId}
                      onClose={() => setReportOpen(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render desktop view with dropdown menu
  return (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-3xl shadow-xl p-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {/* Chat list header */}
      <h2 className="text-3xl font-bold text-[#1a73e8] mb-8 tracking-tight">Your Chats</h2>
      {error ? (
        <div className="flex items-center justify-center h-full bg-red-50 rounded-2xl p-6 shadow-md">
          <p className="text-red-600 font-semibold text-lg">{error}</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p className="text-xl font-medium opacity-80">No chats available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => {
            const displayName =
              chat.patient_id._id === userId
                ? chat.healthcare_id.name
                : chat.patient_id.name;
            const isDeleted =
              chat.patient_id._id === userId
                ? chat.healthcare_id.isDeleted
                : chat.patient_id.isDeleted;
            const reportedId =
              chat.patient_id._id === userId
                ? chat.healthcare_id._id
                : chat.patient_id._id;
            const profileImage =
              chat.patient_id._id === userId
                ? chat.healthcare_id.profile_image
                : chat.patient_id.profile_image;

            return (
              <div
                key={chat._id}
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border border-gray-200 shadow-sm hover:shadow-md relative ${
                  selectedChatId === chat._id
                    ? "bg-[#e8f0fe] border-[#1a73e8] scale-[1.01] z-10"
                    : "bg-gradient-to-r from-white to-gray-50"
                }`}
              >
                {/* Chat info and selection */}
                <div
                  className="flex items-center space-x-4 flex-1"
                  onClick={() => handleChatSelect(chat._id)}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/48?text=No+Image")}
                      />
                    ) : (
                      <span
                        className={`text-xl font-bold text-white ${getAvatarColor(
                          displayName
                        )} rounded-full w-full h-full flex items-center justify-center`}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p
                      className={`text-base font-semibold tracking-wide ${
                        isDeleted ? "text-red-600" : "text-blue-800"
                      }`}
                    >
                      {displayName}
                    </p>
                    <p className="text-sm text-gray-600 truncate max-w-[200px] font-medium">
                      {chat.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400">
                      {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="bg-[#e63946] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md animate-pulse">
                    {chat.unreadCount}
                  </span>
                )}
                {/* Dropdown menu for desktop */}
                <div className="relative">
                  <button
                    onClick={() => toggleMenu(chat._id)}
                    className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <HiDotsVertical className="w-5 h-5" />
                  </button>
                  {menuOpen === chat._id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 mt-2 w-48 bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-lg z-100 transition-transform duration-200 scale-100 origin-top-right"
                    >
                      <button
                        onClick={() => handleReportUser(reportedId)}
                        className="cursor-pointer block w-full text-left px-4 py-2 text-sm text-[#1a73e8] hover:bg-[#e8f0fe] hover:text-[#1565c0] rounded-t-xl"
                      >
                        Report User
                      </button>
                      <button
                        onClick={() => handleDeleteChat(chat._id)}
                        className="cursor-pointer block w-full text-left px-4 py-2 text-sm text-[#e63946] hover:bg-[#fee2e2] hover:text-[#d32f2f] rounded-b-xl"
                      >
                        Delete Chat
                      </button>
                    </div>
                  )}
                </div>
                {/* ReportUser modal */}
                {reportOpen === reportedId && (
                  <ReportUser
                    userId={userId}
                    reportedId={reportedId}
                    onClose={() => setReportOpen(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}