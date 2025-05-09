/* eslint-disable no-unused-vars */
import { useState } from "react";
import { API_BASE_URL } from "../../../api";

// Popup component for viewing tool/medicament details
export default function ToolMedicamentPopup({ items, initialItem, user, onClose, onDelete, getRatingColor }) {
  // State for managing current item, ratings, and UI
  const [currentItem, setCurrentItem] = useState(initialItem);
  const [ratingData, setRatingData] = useState({ rating: 0, comment: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  // Track current item index and user permissions
  const currentIndex = items.findIndex((item) => item._id === currentItem._id);
  const isOwner = user && user._id === currentItem.user_id._id;
  const isPatient = user && user.user_type === "patient";

  // Calculate average rating
  const averageRating =
    currentItem.ratings.length > 0
      ? (currentItem.ratings.reduce((sum, r) => sum + r.rating, 0) / currentItem.ratings.length).toFixed(1)
      : "No ratings yet";

  // Update rating form data
  const handleRatingChange = (e) => {
    const { name, value } = e.target;
    setRatingData({ ...ratingData, [name]: value });
  };

  // Submit rating to server
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tools-medicaments/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          toolMedicamentId: currentItem._id,
          rating: ratingData.rating,
          comment: ratingData.comment,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentItem({ ...currentItem, ratings: data.toolMedicament.ratings });
        setRatingData({ rating: 0, comment: "" });
      } else {
        setError(data.message || "Failed to submit rating");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Delete current item
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools-medicaments/${currentItem._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        onDelete(currentItem._id);
        if (items.length > 1) {
          const nextIndex = currentIndex === items.length - 1 ? currentIndex - 1 : currentIndex + 1;
          setCurrentItem(items[nextIndex]);
        } else {
          onClose();
        }
      } else {
        setError(data.message || "Failed to delete item");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Delete a specific review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tools-medicaments/${currentItem._id}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentItem({ ...currentItem, ratings: data.toolMedicament.ratings });
      } else {
        setError(data.message || "Failed to delete review");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to next item
  const handleNext = () => {
    const nextIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    setCurrentItem(items[nextIndex]);
  };

  // Navigate to previous item
  const handlePrevious = () => {
    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    setCurrentItem(items[prevIndex]);
  };

  return (
    <div className="fixed inset-0 bg-[#00000076] backdrop-blur-md flex items-center justify-center z-50">
      {/* Popup content */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{currentItem.name}</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-red-500"
            aria-label="Close popup"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <img
          src={currentItem.picture}
          alt={currentItem.name}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
        <div className="space-y-4">
          <p className="text-gray-700 text-sm">
            <strong>Price:</strong> ${currentItem.price.toFixed(2)}
          </p>
          <p className="text-gray-700 text-sm">
            <strong>Category:</strong> {currentItem.category || "None"}
          </p>
          <p className="text-gray-700 text-sm">
            <strong>Description:</strong> {currentItem.description || "No description"}
          </p>
          <p className="text-gray-700 text-sm">
            <strong>Average Rating:</strong>{" "}
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(averageRating)}`}>
              {averageRating}
            </span>
          </p>
        </div>

        {/* Toggle reviews visibility */}
        <button
          onClick={() => setShowReviews(!showReviews)}
          className="cursor-pointer w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm"
          aria-label={showReviews ? "Hide Ratings & Reviews" : "View Ratings & Reviews"}
        >
          {showReviews ? "Hide Ratings & Reviews" : "View Ratings & Reviews"}
        </button>

        {/* Reviews section */}
        {showReviews && (
          <div className="mt-6 space-y-6">
            <div className="max-h-40 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Ratings & Reviews</h3>
              {currentItem.ratings.length > 0 ? (
                currentItem.ratings.map((rating, index) => (
                  <div key={index} className="border p-3 rounded-lg bg-gray-50 shadow-sm mb-3">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-gray-800">
                        <span className="text-yellow-500">{rating.rating}/5</span>
                      </p>
                      {isPatient && rating.patient_id === user._id && (
                        <button
                          onClick={() => handleDeleteReview(rating._id)}
                          className={`cursor-pointer px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200 text-sm ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={loading}
                          aria-label="Delete review"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{rating.comment || "No comment"}</p>
                    <p className="text-xs text-gray-500">{new Date(rating.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No reviews yet.</p>
              )}
            </div>

            {/* Rating form for patients */}
            {isPatient && (
              <form onSubmit={handleRatingSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">Rating (1-5)</label>
                  <input
                    type="number"
                    name="rating"
                    value={ratingData.rating}
                    onChange={handleRatingChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400"
                    min="1"
                    max="5"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1.5">Comment (optional)</label>
                  <textarea
                    name="comment"
                    value={ratingData.comment}
                    onChange={handleRatingChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400 resize-y"
                    rows="3"
                    placeholder="Enter your comment"
                    disabled={loading}
                  />
                </div>
                {error && (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className={`cursor-pointer w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Rating"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Delete button for owners */}
        {isOwner && (
          <button
            onClick={handleDelete}
            className={`cursor-pointer w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-sm mt-4 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Item"}
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="cursor-pointer w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium shadow-sm mt-4"
          disabled={loading}
        >
          Close
        </button>
      </div>

      {/* Navigation buttons for multiple items */}
      {items.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="cursor-pointer fixed left-4 sm:left-100 top-1/2 transform -translate-y-1/2 p-4 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200 shadow-lg z-50"
            disabled={loading}
            aria-label="Previous item"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="cursor-pointer fixed right-4 sm:right-100 top-1/2 transform -translate-y-1/2 p-4 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors duration-200 shadow-lg z-50"
            disabled={loading}
            aria-label="Next item"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}