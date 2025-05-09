// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import ellipse12 from "../../../assets/Ellipse 12.png";
import ellipse11 from "../../../assets/Ellipse 11.png";
import ellipse9 from "../../../assets/Ellipse 9.png";
import ellipse10 from "../../../assets/Ellipse 10.png";
import ellipse8 from "../../../assets/Ellipse 8.png";

export default function HealthcareReviews() {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] } 
    },
  };

  const leftSectionVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.7, ease: [0.6, 0.05, 0.01, 0.9], delay: 0.1 } 
    },
  };

  const avatarContainerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.6, ease: [0.6, 0.05, 0.01, 0.9], delay: 0.2 } 
    },
  };

  const avatarVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: (index) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: [0.6, 0.05, 0.01, 0.9], delay: 0.3 + index * 0.1 },
    }),
    hover: { 
      scale: 1.2, 
      transition: { duration: 0.2, ease: "easeInOut" } 
    },
  };

  const reviewCardVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.7, ease: [0.6, 0.05, 0.01, 0.9], delay: 0.2 } 
    },
    hover: {
      backgroundColor: "#E1EEFF",
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
  };

  // Updated Review data
  const reviews = [
    {
      name: "Jane Cooper",
      date: "12/4/23",
      rating: "8.5",
      text: "The doctors were incredibly responsive and thorough. The platform made it easy to communicate my symptoms and get timely advice.",
      avatar: ellipse10,
    },
    {
      name: "John Doe",
      date: "15/6/23",
      rating: "9.0",
      text: "Excellent service! Scheduling appointments and accessing my medical records has never been easier. Highly recommend!",
      avatar: ellipse9,
    },
    {
      name: "Alice Smith",
      date: "20/9/23",
      rating: "7.8",
      text: "Great experience overall, but the chat response time could be faster during peak hours. Still very reliable.",
      avatar: ellipse11,
    },
    {
      name: "Bob Johnson",
      date: "10/1/24",
      rating: "8.9",
      text: "Very professional staff and a user-friendly interface. I feel confident managing my healthcare needs here.",
      avatar: ellipse8,
    },
  ];

  const reviewSliderVariants = {
    animate: {
      y: [0, -120, -240, -360, 0], 
      transition: {
        y: { repeat: Infinity, duration: 8, ease: "linear" },
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
      className="w-screen min-h-screen flex justify-center items-center px-4 sm:px-8 md:px-16 py-12 sm:py-16 bg-white overflow-hidden"
    >
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Section */}
        <motion.div
          variants={leftSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          className="flex flex-col justify-center text-center md:text-left"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            <span className="text-[#0360D9]">Rate</span> our healthcare services
          </h2>
          <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed max-w-md mx-auto md:mx-0">
            Your feedback helps us improve! Share your experience with our secure, user-friendly platform designed to connect you with trusted healthcare professionals.
          </p>
          <div className="flex items-center justify-center md:justify-start">
            <motion.div
              variants={avatarContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              className="flex items-center"
            >
              {[ellipse12, ellipse11, ellipse9, ellipse10, ellipse8].map((src, index) => (
                <motion.img
                  key={index}
                  src={src}
                  alt="User avatar"
                  className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 border-white ${index > 0 ? "-ml-2" : ""}`}
                  custom={index}
                  variants={avatarVariants}
                  initial="hidden"
                  whileInView="visible"
                  whileHover="hover"
                  viewport={{ once: false, amount: 0.2 }}
                />
              ))}
            </motion.div>
            <p className="font-medium text-gray-900 pl-4 text-sm sm:text-base">
              100+ Reviews
            </p>
          </div>
        </motion.div>

        {/* Review Card with Sliding Reviews */}
        <motion.div
          variants={reviewCardVariants}
          initial="hidden"
          whileInView="visible"
          whileHover="hover"
          viewport={{ once: false, amount: 0.2 }}
          className="p-4 bg-white rounded-2xl h-[280px] overflow-hidden relative border border-gray-200"
        >
          <motion.div
            variants={reviewSliderVariants}
            animate="animate"
            className="absolute top-0 left-0 w-full"
          >
            {reviews.map((review, index) => (
              <div key={index} className="p-4 w-full h-[120px]">
                <div className="flex items-center mb-3">
                  <motion.img
                    src={review.avatar}
                    alt={review.name}
                    className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 border-white"
                    whileHover={{ scale: 1.1, transition: { duration: 0.3, ease: "easeInOut" } }}
                  />
                  <div className="ml-3">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">{review.name}</h3>
                    <p className="text-xs text-gray-500">{review.date}</p>
                  </div>
                  <motion.p
                    className="ml-auto text-sm sm:text-base font-semibold text-[#0360D9] group-hover:text-white"
                    whileHover={{ color: "#ffffff", transition: { duration: 0.4, ease: "easeInOut" } }}
                  >
                    {review.rating}
                    <span className="text-gray-900 font-medium group-hover:text-white"> / 10</span>
                  </motion.p>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed group-hover:text-gray-700">
                  {review.text}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}