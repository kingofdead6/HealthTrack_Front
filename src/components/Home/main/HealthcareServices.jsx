// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import doctor from "../../../assets/doctor.svg";
import microscope from "../../../assets/Microscope.svg";
import pharmacist from "../../../assets/Pharmacist.svg";
import mentalHealth from "../../../assets/MentalHealth.svg";

export default function HealthcareServices() {
  const services = [
    { 
      name: "Doctors", 
      icon: doctor, 
      text: "Get access to certified medical doctors for online or in-person consultations. Book appointments and follow your treatment plan with ease." 
    },
    { 
      name: "Nurse", 
      icon: mentalHealth, 
      text: "Qualified nurses available for home visits, follow-up care, or online support. Personalized and compassionate assistance at your convenience." 
    },
    { 
      name: "Pharmacies", 
      icon: pharmacist, 
      text: "Easily locate nearby pharmacies, send prescriptions, and get notified when your medication is ready. Fast and secure service." 
    },
    { 
      name: "Labs", 
      icon: microscope, 
      text: "Find trusted medical labs for your tests. View your results directly on your profile and share them with your doctor securely." 
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.7, ease: [0.6, 0.05, 0.01, 0.9] } 
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.6, ease: [0.6, 0.05, 0.01, 0.9] } 
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.6, 0.05, 0.01, 0.9], delay: index * 0.08 },
    }),
    hover: {
      backgroundColor: "#0360D9",
      color: "#ffffff",
      transition: { duration: 0.2, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
      className="w-screen min-h-screen flex justify-center items-center px-6 sm:px-16 bg-[#ffffff] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="text-4xl font-bold text-gray-900 mb-6 text-start"
        >
          Our Healthcare Services
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: false, amount: 0.3 }}
              className="flex flex-col p-6 border-2 border-black rounded-xl bg-white group"
            >
              <div className="w-16 h-16 flex items-center justify-center bg-[#E1EEFF] rounded-full mb-4 transition-all duration-300 ease-in-out group-hover:bg-white">
                <img
                  src={service.icon}
                  alt={service.name}
                  className="w-8 h-8 object-contain transition-all duration-300"
                />
              </div>
              <h3 className="text-xl font-bold mb-2 transition-colors duration-300 ease-in-out group-hover:text-white">
                {service.name}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed transition-colors duration-300 ease-in-out group-hover:text-white">
                {service.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}