/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import healthcare from "../../assets/doctor-logo-vector-silhouette-doctor-icon-white-background_1199258-61-removebg-preview 1.svg";
import { IoArrowBack } from "react-icons/io5";
import { API_BASE_URL } from "../../../api";

export default function HealthcareFinalStep() {
  // State for error and loading status
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { state } = useLocation();
  const navigate = useNavigate();

  const formData = state?.formData || {};

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate certificate
    if (!formData.certificate || typeof formData.certificate !== "string" || !formData.certificate.startsWith("data:image/")) {
      setError("A valid certificate image is required.");
      setLoading(false);
      return;
    }

    // Prepare payload for API
    const payload = new FormData();
    for (const [key, value] of Object.entries(formData)) {
      if (key === "certificate") {
        try {
          const byteString = atob(value.split(",")[1]);
          const mimeString = value.split(",")[0].split(":")[1].split(";")[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const file = new File([blob], "certificate.jpg", { type: mimeString });
          payload.append("certificate", file);
        } catch (err) {
          setError("Failed to process certificate. Please upload a valid image.");
          setLoading(false);
          return;
        }
      } else if (key !== "user_type" && key !== "confirmPassword") {
        payload.append(key, value);
      }
    }

    payload.append("user_type", "healthcare");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        body: payload,
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/login");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError(`Network error: Could not reach the server. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Navigate back to previous step
  const handleBack = () => {
    navigate("/register/healthcare-details", { state: { formData: formData } });
  };

  // Format field labels for display
  const formatLabel = (key) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mx-12 mt-16">
      {/* Back Arrow Button */}
      <button
        onClick={handleBack}
        className="cursor-pointer absolute top-1/6 left-1/15 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-300 ease-in-out"
        title="Go back"
      >
        <IoArrowBack size={24} />
      </button>
      <div className="w-full max-w-5xl pt-6 pb-6 flex flex-col md:flex-row">
        {/* Left Section (Decorative) */}
        <div className="hidden md:flex md:w-1/2 bg-blue-200 p-6 rounded-r-4xl rounded-l-4xl mr-6">
          <div className="flex flex-col items-center w-full">
            <h2 className="text-4xl font-bold pt-10 text-black mb-4">
              Complete <span className="text-blue-800">Registration</span>
            </h2>
            <img src={healthcare} alt="Healthcare" className="w-3/4 pt-10" />
          </div>
        </div>

        {/* Right Section (Confirmation) */}
        <div className="w-full md:w-1/2 p-6 shadow-2xl rounded-r-4xl rounded-l-4xl bg-white">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
            Confirm Your Details
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 text-red-700 p-3 mb-6 rounded-2xl text-center">
              {error}
            </div>
          )}

          {/* Display Form Data */}
          <div className="space-y-4">
            {Object.entries(formData).map(([key, value]) =>
              key !== "password" && key !== "confirmPassword" ? (
                <p key={key}>
                  <strong>{formatLabel(key)}:</strong>{" "}
                  {typeof value === "string" && value.startsWith("data:image/") ? "Uploaded File" : value.toString()}
                </p>
              ) : null
            )}
            {formData.certificate && typeof formData.certificate === "string" && formData.certificate.startsWith("data:image/") && (
              <div>
                <p><strong>Certificate:</strong></p>
                <img
                  src={formData.certificate}
                  alt="Certificate"
                  className="mt-2 w-32 h-32 object-cover rounded"
                />
              </div>
            )}
          </div>

          {/* Submit Form */}
          <form onSubmit={handleSubmit} className="mt-6">
            <button
              type="submit"
              className={` w-2/4 mx-auto block text-white p-3 rounded-2xl shadow-md font-semibold transition duration-300 hover:shadow-lg ${
                loading ? "bg-gray-400 cursor-not-allowed" : "cursor-pointer bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}