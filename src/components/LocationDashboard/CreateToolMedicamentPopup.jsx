/* eslint-disable no-unused-vars */
import { useState } from "react";
import { API_BASE_URL } from "../../../api";

// Popup component for creating a new tool or medicament
export default function CreateToolMedicamentPopup({ user, onClose, onSuccess }) {
  // State for form data, loading, and error handling
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    picture: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const isPharmacy = user?.healthcare_type === "pharmacy";
  const itemLabel = isPharmacy ? "Medicament" : "Tool";

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    setFormData({ ...formData, picture: e.target.files[0] });
  };

  // Submit form data to create new item
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate required fields
    if (!formData.name || !formData.price || !formData.picture) {
      setError("Please fill out all required fields (name, price, picture)");
      setLoading(false);
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("price", Number(formData.price));
    form.append("description", formData.description);
    form.append("category", formData.category);
    if (formData.picture) {
      form.append("picture", formData.picture);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tools-medicaments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: form,
      });
      const data = await response.json();
      if (response.ok) {
        onSuccess(data.toolMedicament);
        setFormData({ name: "", price: "", description: "", category: "", picture: null });
        setFileInputKey(Date.now());
      } else {
        setError(data.message || "Failed to create item");
      }
    } catch (err) {
      setError("Server error: Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#00000076] backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
        {/* Header with title and close button */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Create {itemLabel}</h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-red-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Form for creating new item */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400"
              placeholder="Enter name"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Price ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400"
              min="0"
              step="1"
              placeholder="Enter price"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Category (optional)</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400"
              placeholder="Enter category"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Description (optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-400 resize-y"
              rows="4"
              placeholder="Enter description"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1.5">Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
              disabled={loading}
              key={fileInputKey}
            />
          </div>
          {/* Error message display */}
          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {/* Form buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium shadow-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? "Creating..." : `Create ${itemLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}