import React from "react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  // Array of privacy policy and terms of use
  const terms = [
    {
      title: "Privacy and Data Security",
      description:
        "By creating an account, you agree that your personal and medical data may be processed according to our privacy policy and current security standards.",
    },
    {
      title: "Use of the Website",
      description:
        "You agree to use this website only for legitimate purposes, such as booking medical appointments, viewing your medical file, and communicating with healthcare staff.",
    },
    {
      title: "Accuracy of Information",
      description:
        "You confirm that all information provided during account creation is true and up to date. Giving false information may result in your account being suspended.",
    },
    {
      title: "Access to Medical Records",
      description:
        "You understand that your medical records are shared only with the healthcare professionals involved in your care.",
    },
    {
      title: "Interaction with the AI Chatbot",
      description:
        "The AI chatbot is a support tool. It does not replace a real medical diagnosis or consultation. You agree not to treat its responses as official medical advice.",
    },
    {
      title: "Account Security",
      description:
        "You are responsible for keeping your login information private. If someone uses your account without permission, you must report it immediately.",
    },
    {
      title: "Respect for Medical Staff",
      description:
        "You agree to treat all medical staff with respect and to use the website in a polite and professional way.",
    },
    {
      title: "Changes or Service Termination",
      description:
        "The site administrator has the right to change, pause, or stop services, with prior notice to users when possible.",
    },
    {
      title: "Explicit Consent",
      description:
        "By checking this box, you give clear consent for your personal health data to be processed, in line with current regulations (e.g., GDPR).",
    },
  ];

  return (
    <div className="min-h-screen bg-[#E1EEFF] flex flex-col items-center justify-center px-4 sm:px-8 md:px-16 py-12">
      {/* Logo */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 text-2xl sm:text-3xl font-bold">
        <span className="text-black">Health</span>
        <span className="text-[#4285F4]">Track</span>
      </div>

      {/* Main content */}
      <div className="w-full max-w-4xl bg-white p-6 sm:p-8 md:p-12 rounded-2xl shadow-xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 text-center mb-8">
          Privacy Policy & <span className="text-[#4285F4]">Terms of Use</span>
        </h1>
        {/* Terms list */}
        <div className="space-y-6 text-gray-600">
          {terms.map((term, index) => (
            <div key={index} className="space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {index + 1}. {term.title}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed">{term.description}</p>
            </div>
          ))}
        </div>
        {/* Go back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="cursor-pointer inline-block px-8 py-3 sm:px-10 sm:py-4 bg-[#4285F4] text-white text-base sm:text-lg font-semibold rounded-full shadow-[0_10px_20px_rgba(0,120,255,0.5)] hover:bg-blue-700 hover:shadow-[0_5px_15px_rgba(0,120,255,0.7)] transition duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;