import React from "react";

// Popup component for displaying healthcare profile details
export default function HealthcareProfilePopup({ healthcare, loading, error, onClose }) {
  return (
    <div className="fixed inset-0 bg-[#00000076] backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
        {/* Header with title and close button */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Healthcare Profile</h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-red-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content area for profile details */}
        {loading ? (
          <p className="text-gray-600 text-center animate-pulse">Loading healthcare details...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : (
          <div className="space-y-6">
            {/* Profile image */}
            <div className="flex justify-center mb-4">
              {healthcare.profile_image ? (
                <img
                  src={healthcare.profile_image}
                  alt={`${healthcare.name}'s profile`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-md"
                  onError={(e) => (e.target.src = "https://via.placeholder.com/96?text=Image+Not+Found")}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium shadow-md">
                  No Image
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 text-center">{healthcare.name}</h3>
            {/* Profile details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Basic Info</h4>
                <div className="text-gray-700 text-sm space-y-3">
                  <p>
                    <strong>Type:</strong>{" "}
                    {healthcare.healthcare_type.charAt(0).toUpperCase() + healthcare.healthcare_type.slice(1)}
                  </p>
                  <p><strong>Email:</strong> {healthcare.email || "Not provided"}</p>
                  <p><strong>Phone:</strong> {healthcare.phone_number || "Not provided"}</p>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Additional Details</h4>
                <div className="text-gray-700 text-sm space-y-3">
                  <p>
                    <strong>Location:</strong>{" "}
                    {healthcare.location_link ? (
                      <a
                        href={healthcare.location_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        View Location
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                  <p><strong>Hours:</strong> {healthcare.working_hours || "Not specified"}</p>
                  <p><strong>Delivery:</strong> {healthcare.can_deliver ? "Yes" : "No"}</p>
                  {healthcare.speciality && <p><strong>Specialty:</strong> {healthcare.speciality}</p>}
                  {healthcare.pharmacy_name && <p><strong>Pharmacy:</strong> {healthcare.pharmacy_name}</p>}
                  {healthcare.lab_name && <p><strong>Laboratory:</strong> {healthcare.lab_name}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Close button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}