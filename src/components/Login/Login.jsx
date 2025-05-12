import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import login from "../../assets/patient.svg";
import { API_BASE_URL } from "../../../api";

export default function Login() {
  // State for form data, UI feedback, and loading status
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      const { user_type, healthcare_type } = data.user;
      if (user_type === "patient") {
        navigate("/patient-dashboard", { state: { user: data.user } });
      } else if (user_type === "healthcare") {
        if (healthcare_type === "doctor" || healthcare_type === "nurse") {
          navigate("/healthcare-dashboard", { state: { user: data.user } });
        } else if (healthcare_type === "laboratory" || healthcare_type === "pharmacy") {
          navigate("/location-dashboard", { state: { user: data.user } });
        } else {
          setError("Invalid healthcare type");
        }
      } else if (user_type === "admin") {
        navigate("/admin");
      } else {
        setError("Invalid user type");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if form is complete
  const isFormComplete = formData.email.trim() !== "" && formData.password.trim() !== "";

  return (
    <div className="min-h-screen flex items-center mx-12 justify-center p-4 mt-16">
      <div className="w-full max-w-5xl pt-6 pb-6 flex flex-col md:flex-row">
        {/* Left Section (Image) */}
        <div className="hidden md:flex md:w-1/2 bg-blue-200 p-6 rounded-r-4xl rounded-l-4xl mr-6">
          <div className="flex flex-col items-center w-full">
            <h2 className="text-4xl font-bold pt-10 text-black mb-4">Login</h2>
            <img src={login} alt="login" className="w-3/4 pt-10" />
          </div>
        </div>

        {/* Right Section (Login Form) */}
        <div className="-mx-10 md:mx-0 md:w-1/2 p-6 shadow-2xl rounded-r-4xl rounded-l-4xl bg-white">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Welcome Back</h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 text-red-700 p-3 mb-6 rounded-2xl text-center">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="mb-4">
              <label className="block p-2 text-gray-500">Email:</label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="mb-4 relative">
              <label className="block p-2 text-gray-500">Password:</label>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute right-3 top-16 transform -translate-y-1/2 text-gray-500"
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center"></div>
              <a href="/reset-password" className="text-blue-500 text-sm hover:underline">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-2/4 mx-auto block text-white p-3 rounded-2xl shadow-md font-semibold transition duration-300 hover:shadow-lg ${
                isFormComplete && !loading
                  ? "cursor-pointer bg-blue-600 hover:bg-blue-800"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!isFormComplete || loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center mt-4 text-gray-600">
            Don’t have an account?{" "}
            <span
              className="text-blue-500 cursor-pointer hover:underline"
              onClick={() => navigate("/register")}
            >
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}