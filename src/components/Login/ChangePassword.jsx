import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../../api";

export default function ChangePassword() {
  // State for form data, UI feedback, and loading status
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.password, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess("Password reset successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if form is complete
  const isFormComplete = formData.password.trim() !== "" && formData.confirmPassword.trim() !== "";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 shadow-2xl rounded-2xl bg-white">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Change Password</h2>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-6 rounded-2xl text-center">{error}</div>
        )}
        {/* Success Message */}
        {success && (
          <div className="bg-green-100 text-green-700 p-3 mb-6 rounded-2xl text-center">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password Input */}
          <div className="mb-4">
            <label className="block p-2 text-gray-500">New Password:</label>
            <input
              name="password"
              type="password"
              placeholder="Enter new password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
              disabled={loading}
            />
          </div>

          {/* Confirm Password Input */}
          <div className="mb-4">
            <label className="block p-2 text-gray-500">Confirm Password:</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full text-white p-3 rounded-2xl font-semibold transition duration-300 hover:shadow-lg ${
              isFormComplete && !loading
                ? "cursor-pointer bg-[#A5CCFF] hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!isFormComplete || loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}