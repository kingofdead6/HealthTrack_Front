/* eslint-disable no-unused-vars */
import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaUserMd, FaChartLine, FaLock } from "react-icons/fa";
import { BsChevronDown } from "react-icons/bs";
import backgroundVideo from "../../../assets/back.mp4";

export default function MedTrackHome() {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);

  const handleGetStarted = () => {
    navigate("/register");
  };

  const handleScrollDown = () => {
    window.scrollTo({
      top: 700 ,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0 "
      >
        <source src={backgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-30 z-10" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
        className="relative z-20 flex flex-col items-center justify-between text-center px-4 py-10 min-h-screen"
      >
        {/* Title */}
        <div className="mt-50 -mb-10 sm:mt-32">
          <div
            className="text-7xl sm:text-8xl md:text-7xl lg:text-8xl dancing-script-mainfont mb-4"
            style={{
              textShadow: `
                0 0 10px rgba(255, 255, 255, 0.8),
                0 0 20px rgba(255, 255, 255, 0.6),
                0 0 30px rgba(255, 255, 255, 0.4),
                0 0 40px rgba(59, 130, 246, 0.3),
                0 0 50px rgba(59, 130, 246, 0.2)
              `,
            }}
          >
            <span className="text-white">Health</span>
            <span className="text-blue-900">Track</span>
          </div>
        </div>

        {/* Get Started Button */}
        <div className="mt-50 my-10 sm:my-14 sm:mt-80">
          <button
            onClick={handleGetStarted}
            className="cursor-pointer bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold py-3 px-8 sm:px-12 rounded-full text-base sm:text-lg transition duration-300 shadow-[0_0_20px_rgba(59,130,246,0.6),_0_0_40px_rgba(59,130,246,0.4)] border border-blue-300 hover:scale-105"
          >
            Get Started
          </button>
        </div>

        {/* Features */}
        <div className="flex flex-row flex-wrap justify-center items-center gap-6 sm:gap-14 text-white mb-20">
          <div className="flex flex-col items-center min-w-[90px]">
            <FaUserMd className="text-3xl sm:text-4xl mb-2 text-blue-400" />
            <span className="font-semibold text-xs sm:text-base">Certified Doctors</span>
          </div>
          <div className="flex flex-col items-center min-w-[90px]">
            <FaChartLine className="text-3xl sm:text-4xl mb-2 text-green-400" />
            <span className="font-semibold text-xs sm:text-base">Real-Time Chat</span>
          </div>
          <div className="flex flex-col items-center min-w-[90px]">
            <FaLock className="text-3xl sm:text-4xl mb-2 text-purple-400" />
            <span className="font-semibold text-xs sm:text-base">Secure & Private</span>
          </div>
        </div>

        {/* Scroll Down Hint */}
        <div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce text-white text-2xl sm:text-3xl cursor-pointer"
          onClick={handleScrollDown}
        >
          <BsChevronDown />
        </div>
      </motion.div>
    </div>
  );
}