// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import surgery from "../../../assets/surgery.svg";

export default function WhyChooseUs() {
  const points = [
    "You can rate our healthcare services",
    "You can book an appointment online",
    "You can chat with your doctor / nurse",
    "You can track your patient Medical Record",
    "You can ....."
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] } 
    },
  };

  const imageSectionVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.7, ease: [0.6, 0.05, 0.01, 0.9], delay: 0.1 } 
    },
  };

  const textSectionVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.7, ease: [0.6, 0.05, 0.01, 0.9], delay: 0.2 } 
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.6, 0.05, 0.01, 0.9], delay: index * 0.08 },
    }),
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
      className="w-full h-screen flex justify-center items-center bg-[#E1EEFF] overflow-hidden"
    >
      <div className="w-full max-w-screen-xl flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-8">
        <motion.div
          variants={imageSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="w-full md:w-1/2 flex justify-center md:justify-start"
        >
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-lg">
            <img
              src={surgery}
              alt="Healthcare Service"
              className="w-full h-auto object-cover"
            />
          </div>
        </motion.div>

        <motion.div
          variants={textSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="w-full md:w-1/2 pl-0 md:pl-16 mt-10 md:mt-0"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-10">
            Why You Choose Us?
          </h2>

          <ul className="space-y-5">
            {points.map((point, index) => (
              <motion.li
                key={index}
                variants={listItemVariants}
                initial="hidden"
                whileInView="visible"
                custom={index}
                viewport={{ once: false, amount: 0.3 }}
                className="flex items-center text-lg text-gray-700"
              >
                <span className="text-blue-500 mr-3">✓</span>
                {point}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}