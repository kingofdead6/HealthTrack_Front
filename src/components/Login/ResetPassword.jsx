import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../api";

export default function ResetPassword() {
  // State for form data, UI feedback, and loading status
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setSuccess("A password reset link has been sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 shadow-2xl rounded-2xl bg-white">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Reset Password</h2>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-6 rounded-2xl text-center">{error}</div>
        )}
        {/* Success Message */}
        {success && (
          <div className="bg-green-100 text-green-700 p-3 mb-6 rounded-2xl text-center">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="mb-4">
            <label className="block p-2 text-gray-500">Email:</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full text-white p-3 rounded-2xl font-semibold transition duration-300 hover:shadow-lg ${
              email.trim() && !loading
                ? "cursor-pointer bg-[#A5CCFF] hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!email.trim() || loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Back to Login Link */}
        <p className="text-center mt-4 text-gray-600">
          Back to{" "}
          <span
            className="cursor-pointer text-blue-500 hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}