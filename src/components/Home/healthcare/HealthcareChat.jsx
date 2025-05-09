/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";
import ellipse8 from "../../../assets/Ellipse 8.png";
import ellipse9 from "../../../assets/Ellipse 9.png";
import ellipse10 from "../../../assets/Ellipse 10.png";
import ellipse11 from "../../../assets/Ellipse 11.png";
import ellipse12 from "../../../assets/Ellipse 12.png";
import chatImage from "../../../assets/m.png";
import vector8 from "../../../assets/LogoLine.svg";

const HealthcareChat = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 1.5, ease: "easeInOut" } 
    },
  };

  const textSectionVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 1.5, ease: "easeInOut", delay: 0.2 } 
    },
  };

  const avatarVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: (index) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 1.2, ease: "easeInOut", delay: 0.5 + index * 0.15 },
    }),
    hover: { 
      scale: 1.2, 
      rotate: 10, 
      transition: { duration: 0.3, ease: "easeInOut" } 
    },
  };

  const imageSectionVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 1.5, ease: "easeInOut", delay: 0.3 } 
    },
    hover: { 
      scale: 1.05, 
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } 
    },
  };

  const medTrackVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 1, ease: "easeInOut", delay: 0.5 } 
    },
  };

  const underlineVariants = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: 1, 
      transition: { duration: 0.8, ease: "easeInOut" } 
    },
    hover: { 
      scaleX: 1.1, 
      transition: { duration: 0.3 } 
    },
  };

  return (
    <div className="w-screen min-h-screen bg-[#E1EEFF] px-4 sm:px-8 md:px-16 flex flex-col items-center justify-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        className="max-w-4xl w-full min-h-[70vh] flex flex-col md:flex-row items-center justify-between rounded-[1.5rem] bg-[#E1EEFF] p-4 sm:p-8 md:p-12"
      >
        {/* Left Side - Text */}
        <motion.div
          variants={textSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="flex-1 text-center md:text-left mb-8 md:mb-0 " 
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            <span className="text-blue-600">Chat</span> with your Patients
          </h1>
          <p className="text-gray-600 mt-4 text-base sm:text-lg max-w-md mx-auto md:mx-0">
            Connect seamlessly with your Patients through secure, real-time messaging. Schedule appointments, share medical updates, all within our trusted platform.
          </p>

          {/* User Avatars */}
          <div className="flex items-center justify-center md:justify-start mt-6 space-x-2">
            {[ellipse8, ellipse10, ellipse11, ellipse9, ellipse12].map((src, index) => (
              <motion.img
                key={index}
                src={src}
                alt={`User ${index + 1}`}
                className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border border-gray-300 shadow-sm"
                custom={index}
                variants={avatarVariants}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: false, amount: 0.3 }}
              />
            ))}
            <p className="font-semibold text-gray-900 pl-4 text-sm sm:text-base">100+ Reviews</p>
          </div>
        </motion.div>

        {/* Right Side - Chat Image */}
        <motion.div
          variants={imageSectionVariants}
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          viewport={{ once: false, amount: 0.3 }}
          className="flex-1 flex justify-center items-start mt-8 md:mt-0"
        >
          <img
            src={chatImage}
            alt="Chat Interface"
            className="w-full max-w-xs sm:max-w-sm md:max-w-md h-[400px] sm:h-[450px] md:h-[500px] rounded-[1.5rem] object-cover shadow-md"
          />
        </motion.div>
      </motion.div>
      
      <motion.div
        variants={medTrackVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        className="pt-12 sm:pt-16 text-center"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-black mb-12 sm:mb-20">
          Choose{" "}
          <motion.span className="relative inline-block">
            Health<span className="text-blue-600">Track</span>
            <motion.img
              src={vector8}
              alt="underline"
              className="absolute left-0 w-full h-auto"
              style={{ bottom: "-15px" }}
              variants={underlineVariants}
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
            />
          </motion.span>
          , choose professionalism
        </h1>
      </motion.div>
    </div>
  );
};

export default HealthcareChat;