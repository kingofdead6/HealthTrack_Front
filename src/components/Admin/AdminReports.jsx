import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../api";
import { FaExclamationTriangle, FaUserShield, FaUserAlt } from "react-icons/fa";

// Component for managing user reports in an admin dashboard
export default function AdminReports() {
  // State for reports, modals, and UI management
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showBanUserModal, setShowBanUserModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [showUnbanUserModal, setShowUnbanUserModal] = useState(false);
  const [userToUnban, setUserToUnban] = useState(null);

  // Fetch reports from the API
  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/reports`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setReports(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Resolve (delete) a report
  const handleDeleteReport = async (reportId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/reports/delete`,
        { reportId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setShowDeleteReportModal(false);
      await fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve report");
    }
  };

  // Ban a user
  const handleBanUser = async (patientId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/admin/ban/${patientId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setReports(
        reports.map((report) =>
          report.reported_id?._id === patientId
            ? { ...report, reported_id: { ...report.reported_id, isBanned: true } }
            : report
        )
      );
      setShowBanUserModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to ban user");
    }
  };

  // Unban a user
  const handleUnbanUser = async (patientId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/admin/unban/${patientId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setReports(
        reports.map((report) =>
          report.reported_id?._id === patientId
            ? { ...report, reported_id: { ...report.reported_id, isBanned: false } }
            : report
        )
      );
      setShowUnbanUserModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unban user");
    }
  };

  // Delete a user
  const handleDeleteUser = async (patientId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/delete/${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setShowDeleteUserModal(false);
      await fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  // Show confirmation modals
  const confirmDeleteReport = (reportId) => {
    setReportToDelete(reportId);
    setShowDeleteReportModal(true);
  };

  const confirmBanUser = (patientId) => {
    setUserToBan(patientId);
    setShowBanUserModal(true);
  };

  const confirmUnbanUser = (patientId) => {
    setUserToUnban(patientId);
    setShowUnbanUserModal(true);
  };

  const confirmDeleteUser = (patientId) => {
    setUserToDelete(patientId);
    setShowDeleteUserModal(true);
  };

  // Display loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#4285F4]"></div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-blue-600 text-lg font-semibold bg-white p-4 rounded-lg shadow-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-extrabold text-[#4285F4] flex items-center">
            <FaExclamationTriangle className="mr-3 text-3xl" /> User Reports
          </h2>
        </div>

        {/* Reports grid or empty state */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <p className="text-gray-600 text-xl font-medium">No active reports</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports
              .filter((report) => report.reported_id && report.reporter_id)
              .map((report) => (
                <div
                  key={report._id}
                  className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center mb-4">
                    <img
                      src={
                        report.reported_id.profile_image ||
                        "https://via.placeholder.com/40?text=User"
                      }
                      alt="Reported User"
                      className="w-10 h-10 rounded-full mr-3 border-2 border-[#4285F4] object-cover"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/40?text=User")}
                    />
                    <div>
                      <p className="text-[#4285F4] font-semibold text-lg">
                        {report.reported_id.name}
                      </p>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.reported_id.user_type === "patient"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {report.reported_id.user_type}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center mb-4">
                      <img
                        src={
                          report.reporter_id.profile_image ||
                          "https://via.placeholder.com/40?text=User"
                        }
                        alt="Reporter"
                        className="w-8 h-8 rounded-full mr-2 border-2 border-gray-300 object-cover"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/40?text=User")}
                      />
                      <div>
                        <p className="text-gray-700 font-medium">
                          Reported by: {report.reporter_id.name}
                        </p>
                        <p className="text-gray-500 text-sm">{report.reporter_id.email}</p>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">
                      <span className="font-semibold">Reported on:</span>{" "}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      <span className="font-semibold">Status:</span>{" "}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.reported_id.isBanned
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {report.reported_id.isBanned ? "Banned" : "Active"}
                      </span>
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed mb-6 bg-gray-50 p-4 rounded-lg shadow-inner">
                      <span className="font-semibold">Reason:</span> {report.reason}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => confirmDeleteReport(report._id)}
                        className="flex items-center cursor-pointer bg-red-100 text-red-800 px-4 py-2 rounded-full hover:bg-red-200 transition-all duration-300 font-medium text-sm shadow-sm transform hover:scale-105"
                      >
                        <FaExclamationTriangle className="mr-2" /> Resolve Report
                      </button>
                      {report.reported_id.isBanned ? (
                        <button
                          onClick={() => confirmUnbanUser(report.reported_id._id)}
                          className="flex items-center cursor-pointer bg-green-100 text-green-800 px-4 py-2 rounded-full hover:bg-green-200 transition-all duration-300 font-medium text-sm shadow-sm transform hover:scale-105"
                        >
                          <FaUserShield className="mr-2" /> Unban User
                        </button>
                      ) : (
                        <button
                          onClick={() => confirmBanUser(report.reported_id._id)}
                          className="flex items-center cursor-pointer bg-gradient-to-r from-[#4285F4] to-[#3267D6] text-white px-4 py-2 rounded-full hover:from-[#3267D6] hover:to-[#4285F4] transition-all duration-300 font-medium text-sm shadow-sm transform hover:scale-105"
                        >
                          <FaUserShield className="mr-2" /> Ban User
                        </button>
                      )}
                      <button
                        onClick={() => confirmDeleteUser(report.reported_id._id)}
                        className="flex items-center cursor-pointer bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-all duration-300 font-medium text-sm shadow-sm transform hover:scale-105"
                      >
                        <FaUserAlt className="mr-2" /> Delete User
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Resolve Report Modal */}
      {showDeleteReportModal && (
        <div className="fixed inset-0 bg-[#00000080] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-slideIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#4285F4] flex items-center">
                <FaExclamationTriangle className="mr-2" /> Confirm Report Resolution
              </h3>
              <button
                onClick={() => setShowDeleteReportModal(false)}
                className="cursor-pointer text-gray-500 hover:text-red-500 transition-colors"
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
            <p className="text-gray-600 mb-8">Are you sure you want to resolve this report? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteReportModal(false)}
                className="cursor-pointer bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-all duration-300 font-medium transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReport(reportToDelete)}
                className="cursor-pointer bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-all duration-300 font-medium transform hover:scale-105"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanUserModal && (
        <div className="fixed inset-0 bg-[#00000080] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-slideIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#4285F4] flex items-center">
                <FaUserShield className="mr-2" /> Confirm Ban User
              </h3>
              <button
                onClick={() => setShowBanUserModal(false)}
                className="cursor-pointer text-gray-500 hover:text-red-500 transition-colors"
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
            <p className="text-gray-600 mb-8">Are you sure you want to ban this user? This action will restrict their access.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowBanUserModal(false)}
                className="cursor-pointer bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-all duration-300 font-medium transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBanUser(userToBan)}
                className="cursor-pointer bg-gradient-to-r from-[#4285F4] to-[#3267D6] text-white px-6 py-2 rounded-full hover:from-[#3267D6] hover:to-[#4285F4] transition-all duration-300 font-medium transform hover:scale-105"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban User Modal */}
      {showUnbanUserModal && (
        <div className="fixed inset-0 bg-[#00000080] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-slideIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#4285F4] flex items-center">
                <FaUserShield className="mr-2" /> Confirm Unban User
              </h3>
              <button
                onClick={() => setShowUnbanUserModal(false)}
                className="cursor-pointer text-gray-500 hover:text-red-500 transition-colors"
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
            <p className="text-gray-600 mb-8">Are you sure you want to unban this user? This will restore their access.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowUnbanUserModal(false)}
                className="cursor-pointer bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-all duration-300 font-medium transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnbanUser(userToUnban)}
                className="cursor-pointer bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all duration-300 font-medium transform hover:scale-105"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteUserModal && (
        <div className="fixed inset-0 bg-[#00000080] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-slideIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#4285F4] flex items-center">
                <FaUserAlt className="mr-2" /> Confirm User Deletion
              </h3>
              <button
                onClick={() => setShowDeleteUserModal(false)}
                className="cursor-pointer text-gray-500 hover:text-red-500 transition-colors"
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
                onClick={() => setShowDeleteUserModal(false)}
                className="cursor-pointer bg-gray-200 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-300 transition-all duration-300 font-medium transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete)}
                className="cursor-pointer bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-all duration-300 font-medium transform hover:scale-105"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
}