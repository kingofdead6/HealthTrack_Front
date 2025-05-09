import React, { useRef } from 'react';
import { useNavigate } from "react-router-dom";
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

// Team members data
const teamMembers = [
  {
    name: 'Youcef Kahlouche',
    role: 'Lead Developer',
    description: 'Leader of the development team, overseeing all technical aspects while also contributing full-stack code. Managing task coordination, ensured smooth collaboration between front-end and back-end.',
    image: "/team/YoucefPfp.jpg",
    github: 'https://github.com/kingofdead6'
  },
  {
    name: 'Abdeldjalil Bennefissa',
    role: 'Team Leader',
    description: 'Coordinated the entire project lifecycle, ensuring clear communication, task delegation, and alignment with the team’s goals. Focused on planning, leadership, and delivering a cohesive final product.',
    image: '/team/JalilPfp.png',
    github: 'https://github.com/Abdeldjalil-bfs'
  },
  {
    name: 'Mohammed Islam Benaboud',
    role: 'UI-UX Designer',
    description: 'Designed intuitive and user-friendly interfaces while focusing on user experience. Created responsive mockups and maintained a consistent visual language across all components.',
    image: '/team/IslamPfp.png',
    github: 'https://github.com/eng-Islam-Mohamed'
  },
  {
    name: 'Mohamed Lamine Boulanouar',
    role: 'Front-End Developer',
    description: 'Implemented the visual elements of the application based on design mockups. Ensured a responsive and interactive user experience using modern front-end technologies.',
    image: '/team/MohamedPfp.png',
    github: 'https://github.com/boulanouarmohamed1'
  },
];

const OurTeam = () => {
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  // Slider settings for carousel
  const settings = {
    dots: false,
    infinite: true,
    speed: 5000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: 'linear',
    pauseOnHover: true,
    pauseOnFocus: false,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  // Pause slider on hover
  const handleMouseEnter = () => {
    if (sliderRef.current) {
      sliderRef.current.slickPause();
    }
  };

  // Resume slider on hover leave
  const handleMouseLeave = () => {
    if (sliderRef.current) {
      sliderRef.current.slickPlay();
    }
  };

  // Button animation variants
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
    <div className="min-h-screen bg-[#E1EEFF] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative py-6"
      >
        {/* Logo */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-8 text-3xl font-extrabold tracking-tight">
          <span className="text-black">Health</span>
          <span className="text-[#4285F4]">Track</span>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl sm:text-5xl font-extrabold text-center text-blue-700 mb-16 tracking-tight"
          >
            Meet Our Team
          </motion.h1>
          <div className="relative max-w-6xl mx-auto">
            {/* Gradient overlays for slider */}
            <div
              className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#E1EEFF] to-transparent z-10 hidden lg:block"
            ></div>
            <div
              className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#E1EEFF] to-transparent z-10 hidden lg:block"
            ></div>
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative"
            >
              {/* Team members carousel */}
              <Slider ref={sliderRef} {...settings} className="slick-slider-custom">
                {teamMembers.concat(teamMembers).map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="px-4"
                  >
                    <div className="bg-white rounded-2xl shadow-xl p-8 w-80 min-h-[450px] mx-auto flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_20px_8px_rgba(66,133,244,0.8)] hover:-translate-y-2">
                      <div className="text-center">
                        <a href={member.github} target="_blank" rel="noopener noreferrer">
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-36 h-36 rounded-full mx-auto mb-6 object-cover border-4 border-blue-100 hover:border-[#4285F4] transition duration-300 cursor-pointer"
                          />
                        </a>
                        <h2 className="text-2xl font-bold text-[#4285F4] mb-2">{member.name}</h2>
                        <p className="text-blue-500 font-medium mb-4">{member.role}</p>
                        <p className="text-gray-600 leading-relaxed">{member.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </Slider>
            </div>
          </div>
          {/* Go Back Button */}
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
      </div>

      {/* Custom CSS for slider dots */}
      <style>{`
        .slick-slider-custom .slick-dots li button:before {
          font-size: 12px;
          color: #bfdbfe;
        }
        .slick-slider-custom .slick-dots li.slick-active button:before {
          color: #4285F4;
        }
      `}</style>
    </div>
  );
};

export default OurTeam;