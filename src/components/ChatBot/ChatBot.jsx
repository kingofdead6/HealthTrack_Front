/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { FaPaperPlane, FaRobot, FaTimes, FaImage } from 'react-icons/fa';
import { IoMdSend } from 'react-icons/io';
import { BsChatDotsFill } from 'react-icons/bs';
import { API_BASE_URL } from '../../../api';

// Default questions for quick user interaction
const defaultQuestions = [
  "What are the symptoms of diabetes?",
  "How can I manage stress effectively?",
  "Who is the best doctor available?",
  "What specialties do your doctors offer?"
];

// Chatbot component for health-related queries and image analysis
const Chatbot = () => {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState(null);

  // Display initial greeting when chatbot opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialMessage = {
        text: "Hello! I'm your health assistant. Ask me about symptoms, treatments, or upload an image for analysis!",
        isBot: true,
        timestamp: new Date().toISOString()
      };
      setTypingMessage({ ...initialMessage, displayedText: '' });
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingMessage]);

  // Focus textarea when chatbot opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Simulate typing animation for bot responses
  useEffect(() => {
    if (typingMessage) {
      const { text, displayedText } = typingMessage;
      if (displayedText.length < text.length) {
        const timeout = setTimeout(() => {
          setTypingMessage(prev => ({
            ...prev,
            displayedText: text.slice(0, displayedText.length + 1)
          }));
        }, 20);
        return () => clearTimeout(timeout);
      } else {
        setMessages(prev => [...prev, { ...typingMessage, text }]);
        setTypingMessage(null);
      }
    }
  }, [typingMessage]);

  // Handle image selection and validation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        alert('Please upload a valid image (JPEG, PNG, or GIF).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size must be less than 5MB.');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle message/image submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput && !selectedImage) return;

    // Add user message/image to chat
    const userMessage = {
      text: trimmedInput || 'Image uploaded',
      isBot: false,
      image: imagePreview,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    removeImage();
    setIsLoading(true);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('message', trimmedInput);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = {
        text: data.reply,
        isBot: true,
        timestamp: new Date().toISOString(),
        displayedText: ''
      };
      setTypingMessage(botMessage);
    } catch (error) {
      const errorMessage = {
        text: "Sorry, I'm having trouble processing your request. Please try again later.",
        isBot: true,
        timestamp: new Date().toISOString()
      };
      setTypingMessage({ ...errorMessage, displayedText: '' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key for sending messages
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Set input to a default question on click
  const handleDefaultQuestionClick = (question) => {
    setInput(question);
    textareaRef.current?.focus();
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans sm:bottom-6 sm:right-6">
      {/* Custom scrollbar styles */}
      <style>
        {`
          /* Custom scrollbar for WebKit browsers */
          .custom-scrollbar-y::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar-y::-webkit-scrollbar-track {
            background: rgba(209, 213, 219, 0.3); /* Semi-transparent gray */
            border-radius: 4px;
          }
          .custom-scrollbar-y::-webkit-scrollbar-thumb {
            background: #2563eb; /* Blue-600 */
            border-radius: 4px;
            transition: background 0.2s;
          }
          .custom-scrollbar-y::-webkit-scrollbar-thumb:hover {
            background: #1d4ed8; /* Blue-700 */
          }

          .custom-scrollbar-x::-webkit-scrollbar {
            height: 8px;
          }
          .custom-scrollbar-x::-webkit-scrollbar-track {
            background: rgba(209, 213, 219, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar-x::-webkit-scrollbar-thumb {
            background: #2563eb;
            border-radius: 4px;
            transition: background 0.2s;
          }
          .custom-scrollbar-x::-webkit-scrollbar-thumb:hover {
            background: #1d4ed8;
          }

          /* Firefox scrollbar styling */
          .custom-scrollbar-y {
            scrollbar-width: thin;
            scrollbar-color: #2563eb rgba(209, 213, 219, 0.3);
          }
          .custom-scrollbar-x {
            scrollbar-width: thin;
            scrollbar-color: #2563eb rgba(209, 213, 219, 0.3);
          }
        `}
      </style>
      {isOpen ? (
        <div className="w-[90vw] max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] max-h-[600px] sm:w-full sm:max-w-md sm:h-[80vh] transition-all duration-300 md:max-h-[700px]">
          {/* Chat header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FaRobot className="text-xl sm:text-2xl" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Health Assistant</h2>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="cursor-pointer p-2 rounded-full hover:bg-red-700 transition-all duration-200 hover:scale-110 touch-manipulation"
              aria-label="Close chat"
            >
              <FaTimes className="text-base sm:text-lg" />
            </button>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-100/50 touch-pan-y custom-scrollbar-y" style={{ overscrollBehavior: 'contain' }}>
            {messages.map((message, index) => (
              <div 
                key={`${message.timestamp}-${index}`} 
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} mb-3 sm:mb-4`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm ${
                    message.isBot 
                      ? 'bg-white text-gray-800 border border-gray-200' 
                      : 'bg-blue-600 text-white'
                  } transition-all duration-200 text-sm sm:text-base`}
                >
                  {message.image && (
                    <img src={message.image} alt="Uploaded" className="max-w-full h-auto rounded-lg mb-2" />
                  )}
                  <div className="leading-relaxed">{message.text}</div>
                  <div className={`text-xs mt-1 sm:mt-1.5 ${
                    message.isBot ? 'text-gray-500' : 'text-blue-100'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {typingMessage && (
              <div className="flex justify-start mb-3 sm:mb-4">
                <div className="max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm bg-white text-gray-800 border border-gray-200 text-sm sm:text-base">
                  <div className="leading-relaxed">{typingMessage.displayedText}</div>
                  <div className="text-xs mt-1 sm:mt-1.5 text-gray-500">
                    {formatTime(typingMessage.timestamp)}
                  </div>
                </div>
              </div>
            )}
            {isLoading && !typingMessage && (
              <div className="flex justify-start mb-3 sm:mb-4">
                <div className="bg-white text-gray-800 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 shadow-sm">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Default questions */}
          <div className="px-3 py-2 sm:px-4 sm:py-2 bg-white border-t border-gray-200">
            <div className="overflow-x-auto custom-scrollbar-x touch-pan-x">
              <div className="flex gap-2 whitespace-nowrap pb-2">
                {defaultQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleDefaultQuestionClick(question)}
                    className="cursor-pointer px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-all duration-200 flex-shrink-0 touch-manipulation"
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="p-3 mb-3 sm:p-4 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {imagePreview && (
              <div className="relative mb-2">
                <img src={imagePreview} alt="Preview" className="max-w-[100px] h-auto rounded-lg" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="cursor-pointer absolute top-0 right-0 p-1 bg-red-600 text-white rounded-full"
                  aria-label="Remove image"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            )}
            <div className="flex items-end space-x-2 sm:space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
                id="image-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer p-2 sm:p-3 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-all duration-200"
                aria-label="Upload image"
                disabled={isLoading}
              >
                <FaImage className="text-base sm:text-lg" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your health question ..."
                className="flex-1 p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-none transition-all duration-200"
                rows="1"
                style={{ minHeight: '40px', maxHeight: '100px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className={`p-2 sm:p-3 rounded-xl ${
                  (!input.trim() && !selectedImage) || isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                } transition-all duration-200 hover:scale-105 touch-manipulation`}
                aria-label="Send message"
              >
                <IoMdSend className="text-base sm:text-lg" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="cursor-pointer p-4 sm:p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 touch-manipulation"
          aria-label="Open chat"
        >
          <BsChatDotsFill className="text-2xl sm:text-3xl" />
        </button>
      )}
    </div>
  );
};

export default Chatbot;