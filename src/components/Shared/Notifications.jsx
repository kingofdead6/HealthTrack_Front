/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSocket } from "../../context/SocketContext";
import { API_BASE_URL } from "../../../api";
import { FaBell, FaTrash, FaUndo, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function Notifications({ onNotificationClick }) {
  // State for notifications and UI
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const socket = useSocket();
  const dropdownRef = useRef(null);

  // Fetch notifications and set up socket listeners
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setNotifications(response.data);
      } catch (error) {
        setError("Failed to load notifications");
      }
    };
    fetchNotifications();

    if (socket) {
      socket.on("receive_notification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off("receive_notification");
      }
    };
  }, [socket]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      setError("Failed to mark as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setSuccess("All notifications marked as read");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to mark all as read");
    }
  };

  // Delete a single notification
  const deleteNotification = async (notificationId) => {
    setPendingDelete(notificationId);
    setError(null);
    setSuccess(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const deletedNotification = notifications.find((n) => n._id === notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setSuccess("Notification deleted");
      setTimeout(() => setSuccess(null), 3000);
      setTimeout(() => setPendingDelete(null), 5000);
      return deletedNotification;
    } catch (error) {
      setError("Failed to delete notification");
      setPendingDelete(null);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    setError(null);
    setSuccess(null);
    try {
      await axios.delete(`${API_BASE_URL}/api/notifications/delete-all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setNotifications([]);
      setSuccess("All notifications deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to delete all notifications");
    }
  };

  // Undo deletion of a notification
  const undoDelete = (notification) => {
    if (!notification) return;
    setNotifications((prev) => [notification, ...prev]);
    setPendingDelete(null);
    setSuccess("Notification restored");
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (pendingDelete) return;
    markAsRead(notification._id);
    onNotificationClick(notification);
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <motion.button
        onClick={toggleDropdown}
        className="cursor-pointer relative flex items-center justify-center p-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        whileTap={{ scale: 0.95 }}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed sm:absolute inset-x-0 ml-0 sm:-ml-85 sm:left-0 sm:right-auto top-16 sm:top-12 w-full sm:w-96 max-w-md bg-white shadow-xl rounded-xl p-4 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto z-50 border border-gray-100"
            style={{ WebkitOverflowScrolling: "touch" }}
            role="dialog"
            aria-label="Notifications panel"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {notifications.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={markAllAsRead}
                    className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:underline transition-colors"
                    aria-label="Mark all notifications as read"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={deleteAllNotifications}
                    className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-800 focus:outline-none focus:underline transition-colors"
                    aria-label="Delete all notifications"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Error/Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 text-red-700 p-3 mb-4 rounded-lg text-sm flex items-center gap-2"
                >
                  <FaTrash size={16} />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 text-green-700 p-3 mb-4 rounded-lg text-sm flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <FaCheckCircle size={16} />
                    {success}
                  </div>
                  {pendingDelete && (
                    <button
                      onClick={() => undoDelete(notifications.find((n) => n._id === pendingDelete))}
                      className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:underline flex items-center gap-1"
                      aria-label="Undo delete notification"
                    >
                      <FaUndo size={12} /> Undo
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-500 text-center py-4"
              >
                No notifications
              </motion.p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      notification.read
                        ? "bg-gray-50 hover:bg-gray-100"
                        : "bg-blue-50 hover:bg-blue-100"
                    } ${pendingDelete === notification._id ? "opacity-50" : "cursor-pointer"}`}
                    onClick={() => handleNotificationClick(notification)}
                    onTouchStart={() => handleNotificationClick(notification)}
                    role="button"
                    aria-label={`Notification: ${notification.message}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      className="cursor-pointer p-2 text-red-600 hover:bg-red-100 rounded-full transition-all duration-200"
                      aria-label="Delete notification"
                      disabled={pendingDelete === notification._id}
                    >
                      <FaTrash size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}