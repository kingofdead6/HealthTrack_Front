/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useSocket } from "../../context/SocketContext";
import { API_BASE_URL } from "../../../api";

// Displays and manages a chat window for sending, editing, and deleting messages
export default function ChatWindow({ chatId, userId }) {
  const [messages, setMessages] = useState([]); // Store chat messages
  const [newMessage, setNewMessage] = useState(""); // Store new message input
  const [file, setFile] = useState(null); // Store selected file
  const [filePreview, setFilePreview] = useState(null); // Store file preview data
  const [uploadProgress, setUploadProgress] = useState(0); // Track file upload progress
  const [loading, setLoading] = useState(false); // Track loading state
  const [error, setError] = useState(""); // Store error messages
  const [replyingTo, setReplyingTo] = useState(null); // Track message being replied to
  const [editingMessage, setEditingMessage] = useState(null); // Track message being edited
  const [editContent, setEditContent] = useState(""); // Store edited message content
  const [menuVisible, setMenuVisible] = useState(null); // Track which message's menu is visible
  const socket = useSocket(); // Access Socket.IO instance
  const messagesEndRef = useRef(null); // Ref to scroll to latest message
  const fileInputRef = useRef(null); // Ref for file input element
  const messageRefs = useRef({}); // Refs for message elements
  const touchTimer = useRef(null); // Ref for long-press timer
  const menuRef = useRef(null); // Ref for dropdown menu

  // Fetches messages and sets up socket event listeners
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setMessages(response.data);
      } catch (error) {
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    if (socket) {
      socket.emit("join_chat", chatId);

      const handleReceiveMessage = (message) => {
        if (message.chat_id === chatId) {
          setMessages((prev) => {
            if (prev.some((msg) => msg._id === message._id || msg.tempId === message.tempId)) {
              return prev.map((msg) =>
                msg.tempId === message.tempId ? { ...message, isNew: true } : msg
              );
            }
            return [...prev, { ...message, isNew: true }];
          });

          if (message.sender_id?._id !== userId) {
            socket.emit("mark_messages_seen", { chatId, userId });
          }
        }
      };

      const handleMessageUpdated = (updatedMessage) => {
        if (updatedMessage.chat_id === chatId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === updatedMessage._id ? { ...updatedMessage, isNew: false } : msg
            )
          );
        }
      };

      const handleMessageDeleted = (deletedMessage) => {
        if (deletedMessage.chat_id === chatId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === deletedMessage._id
                ? {
                    ...msg,
                    content: "This message was deleted",
                    isDeleted: true,
                    file_url: null,
                    thumbnail_url: null,
                    file_type: null,
                    isNew: false,
                  }
                : msg
            )
          );
        }
      };

      const handleMessageSeen = ({ messageId, userId: seenUserId }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, seenBy: [...(msg.seenBy || []), seenUserId] }
              : msg
          )
        );
      };

      socket.on("receive_message", handleReceiveMessage);
      socket.on("message_updated", handleMessageUpdated);
      socket.on("message_deleted", handleMessageDeleted);
      socket.on("message_seen", handleMessageSeen);
      socket.emit("mark_messages_seen", { chatId, userId });

      return () => {
        socket.off("receive_message", handleReceiveMessage);
        socket.off("message_updated", handleMessageUpdated);
        socket.off("message_deleted", handleMessageDeleted);
        socket.off("message_seen", handleMessageSeen);
      };
    }
  }, [chatId, socket, userId]);

  // Scrolls to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handles clicks outside the dropdown menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuVisible(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handles file selection and validation
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please select a JPEG, PNG, or PDF file");
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }
      setFile(selectedFile);
      setFilePreview({
        url: URL.createObjectURL(selectedFile),
        type: selectedFile.type,
        name: selectedFile.name,
      });
      setError("");
    }
  };

  // Removes the selected file
  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  // Sends a new message with optional file and reply
  const handleSendMessage = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newMessage.trim() && !file && !replyingTo) {
      return;
    }

    if (replyingTo && (!replyingTo._id || messages.every((msg) => msg._id !== replyingTo._id))) {
      setError("Cannot reply to an invalid or deleted message");
      setReplyingTo(null);
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      let optimisticMessage = {
        _id: tempId,
        chat_id: chatId,
        sender_id: { _id: userId, name: "You" },
        content: newMessage || null,
        file_url: file ? URL.createObjectURL(file) : null,
        thumbnail_url: file ? URL.createObjectURL(file) : null,
        file_type: file ? (file.type === "application/pdf" ? "pdf" : "image") : null,
        createdAt: new Date().toISOString(),
        tempId,
        isNew: true,
        replyTo: replyingTo ? { _id: replyingTo._id, content: replyingTo.content || "[Media]", sender_id: replyingTo.sender_id } : null,
        seenBy: [userId],
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      const formData = new FormData();
      if (newMessage.trim()) {
        formData.append("content", newMessage);
      }
      if (file) {
        formData.append("file", file);
      }
      formData.append("tempId", tempId);
      if (replyingTo) {
        formData.append("replyTo", replyingTo._id);
      }

      const response = await axios.post(`${API_BASE_URL}/api/chats/${chatId}/message`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...response.data.message, isNew: true } : msg
        )
      );

      setNewMessage("");
      setFile(null);
      setFilePreview(null);
      setReplyingTo(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } catch (error) {
      setError(
        error.response?.status === 404
          ? "Chat not found. Please try again."
          : `Failed to send message: ${error.response?.data?.message || error.message}`
      );
      setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
    } finally {
      setLoading(false);
    }
  };

  // Edits an existing message
  const handleEditMessage = useCallback(async (messageId) => {
    if (!editContent.trim()) {
      setEditingMessage(null);
      setEditContent("");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/chats/${chatId}/messages/${messageId}`,
        { content: editContent },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const updatedMessage = response.data.message;
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, ...updatedMessage, isNew: false } : msg
        )
      );

      if (socket) {
        socket.emit("update_message", { chatId, message: updatedMessage });
      }

      setEditingMessage(null);
      setEditContent("");
      setMenuVisible(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage || "Failed to edit message");
    } finally {
      setLoading(false);
    }
  }, [chatId, editContent, socket]);

  // Deletes a message with confirmation
  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!messageId || !messages.find((msg) => msg._id === messageId)) {
      setError("Invalid message selected");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      // Optimistically update the UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                content: "This message was deleted",
                isDeleted: true,
                file_url: null,
                thumbnail_url: null,
                file_type: null,
                isNew: false,
              }
            : msg
        )
      );

      // Perform the deletion on the server
      await axios.delete(`${API_BASE_URL}/api/chats/${chatId}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Emit socket event to notify other clients
      if (socket) {
        socket.emit("delete_message", {
          chat_id: chatId,
          _id: messageId,
          content: "This message was deleted",
          isDeleted: true,
          file_url: null,
          thumbnail_url: null,
          file_type: null,
        });
      }

      setMenuVisible(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage || "Failed to delete message");
      // Revert optimistic update on error
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, ...originalMessage, isDeleted: false }
            : msg
        )
      );
    }
  }, [chatId, socket, messages]);

  // Sets up a reply to a message
  const handleReply = (message) => {
    if (!message._id || message.isDeleted) {
      setError("Cannot reply to a deleted or invalid message");
      return;
    }
    setReplyingTo(message);
    document.querySelector("input[type='text']")?.focus();
    setMenuVisible(null);
  };

  // Scrolls to a specific message with highlight
  const handleJumpToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("highlight-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-message");
      }, 2000);
    }
  };

  // Downloads a PDF file
  const handleDownloadPDF = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "PDF not found."
            : `Failed to download PDF: ${response.statusText}`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error.message);
    }
  };

  // Handles long press on mobile
  const handleTouchStart = (messageId) => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => {
      setMenuVisible(messageId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
  };

  // Renders message content with reply, edit, or file details
  const renderMessageContent = (message) => {
    const isEditing = editingMessage?._id === message._id;

    return (
      <div className="flex flex-col gap-2">
        {message.replyTo?._id && (
          <div
            className="bg-gray-100/80 text-gray-600 p-2 rounded-lg text-xs cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={() => handleJumpToMessage(message.replyTo._id)}
          >
            <p className="truncate">
              {message.replyTo.isDeleted
                ? "[Deleted Message]"
                : message.replyTo.content
                ? message.replyTo.content
                : message.replyTo.file_url
                ? `[${message.replyTo.file_type === "pdf" ? "PDF" : "Image"}]`
                : "[Media]"}
            </p>
          </div>
        )}
        {message.isDeleted ? (
          <p className="text-sm italic text-gray-900">This message was deleted</p>
        ) : (
          <>
            {message.isEdited && !isEditing && (
              <p className="text-xs text-gray-900 italic mb-1">(Edited)</p>
            )}
            {message.file_url ? (
              <div className="relative">
                {message.file_type === "pdf" ? (
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                      <svg
                        className="w-6 h-6 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-gray-700 truncate max-w-xs">
                        {`document-${message._id}.pdf`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadPDF(message.file_url, `document-${message._id}.pdf`)}
                      className="cursor-pointer flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m-9 3V5a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2z"
                        />
                      </svg>
                      Download
                    </button>
                  </div>
                ) : (
                  <img
                    src={
                      message.tempId && message.file_url?.startsWith("blob:")
                        ? message.file_url
                        : message.thumbnail_url || message.file_url
                    }
                    alt="Shared image"
                    className="max-w-[200px] sm:max-w-[250px] rounded-lg shadow-sm"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/200x200?text=Image+Not+Found";
                    }}
                  />
                )}
              </div>
            ) : isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white shadow-sm text-black"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditMessage(message._id)}
                    className="cursor-pointer px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingMessage(null);
                      setEditContent("");
                    }}
                    className="cursor-pointer px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{message.content}</p>
            )}
          </>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 rounded-xl p-6">
        <p className="text-red-600 font-medium text-lg">{error}</p>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl p-6">
        <p className="text-gray-600 text-lg font-medium animate-pulse">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-white rounded-xl shadow-2xl p-4 sm:p-6">
      <style>
        {`
          .message-enter {
            opacity: 0;
            transform: translateY(20px);
          }
          .message-enter-active {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 300ms ease-out, transform 300ms ease-out;
          }
          .progress-bar {
            height: 6px;
            background: linear-gradient(to right, #3b82f6, #60a5fa);
            border-radius: 3px;
            transition: width 0.3s ease-in-out;
          }
          .highlight-message {
            animation: highlight 2s ease-out;
            background-color: #e0f2fe;
          }
          @keyframes highlight {
            0% { background-color: #bfdbfe; }
            100% { background-color: transparent; }
          }
          .swipe-reply {
            transition: transform 0.3s ease-out;
          }
          .swipe-reply.replying {
            transform: translateX(50px);
          }
          .fade-in {
            animation: fadeIn 300ms ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .avatar {
            background: linear-gradient(135deg, #60a5fa, #3b82f6);
          }
          .dropdown-menu {
            animation: slideIn 0.2s ease-out;
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <div className="flex-1 overflow-y-auto mb-4 sm:mb-6 space-y-4 px-2 sm:px-4">
        {messages.map((message) => (
          <div
            key={message._id || message.tempId}
            ref={(el) => (messageRefs.current[message._id || message.tempId] = el)}
            className={`flex swipe-reply ${
              message.sender_id._id === userId ? "justify-end" : "justify-start"
            } ${message.isNew ? "message-enter message-enter-active" : ""}`}
            onTouchStart={(e) => {
              if (message.sender_id._id === userId && !message.isDeleted) {
                handleTouchStart(message._id, e);
              }
              const startX = e.touches[0].clientX;
              let isSwiping = false;
              const handleTouchMove = (moveEvent) => {
                const deltaX = moveEvent.touches[0].clientX - startX;
                if (deltaX > 50 && !isSwiping) {
                  isSwiping = true;
                  const element = messageRefs.current[message._id || message.tempId];
                  if (element) {
                    element.classList.add("replying");
                    setTimeout(() => element.classList.remove("replying"), 300);
                  }
                  handleReply(message);
                  document.removeEventListener("touchmove", handleTouchMove);
                }
              };
              document.addEventListener("touchmove", handleTouchMove);
              document.addEventListener(
                "touchend",
                () => {
                  document.removeEventListener("touchmove", handleTouchMove);
                  handleTouchEnd();
                },
                { once: true }
              );
            }}
            onTouchCancel={handleTouchEnd}
          >
            <div
              className={`flex items-start gap-3 max-w-[80%] sm:max-w-[65%] p-4 rounded-2xl shadow-md relative group ${
                message.sender_id._id === userId
                  ? "bg-gradient-to-r from-blue-500 to-blue-900 text-white"
                  : "bg-gray-50 text-gray-800 border border-gray-200"
              }`}
            >
              <div className="w-8 h-8 rounded-full avatar flex items-center justify-center text-white font-semibold text-sm">
                {message.sender_id.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold mb-2">{message.sender_id.name || "Unknown User"}</p>
                {renderMessageContent(message)}
                <div className="flex items-center gap-2 mt-2 justify-between">
                  <p className="text-xs opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {message.sender_id._id === userId && !message.isDeleted && (
                    <div className="flex items-center gap-1 ml-20">
                      {message.seenBy?.length === 1 && (
                        <svg
                          className="w-3 h-3 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {message.seenBy?.length > 1 && (
                        <div className="flex">
                          <svg
                            className="w-3 h-3 text-blue-300 -mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <svg
                            className="w-3 h-3 text-blue-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {message.sender_id._id === userId && !message.isDeleted && message._id && (
                <div className="absolute top-2 right-2" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent propagation to avoid reporting.js interference
                      setMenuVisible(menuVisible === message._id ? null : message._id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Stop mousedown to avoid reporting.js error
                    className="cursor-pointer p-1 text-gray-200 hover:text-white rounded-full"
                    aria-label="Message options"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                  {menuVisible === message._id && (
                    <div className="absolute right-4 bottom-4 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 z-10 dropdown-menu">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReply(message);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="cursor-pointer flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                          />
                        </svg>
                        Reply
                      </button>
                      {message.content && !message.file_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMessage(message);
                            setEditContent(message.content || "");
                            setMenuVisible(null);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="cursor-pointer flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                          </svg>
                          Edit
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(message._id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="cursor-pointer flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!message.isDeleted && (
                <button
                  onClick={() => handleReply(message)}
                  className="cursor-pointer absolute bottom-2 right-2 p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 rounded-full transition-all"
                  aria-label="Reply to message"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {replyingTo && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg flex items-center gap-3 animate-slide-up fade-in">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-700">Replying to</p>
            <p
              className="text-xs text-gray-500 truncate cursor-pointer hover:underline"
              onClick={() => handleJumpToMessage(replyingTo._id)}
            >
              {replyingTo.content || (replyingTo.file_url ? `[${replyingTo.file_type === "pdf" ? "PDF" : "Image"}]` : "[Media]")}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="cursor-pointer p-1 text-red-500 hover:text-red-600 rounded-full"
            aria-label="Cancel reply"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
      {filePreview && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg flex items-center gap-3 animate-slide-up fade-in">
          {filePreview.type === "application/pdf" ? (
            <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-gray-700 truncate max-w-xs">{filePreview.name}</p>
            </div>
          ) : (
            <img
              src={filePreview.url}
              alt="File preview"
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md shadow-sm"
            />
          )}
          <div className="flex-1 text-sm text-gray-700 truncate">{filePreview.name}</div>
          <button
            onClick={handleRemoveFile}
            className="cursor-pointer px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors text-sm"
          >
            Remove
          </button>
        </div>
      )}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-4 animate-slide-up fade-in">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
        </div>
      )}
      <form
        onSubmit={handleSendMessage}
        className="flex flex-col sm:flex-row gap-3 border-t border-gray-200 pt-4"
      >
        <div className="flex flex-1 items-center gap-2 sm:gap-3 bg-gray-50 rounded-full px-4 py-2 shadow-sm">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder-gray-500"
            disabled={loading}
          />
          <label className="flex items-center cursor-pointer">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              disabled={loading}
            />
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600 hover:text-blue-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828V15m0 0v6a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2h12a2 2 0 012 2v6z"
              />
            </svg>
          </label>
        </div>
        <button
          type="submit"
          className="cursor-pointer px-5 py-2 sm:px-7 sm:py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-sm"
          disabled={loading || uploadProgress > 0}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}