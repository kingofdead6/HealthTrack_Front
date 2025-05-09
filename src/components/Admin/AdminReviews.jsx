import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { API_BASE_URL } from "../../../api";

// Component for managing and displaying user reviews in an admin dashboard
export default function AdminReviews() {
  // State for reviews, modals, and UI management
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const navigate = useNavigate();

  // Fetch reviews with retry logic
  const fetchReviews = async (retries = 2) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else if (retries > 0) {
          setTimeout(() => fetchReviews(retries - 1), 1000);
          return;
        }
        throw new Error(data.message || "Failed to fetch reviews");
      }
      setReviews(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews on component mount
  useEffect(() => {
    fetchReviews();
  }, [navigate]);

  // Delete a comment
  const handleDeleteComment = async (appointmentId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reviews/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete comment");
      setReviews(reviews.filter((review) => review._id !== appointmentId));
      setShowCommentDeleteModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Ban a user
  const handleBanUser = async (patientId) => {
    if (!window.confirm("Are you sure you want to ban this user?")) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/ban/${patientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to ban user");
      setReviews(
        reviews.map((review) =>
          review.patient_id._id === patientId
            ? { ...review, patient_id: { ...review.patient_id, isBanned: true } }
            : review
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Unban a user
  const handleUnbanUser = async (patientId) => {
    if (!window.confirm("Are you sure you want to unban this user?")) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/unban/${patientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to unban user");
      setReviews(
        reviews.map((review) =>
          review.patient_id._id === patientId
            ? { ...review, patient_id: { ...review.patient_id, isBanned: false } }
            : review
        )
      );
      alert("User unbanned successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete a user
  const handleDeleteUser = async (patientId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/delete/${patientId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete user");
      setReviews(reviews.filter((review) => review.patient_id._id !== patientId));
      setShowDeleteModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Show comment deletion modal
  const confirmDeleteComment = (appointmentId) => {
    setCommentToDelete(appointmentId);
    setShowCommentDeleteModal(true);
  };

  // Show user deletion modal
  const confirmDeleteUser = (patientId) => {
    setUserToDelete(patientId);
    setShowDeleteModal(true);
  };

  // Display loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E1EEFF]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#4285F4]"></div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E1EEFF]">
        <div className="text-red-600 text-lg font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E1EEFF] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-[#4285F4]">Reviews</h2>
        </div>

        {/* Reviews grid or empty state */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg font-medium">No reviews available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={
                      review.patient_id.profile_image ||
                      "https://via.placeholder.com/40?text=User"
                    }
                    alt="Profile"
                    className="w-14 h-14 rounded-full mr-4 border-2 border-[#4285F4] object-cover"
                    onError={(e) => (e.target.src = "https://via.placeholder.com/40?text=User")}
                  />
                  <div className="flex-1">
                    <p className="text-[#4285F4] font-semibold text-lg">{review.patient_id.name}</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(review.date).toLocaleDateString()} {review.time || "N/A"}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-500 font-semibold text-sm mr-2">{review.rating} / 5</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-5 h-5 ${i < Math.round(review.rating) ? "text-yellow-400" : "text-gray-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 bg-gray-50 p-4 rounded-lg">{review.comment}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => confirmDeleteComment(review._id)}
                    className="cursor-pointer bg-red-100 text-red-700 px-4 py-2 rounded-full hover:bg-red-200 transition-all duration-300 font-medium text-sm shadow-sm"
                  >
                    Delete Comment
                  </button>
                  {review.patient_id.isBanned ? (
                    <button
                      onClick={() => handleUnbanUser(review.patient_id._id)}
                      className="cursor-pointer bg-green-100 text-green-700 px-4 py-2 rounded-full hover:bg-green-200 transition-all duration-300 font-medium text-sm shadow-sm"
                    >
                      Unban User
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBanUser(review.patient_id._id)}
                      className="cursor-pointer bg-[#4285F4] text-white px-4 py-2 rounded-full hover:bg-[#3267D6] transition-all duration-300 font-medium text-sm shadow-sm"
                    >
                      Ban User
                    </button>
                  )}
                  <button
                    onClick={() => confirmDeleteUser(review.patient_id._id)}
                    className="cursor-pointer bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-all duration-300 font-medium text-sm shadow-sm"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Delete Modal */}
      {showCommentDeleteModal && (
        <div className="fixed inset-0 bg-[#00000056] backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#4285F4]">Confirm Comment Deletion</h3>
              <button
                onClick={() => setShowCommentDeleteModal(false)}
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
            <p className="text-gray-600 mb-8">Are you sure you want to delete this comment? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowCommentDeleteModal(false)}
                className="cursor-pointer bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteComment(commentToDelete)}
                className="cursor-pointer bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-all duration-300 font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#00000080] backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#4285F4]">Confirm User Deletion</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
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
            <p className="text-gray-600 mb-8">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="cursor-pointer bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete)}
                className="cursor-pointer bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-all duration-300 font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}