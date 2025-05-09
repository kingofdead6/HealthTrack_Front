/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSocket } from "../../context/SocketContext";
import { API_BASE_URL } from "../../../api";
import { HiDotsVertical } from "react-icons/hi";
import ReportUser from "../Shared/ReportUser";

// Displays a list of chats for the user with options to select, delete, or report chats
export default function ChatList({ userId, onChatSelect, selectedChatId }) {
  const [chats, setChats] = useState([]); // Store list of chats
  const [error, setError] = useState(""); // Store error messages
  const [menuOpen, setMenuOpen] = useState(null); // Track open menu for chat options
  const [reportOpen, setReportOpen] = useState(null); // Track open report popup
  const socket = useSocket(); // Access Socket.IO instance
  const menuRef = useRef(null); // Ref to track the menu element

  // Sorts chats by last message time in descending order
  const sortChatsByLastMessageTime = (chatsArray) => {
    return [...chatsArray].sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA; // Sort by latest message first
    });
  };

  // Deletes a chat and updates the chat list
  const handleDeleteChat = async (chatId) => {
    try {
      // Send delete request to API
      await axios.delete(`${API_BASE_URL}/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Authenticate request
        },
      });
      // Remove deleted chat from state
      setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));
      // Deselect chat if it was selected
      if (selectedChatId === chatId) {
        onChatSelect(null);
      }
      setMenuOpen(null); // Close menu
    } catch (error) {
      setError("Failed to delete chat"); // Set error message
    }
  };

  // Handles selecting a chat and marking messages/notifications as read
  const handleChatSelect = (chatId) => {
    onChatSelect(chatId); // Notify parent component of chat selection
    if (socket) {
      // Emit events to mark notifications and messages as read
      socket.emit("mark_notifications_read", { chatId, userId });
      socket.emit("mark_messages_read", { chatId, userId });
    }
    setMenuOpen(null); // Close menu
  };

  // Toggles the options menu for a chat
  const toggleMenu = (chatId) => {
    setMenuOpen(menuOpen === chatId ? null : chatId); // Toggle menu visibility
  };

  // Opens the report user popup
  const handleReportUser = (reportedId) => {
    setReportOpen(reportedId);
    setMenuOpen(null); // Close menu
  };

  // Closes the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null); // Close the menu if click is outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Cleanup listener
    };
  }, []);

  // Fetches chats and sets up socket event listeners
  useEffect(() => {
    // Fetch chats from API
    const fetchChats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/chats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Authenticate request
          },
        });
        setChats(sortChatsByLastMessageTime(response.data)); // Sort and set chats
      } catch (error) {
        setError("Failed to load chats"); // Set error message
      }
    };

    fetchChats();

    if (socket) {
      // Handle new message event
      socket.on("receive_message", (message) => {
        setChats((prevChats) => {
          const chatExists = prevChats.find((chat) => chat._id === message.chat_id);
          const updatedChats = prevChats.map((chat) =>
            chat._id === message.chat_id
              ? {
                  ...chat,
                  lastMessage: message.file_url
                    ? `[${message.file_type === "pdf" ? "PDF" : "Image"}]`
                    : message.content, // Update last message
                  lastMessageTime: message.createdAt, // Update message time
                  unreadCount:
                    message.sender_id._id !== userId
                      ? (chat.unreadCount || 0) + 1 // Increment unread count for non-sender
                      : chat.unreadCount,
                }
              : chat
          );

          if (!chatExists) {
            // Fetch chats if new chat is received
            axios
              .get(`${API_BASE_URL}/api/chats`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              })
              .then((response) => {
                setChats(sortChatsByLastMessageTime(response.data));
              });
            return updatedChats;
          }

          return sortChatsByLastMessageTime(updatedChats); // Sort updated chats
        });
      });

      // Handle new chat creation
      socket.on("new_chat", (newChat) => {
        setChats((prevChats) => {
          if (prevChats.find((chat) => chat._id === newChat._id)) {
            return prevChats; // Skip if chat already exists
          }
          return sortChatsByLastMessageTime([...prevChats, newChat]); // Add and sort new chat
        });
      });

      // Handle chat deletion
      socket.on("chat_deleted", ({ chatId }) => {
        setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId)); // Remove deleted chat
        if (selectedChatId === chatId) {
          onChatSelect(null); // Deselect if deleted chat was selected
        }
      });

      // Handle messages marked as read
      socket.on("messages_read", ({ chatId }) => {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat // Reset unread count
          )
        );
      });

      // Handle notifications marked as read
      socket.on("notifications_read", ({ chatId }) => {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat // Reset unread count
          )
        );
      });
    }

    // Cleanup socket event listeners
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

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-xl p-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
            // Determine display name, deletion status, and reported user ID
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

            return (
              <div
                key={chat._id}
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border border-gray-200 shadow-sm hover:shadow-md relative ${
                  selectedChatId === chat._id
                    ? "bg-[#e8f0fe] border-[#1a73e8] scale-[1.01]"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <div
                  className="flex-1 space-y-2"
                  onClick={() => handleChatSelect(chat._id)}
                >
                  <p
                    className={`text-lg font-semibold tracking-wide ${
                      isDeleted ? "text-red-600" : "text-blue-800"
                    }`}
                  >
                    {displayName}
                  </p>
                  <p className="text-sm text-gray-600 truncate max-w-[250px] font-medium">
                    {chat.lastMessage}
                  </p>
                  <p className="text-xs text-gray-400">
                    {chat.lastMessageTime
                      ? new Date(chat.lastMessageTime).toLocaleString()
                      : ""}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="bg-[#e63946] text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110">
                    {chat.unreadCount}
                  </span>
                )}
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
                      className=" absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                    >
                      <button
                        onClick={() => handleReportUser(reportedId)}
                        className="cursor-pointer block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 rounded-t-xl"
                      >
                        Report User
                      </button>
                      <button
                        onClick={() => handleDeleteChat(chat._id)}
                        className="cursor-pointer block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-b-xl"
                      >
                        Delete Chat
                      </button>
                    </div>
                  )}
                </div>
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