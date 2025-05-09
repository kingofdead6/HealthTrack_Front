// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import doctor from "../../../assets/doctor.svg";
import mentalHealth from "../../../assets/MentalHealth.svg";

export default function HealthcareServices() {
  const services = [
    {
      name: "Health Tracking",
      icon: doctor,
      text: "Monitor your health metrics seamlessly with real-time data and personalized insights.",
    },
    {
      name: "E-Prescription",
      icon: mentalHealth,
      text: "Access digital prescriptions instantly, shared securely with your pharmacy.",
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.8, 
        ease: "easeOut", 
        staggerChildren: 0.3 
      } 
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: "easeOut" 
      } 
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: "easeOut" 
      } 
    },
    hover: {
      scale: 1.03,
      boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
      transition: { 
        duration: 0.3, 
        ease: "easeOut" 
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="w-full py-16 px-6 sm:px-12 bg-gradient-to-b from-[#E1EEFF] to-[#D1E4FF] flex justify-center items-center relative overflow-hidden"
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg')]" width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="%2399C2FF" fill-opacity="0.4" fill-rule="evenodd" d="M0 40L40 0H20L0 20zM40 40V20L20 40z"></div>

      <div className="w-full max-w-5xl mx-auto relative z-10">
        {/* Title Animation */}
        <motion.h2
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-12 text-center tracking-tight"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          Our Healthcare Services
        </motion.h2>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: true, amount: 0.3 }}
              className="flex flex-col p-8 bg-white rounded-2xl shadow-lg border border-gray-100 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300"
              role="article"
              aria-labelledby={`service-title-${index}`}
            >
              <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-r from-[#0360D9] to-[#0284C7] rounded-full mb-6">
                <img
                  src={service.icon}
                  alt={`${service.name} icon`}
                  className="w-10 h-10 object-contain invert"
                />
              </div>
              <h3
                id={`service-title-${index}`}
                className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {service.name}
              </h3>
              <p
                className="text-gray-600 text-base sm:text-lg leading-relaxed"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {service.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      </motion.div>
  );
}