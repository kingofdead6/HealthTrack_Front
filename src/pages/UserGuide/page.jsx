/* eslint-disable no-unused-vars */
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PatientGuide from "/userGuide/guidepatient.mov"; 
import HealthCareGuide from "/userGuide/guidehealthcare.mov"; 

export default function UserGuide() {
  const navigate = useNavigate();
  // Video refs for controlling playback
  const doctorVideoRef = useRef(null);
  const patientVideoRef = useRef(null);
  const popupVideoRef = useRef(null);
  // State for video playback status
  const [doctorPlaying, setDoctorPlaying] = useState(true);
  const [patientPlaying, setPatientPlaying] = useState(true);
  const [popupVideo, setPopupVideo] = useState(null);
  const [popupPlaying, setPopupPlaying] = useState(true);

  // Set video playback speed on mount
  useEffect(() => {
    if (doctorVideoRef.current) {
      doctorVideoRef.current.playbackRate = 0.8;
    }
    if (patientVideoRef.current) {
      patientVideoRef.current.playbackRate = 0.8;
    }
  }, []);

  // Sync popup video with source video
  useEffect(() => {
    if (popupVideo && popupVideoRef.current) {
      const sourceVideo = popupVideo === "doctor" ? doctorVideoRef.current : patientVideoRef.current;
      popupVideoRef.current.playbackRate = 0.8;
      popupVideoRef.current.currentTime = sourceVideo.currentTime;
      const isPlaying = popupVideo === "doctor" ? doctorPlaying : patientPlaying;
      setPopupPlaying(isPlaying);
      if (isPlaying) {
        popupVideoRef.current.play().catch(() => setPopupPlaying(false));
      } else {
        popupVideoRef.current.pause();
      }
    }
  }, [popupVideo, doctorPlaying, patientPlaying]);

  // Toggle doctor video play/pause
  const toggleDoctorVideo = () => {
    const video = doctorVideoRef.current;
    if (video) {
      if (doctorPlaying) {
        video.pause();
        setDoctorPlaying(false);
      } else {
        video.play().catch(() => setDoctorPlaying(false));
        setDoctorPlaying(true);
      }
    }
  };

  // Toggle patient video play/pause
  const togglePatientVideo = () => {
    const video = patientVideoRef.current;
    if (video) {
      if (patientPlaying) {
        video.pause();
        setPatientPlaying(false);
      } else {
        video.play().catch(() => setPatientPlaying(false));
        setPatientPlaying(true);
      }
    }
  };

  // Open video popup
  const openPopup = (videoType) => {
    const sourceVideo = videoType === "doctor" ? doctorVideoRef.current : patientVideoRef.current;
    sourceVideo.pause();
    setPopupVideo(videoType);
  };

  // Close video popup and sync playback
  const closePopup = () => {
    if (popupVideo && popupVideoRef.current) {
      const sourceVideo = popupVideo === "doctor" ? doctorVideoRef.current : patientVideoRef.current;
      sourceVideo.currentTime = popupVideoRef.current.currentTime;
      if (popupPlaying) {
        sourceVideo.play().catch(() => {
          if (popupVideo === "doctor") setDoctorPlaying(false);
          else setPatientPlaying(false);
        });
        if (popupVideo === "doctor") setDoctorPlaying(true);
        else setPatientPlaying(true);
      } else {
        sourceVideo.pause();
        if (popupVideo === "doctor") setDoctorPlaying(false);
        else setPatientPlaying(false);
      }
    }
    setPopupVideo(null);
  };

  // Toggle popup video play/pause
  const togglePopupVideo = () => {
    if (popupVideoRef.current) {
      if (popupPlaying) {
        popupVideoRef.current.pause();
        setPopupPlaying(false);
      } else {
        popupVideoRef.current.play().catch(() => setPopupPlaying(false));
        setPopupPlaying(true);
      }
    }
  };

  // Animation variants for buttons
  const buttonVariants = {
    initial: { opacity: 0, y: 50, scale: 0.8 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.6 }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 15px 30px rgba(0,120,255,0.7), 0 5px 15px rgba(0,120,255,0.5)"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-900 dancing-script-mainfont">
          HealthTrack User Guide
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Learn how to use HealthTrack with our step-by-step video guides for doctors and patients.
        </p>
      </motion.header>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Doctor guide section */}
          <motion.section
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative bg-white rounded-2xl shadow-xl overflow-hidden hover-scale"
          >
            <div className="relative">
              <video
                ref={doctorVideoRef}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-64 sm:h-80 lg:h-96 object-cover cursor-pointer"
                onClick={() => openPopup("doctor")}
              >
                <source src={HealthCareGuide} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {!doctorPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4v16l12-8z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-blue-900 mb-4">
                Doctor's Guide
              </h2>
              <p className="text-gray-600 text-base sm:text-lg">
                Discover how to manage appointments, communicate with patients, and access medical records efficiently with HealthTrack.
              </p>
            </div>
          </motion.section>

          {/* Patient guide section */}
          <motion.section
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative bg-white rounded-2xl shadow-xl overflow-hidden hover-scale"
          >
            <div className="relative">
              <video
                ref={patientVideoRef}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-64 sm:h-80 lg:h-96 object-cover cursor-pointer"
                onClick={() => openPopup("patient")}
              >
                <source src={PatientGuide} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {!patientPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4v16l12-8z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-blue-900 mb-4">
                Patient's Guide
              </h2>
              <p className="text-gray-600 text-base sm:text-lg">
                Learn how to book appointments, message your doctor, and manage your health records seamlessly with HealthTrack.
              </p>
            </div>
          </motion.section>
        </div>

        {/* Go back button */}
        <div className="mt-8 text-center">
          <motion.button
            variants={buttonVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            onClick={() => navigate(-1)}
            className="cursor-pointer inline-block px-8 py-3 sm:px-10 sm:py-4 bg-[#4285F4] text-white text-base sm:text-lg font-semibold rounded-full shadow-[0_10px_20px_rgba(0,120,255,0.5),0_5px_10px_rgba(0,120,255,0.3)]"
          >
            Go Back
          </motion.button>
        </div>
      </div>

      {/* Video popup */}
      {popupVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-[#00000057] backdrop-blur-lg flex items-center justify-center z-50"
          onClick={closePopup}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 sm:mx-6 lg:mx-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePopup}
              className="cursor-pointer absolute top-4 right-4 bg-white rounded-full p-2 text-gray-600 hover:text-red-500 transition-colors z-10 shadow-md"
              aria-label="Close video popup"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative">
              <video
                ref={popupVideoRef}
                loop
                muted
                playsInline
                className="w-full h-auto max-h-[80vh] object-contain rounded-t-2xl"
              >
                <source src={popupVideo === "doctor" ? HealthCareGuide : PatientGuide} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {!popupPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0000008e] transition-opacity">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4v16l12-8z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-blue-900">
                {popupVideo === "doctor" ? "Doctor's Guide" : "Patient's Guide"}
              </h3>
              <button
                onClick={togglePopupVideo}
                className="cursor-pointer bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-colors shadow-md"
                aria-label={popupPlaying ? "Pause video" : "Play video"}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  {popupPlaying ? (
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  ) : (
                    <path d="M6 4v16l12-8z" />
                  )}
                </svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Custom styles */}
      <style>
        {`
          .dancing-script-mainfont {
            font-family: 'Dancing Script', cursive;
          }
          .hover-scale {
            transition: transform 0.3s ease;
          }
          .hover-scale:hover {
            transform: scale(1.02);
          }
        `}
      </style>
    </div>
  );
}