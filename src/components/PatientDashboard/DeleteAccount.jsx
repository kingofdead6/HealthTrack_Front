import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../../api";

// DeleteAccount component to handle user account deletion confirmation
export default function DeleteAccount() {
  // State declarations for managing form input and UI
  const [password, setPassword] = useState(""); // Store user-entered password
  const [error, setError] = useState(""); // Store error messages
  const [loading, setLoading] = useState(false); // Indicate loading state during API request
  const navigate = useNavigate(); // Enable programmatic navigation
  const [searchParams] = useSearchParams(); // Access URL query parameters
  const token = searchParams.get("token"); // Extract deletion token from URL

  // Handle form submission to confirm account deletion
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true); // Set loading state to true
    setError(""); // Clear previous errors

    // Validate presence of deletion token
    if (!token) {
      setError("Invalid or missing deletion token"); // Set error if token is missing
      setLoading(false); // Reset loading state
      return;
    }

    try {
      // Send deletion confirmation request to API
      const response = await fetch(`${API_BASE_URL}/api/patients/delete-confirm`, {
        method: "POST", // Use POST method for deletion
        headers: {
          "Content-Type": "application/json", // Specify JSON content type
        },
        body: JSON.stringify({ token, password }), // Send token and password in request body
      });
      const data = await response.json(); // Parse response JSON
      if (response.ok) {
        localStorage.removeItem("token"); // Remove auth token from localStorage
        alert("Your account has been deleted successfully."); // Notify user of success
        navigate("/login"); // Redirect to login page
      } else {
        throw new Error(data.message || "Failed to delete account"); // Throw error on failure
      }
    } catch (err) {
      setError(err.message); // Set error message from exception
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Main UI for account deletion confirmation
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full">
        {/* Form Header */}
        <h2 className="text-2xl font-semibold mb-4">Confirm Account Deletion</h2>
        <p className="mb-4">Please enter your password to confirm account deletion. This action cannot be undone.</p>
        
        {/* Error Message */}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        {/* Deletion Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Update password state on input change
              className="w-full p-2 border rounded-lg"
              required // Make password field mandatory
            />
          </div>
          <button
            type="submit"
            disabled={loading} // Disable button during loading
            className={`cursor-pointer w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 ${loading ? "opacity-50 cursor-not-allowed" : ""}`} // Conditional styling for loading state
          >
            {loading ? "Deleting..." : "Delete Account"} {/* Display loading or default text */}
          </button>
        </form>
      </div>
    </div>
  );
}