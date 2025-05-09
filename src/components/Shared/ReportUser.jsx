import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../api";

export default function ReportUser({ reportedId, onClose }) {
  // State for form inputs and UI status
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for the report");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/users/report`,
        { reported_id: reportedId, reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  // Close success modal and parent modal
  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    onClose();
  };

  return (
    <>
      {/* Report form modal */}
      <div className="fixed inset-0 bg-[#00000056] backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-[#4285F4]">Report User</h3>
            {/* Close button */}
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-500 hover:text-red-500"
              aria-label="Close modal"
              disabled={loading}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {error && (
            <p className="text-red-600 mb-4 text-sm">{error}</p>
          )}
          <form onSubmit={handleSubmit}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for reporting this user"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
              rows="4"
              disabled={loading}
            />
            <div className="flex justify-end gap-4">
              {/* Cancel button */}
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-all duration-300 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              {/* Submit button */}
              <button
                type="submit"
                className="cursor-pointer bg-[#4285F4] text-white px-6 py-2 rounded-full hover:bg-[#3267D6] transition-all duration-300 font-medium disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-[#00000056] backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#4285F4]">Report Submitted</h3>
              {/* Close button */}
              <button
                onClick={handleCloseSuccess}
                className="cursor-pointer text-gray-500 hover:text-red-500"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-8">Your report has been submitted successfully and will be reviewed by an administrator.</p>
            <div className="flex justify-end">
              {/* OK button */}
              <button
                onClick={handleCloseSuccess}
                className="cursor-pointer bg-[#4285F4] text-white px-6 py-2 rounded-full hover:bg-[#3267D6] transition-all duration-300 font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}