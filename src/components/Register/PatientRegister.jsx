/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import patient from "../../assets/patient.svg";
import { IoArrowBack } from "react-icons/io5";
import { API_BASE_URL } from "../../../api";

export default function PatientRegister() {
  // State for form data and UI controls
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const { state } = useLocation();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone_number") {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "") });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle terms checkbox change
  const handleTermsChange = (e) => {
    setTermsAccepted(e.target.checked);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone_number", formData.phone_number);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("user_type", state?.userType || "patient");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/login");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error: Could not reach the server. Is it running?");
    }
  };

  // Check if form is complete and terms are accepted
  const isFormComplete = Object.values(formData).every(
    (value) => value !== null && value !== "" && value !== undefined
  ) && termsAccepted;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mx-12 mt-16">
      {/* Terms and Conditions Popup */}
      {showTermsPopup && (
        <div className="fixed inset-0 bg-[#000000c1] backdrop-blur-xl flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl max-w-lg max-h-[80vh] overflow-y-auto shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Terms of Use</h2>
            <div className="text-gray-600 space-y-4">
              <p>
                <strong>1. Privacy and Data Security:</strong> By creating an account, you agree that your personal and medical data may be processed according to our privacy policy and current security standards.
              </p>
              <p>
                <strong>2. Use of the Website:</strong> You agree to use this website only for legitimate purposes, such as booking medical appointments, viewing your medical file, and communicating with healthcare staff.
              </p>
              <p>
                <strong>3. Accuracy of Information:</strong> You confirm that all information provided during account creation is true and up to date. Giving false information may result in your account being suspended.
              </p>
              <p>
                <strong>4. Access to Medical Records:</strong> You understand that your medical records are shared only with the healthcare professionals involved in your care.
              </p>
              <p>
                <strong>5. Interaction with the AI Chatbot:</strong> The AI chatbot is a support tool. It does not replace a real medical diagnosis or consultation. You agree not to treat its responses as official medical advice.
              </p>
              <p>
                <strong>6. Account Security:</strong> You are responsible for keeping your login information private. If someone uses your account without permission, you must report it immediately.
              </p>
              <p>
                <strong>7. Respect for Medical Staff:</strong> You agree to treat all medical staff with respect and to use the website in a polite and professional way.
              </p>
              <p>
                <strong>8. Changes or Service Termination:</strong> The site administrator has the right to change, pause, or stop services, with prior notice to users when possible.
              </p>
              <p>
                <strong>9. Explicit Consent:</strong> By checking this box, you give clear consent for your personal health data to be processed, in line with current regulations (e.g., GDPR).
              </p>
            </div>
            {/* Close terms popup button */}
            <button
              onClick={() => setShowTermsPopup(false)}
              className="cursor-pointer mt-6 w-full bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Back Arrow Button */}
      <a
        href="/register"
        className="absolute top-1/6 left-1/15 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-300 ease-in-out"
        title="Go back"
      >
        <IoArrowBack size={24} />
      </a>
      <div className="w-full max-w-5xl pt-6 pb-6 flex flex-col md:flex-row">
        {/* Left Section (Decorative) */}
        <div className="hidden md:flex md:w-1/2 bg-blue-200 p-6 rounded-r-4xl rounded-l-4xl mr-6">
          <div className="flex flex-col items-center w-full">
            <h2 className="text-4xl font-bold pt-10 text-black mb-4">
              Register as a <span className="text-blue-800">Patient</span>
            </h2>
            <img src={patient} alt="Patient" className="w-3/4 pt-10" />
          </div>
        </div>

        {/* Right Section (Registration Form) */}
        <div className="w-full md:w-1/2 p-6 shadow-2xl rounded-r-4xl rounded-l-4xl bg-white">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Create Your Account</h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 mb-6 rounded-2xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label className="block p-2 text-gray-500">Full Name:</label>
              <input
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block p-2 text-gray-500">Email:</label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block p-2 text-gray-500">Phone Number:</label>
              <input
                name="phone_number"
                placeholder="Enter your phone number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
                type="tel"
                pattern="[0-9]*"
                minLength={10}
                maxLength={10}
              />
            </div>
            <label className="block p-2 text-gray-500 -mb-1">Password (it should contain a capital letter and a number):</label>

            {/* Password Input */}
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute right-3 top-3 transform -translate-y-1/2 mt-3 text-gray-500 hover:text-blue-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.79m0 0L20 21"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6

 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <label className="block p-2 text-gray-500">Confirm Password:</label>
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-13 transform -translate-y-1/2 mt-3 text-gray-500 hover:text-blue-600 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.79m0 0L20 21"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                )}
              </button>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={handleTermsChange}
                className="cursor-pointer h-4 w-4 text-blue-600 focus:ring-blue-300 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="text-gray-600 text-sm">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsPopup(true)}
                  className="cursor-pointer text-blue-500 hover:underline"
                >
                  Terms of Use
                </button>
              </label>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className={`w-2/4 mx-auto block text-white p-3 rounded-2xl shadow-md font-semibold transition duration-300 hover:shadow-lg ${
                isFormComplete ? "cursor-pointer bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!isFormComplete}
            >
              Register
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-4 text-gray-600">
            Already have an account? <a href="/login" className="cursor-pointer text-blue-500">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}