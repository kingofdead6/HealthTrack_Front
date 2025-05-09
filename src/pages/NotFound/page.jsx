import React from "react";
import { useNavigate } from "react-router-dom"; 
import ErrorImage from "../../assets/ErrorPic.png";

const NotFound = () => {
  const navigate = useNavigate(); 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative px-4">
      {/* Logo */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 text-2xl sm:text-3xl font-bold">
        Health<span className="text-[#0360D9]">Track</span>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center w-full max-w-4xl px-4 py-8 sm:flex-row sm:justify-between sm:items-center sm:px-8 sm:py-12">
        {/* Text section */}
        <div className="max-w-lg text-center sm:text-left mb-8 sm:mb-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-2">Ooops...</h1>
          <p className="text-5xl sm:text-6xl md:text-7xl font-semibold text-gray-600 mt-2 mb-6 sm:mb-10">Page not found</p>
          <p className="text-base sm:text-lg text-gray-500 mt-4 sm:mt-6 mb-6 sm:mb-8 leading-relaxed">
            The page you are looking for does not exist or some other error occurred. Go back to the previous page.
          </p>
          {/* Go back button */}
          <button
            onClick={() => navigate(-1)} 
            className="cursor-pointer inline-block px-8 py-3 sm:px-10 sm:py-4 bg-blue-400 text-white text-base sm:text-xl font-semibold rounded-full shadow-[0_10px_20px_rgba(0,120,255,0.5)] hover:bg-blue-500 hover:shadow-[0_5px_15px_rgba(0,120,255,0.7)] transition duration-300"
          >
            Go back
          </button>
        </div>

        {/* Error image */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-lg sm:w-1/2 sm:ml-8">
          <img src={ErrorImage} alt="404 Illustration" className="w-full h-auto" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;