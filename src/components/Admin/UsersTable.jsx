/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../../api";
import debounce from "lodash.debounce";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Component for displaying and managing a table of users
export default function UsersTable({ onUserClick }) {
  // State for users, filters, and UI management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [healthcareTypeFilter, setHealthcareTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false); // State for PDF download
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false); // State for Excel download


  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          setUsers(data.users);
          setFilteredUsers(data.users.slice(0, 10));
        } else {
          throw new Error("Failed to fetch users");
        }
      } catch (error) {
        alert("Failed to fetch users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Debounced search function to reduce API calls
  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchQuery(query);
      setVisibleCount(10); // Reset visible count on new search
    }, 300),
    []
  );

  // Filter users based on search and filter criteria
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (searchQuery) {
      result = result.filter((user) => {
        const name = user.name || "";
        const email = user.email || "";
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply user type filter
    if (userTypeFilter) {
      result = result.filter((user) => user.user_type === userTypeFilter);
    }

    // Apply healthcare type filter
    if (healthcareTypeFilter) {
      result = result.filter(
        (user) =>
          user.user_type === "healthcare" &&
          user.healthcare_type === healthcareTypeFilter
      );
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter((user) =>
        statusFilter === "banned" ? user.isBanned : !user.isBanned
      );
    }

    setFilteredUsers(result.slice(0, visibleCount));
  }, [
    users,
    searchQuery,
    userTypeFilter,
    healthcareTypeFilter,
    statusFilter,
    visibleCount,
  ]);

  // Show more or fewer users
  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleShowLess = () => {
    setVisibleCount((prev) => Math.max(10, prev - 10));
  };

  // Ban a user
  const handleBan = async () => {
    if (selectedUserId) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/ban/${selectedUserId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const updatedUsers = users.map((user) =>
            user._id === selectedUserId ? { ...user, isBanned: true } : user
          );
          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers.slice(0, visibleCount));
          setSelectedUserId(null);
        } else {
          throw new Error("Failed to ban user");
        }
      } catch (error) {
        alert("Failed to ban user.");
      }
    }
  };

  // Unban a user
  const handleUnban = async () => {
    if (selectedUserId) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/unban/${selectedUserId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const updatedUsers = users.map((user) =>
            user._id === selectedUserId ? { ...user, isBanned: false } : user
          );
          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers.slice(0, visibleCount));
          setSelectedUserId(null);
        } else {
          throw new Error("Failed to unban user");
        }
      } catch (error) {
        alert("Failed to unban user.");
      }
    }
  };

  // Delete a user
  const handleDelete = async () => {
    if (selectedUserId) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/delete/${selectedUserId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const updatedUsers = users.filter(
            (user) => user._id !== selectedUserId
          );
          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers.slice(0, visibleCount));
          setSelectedUserId(null);
          setShowDeletePopup(false);
        } else {
          throw new Error("Failed to delete user");
        }
      } catch (error) {
        alert("Failed to delete user.");
      }
    }
  };

  // Handle row selection
  const handleRowClick = (userId) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      if (onUserClick) onUserClick(null);
    } else {
      setSelectedUserId(userId);
      if (onUserClick) onUserClick(userId);
    }
  };

  // Download table as PDF using jsPDF
  const handleDownloadPDF = async () => {
    if (users.length === 0) {
      alert("No users to export.");
      return;
    }

    setIsDownloadingPDF(true);
    try {
      console.log("Starting PDF generation for", users.length, "users");
      console.log("Users data:", users);

      const doc = new jsPDF();

      // Add total users, title, and date
      doc.setFontSize(12);
      doc.setTextColor(100); // Gray
      doc.text(`Total Users: ${users.length}`, 20, 15);
      doc.setFontSize(20);
      doc.setTextColor(66, 133, 244); // #4285F4
      doc.text("Users Table", 20, 25);
      doc.setFontSize(12);
      doc.setTextColor(100); // Gray
      doc.text(
        `Generated on ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        20,
        35
      );

      // Validate and prepare table data
      const tableData = users.map((user) => {
        const row = [
          String(user._id || "N/A"),
          String(user.name || "N/A"),
          String(user.email || "N/A"),
          String(user.user_type || "N/A"),
          String(
            user.user_type === "healthcare"
              ? user.healthcare_type || "N/A"
              : "Patient"
          ),
          String(user.isBanned ? "Banned" : "Active"),
        ];
        console.log("Row data:", row);
        return row;
      });

      // Apply autoTable plugin
      if (typeof autoTable !== "function") {
        throw new Error("jspdf-autotable plugin is not loaded correctly");
      }

      autoTable(doc, {
        startY: 45,
        head: [["User ID", "Name", "Email", "User Type", "Healthcare Type", "Status"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [66, 133, 244], // #4285F4
          textColor: [255, 255, 255],
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [225, 238, 255], // #E1EEFF
        },
        margin: { left: 20, right: 20 },
        styles: {
          font: "helvetica",
          lineColor: [209, 213, 219], // Gray border
          lineWidth: 0.1,
        },
      });

      // Save the PDF
      const date = new Date().toISOString().split("T")[0];
      console.log("Saving PDF as UsersTable_", date, ".pdf");
      doc.save(`UsersTable_${date}.pdf`);
      console.log("PDF generation complete");
    } catch ( personallyIdentifiableInformation) {
      console.error("PDF generation failed:", personallyIdentifiableInformation.message, personallyIdentifiableInformation.stack);
      alert(`Failed to generate PDF: ${personallyIdentifiableInformation.message}. Please try again.`);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Download table as Excel using xlsx
  const handleDownloadExcel = async () => {
    if (users.length === 0) {
      alert("No users to export.");
      return;
    }

    setIsDownloadingExcel(true);
    try {
      console.log("Starting Excel generation for", users.length, "users");

      // Prepare data for Excel
      const tableData = users.map((user) => ({
        "User ID": user._id || "N/A",
        Name: user.name || "N/A",
        Email: user.email || "N/A",
        "User Type": user.user_type || "N/A",
        "Healthcare Type":
          user.user_type === "healthcare"
            ? user.healthcare_type || "N/A"
            : "Patient",
        Status: user.isBanned ? "Banned" : "Active",
      }));

      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(tableData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

      // Save the Excel file
      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `UsersTable_${date}.xlsx`);
      console.log("Excel generation complete");
    } catch (error) {
      console.error("Excel generation failed:", error.message, error.stack);
      alert(`Failed to generate Excel: ${error.message}. Please try again.`);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] flex items-center justify-center">
        <div className="text-[#4285F4] text-2xl font-semibold animate-pulse">
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E1EEFF] p-4 sm:p-8">
      {/* Custom scrollbar styles */}
      <style>
        {`
          /* Custom scrollbar for WebKit browsers */
          .custom-table-scrollbar::-webkit-scrollbar {
            height: 8px;
          }
          .custom-table-scrollbar::-webkit-scrollbar-track {
            background: rgba(209, 213, 219, 0.3); /* Semi-transparent gray */
            border-radius: 4px;
          }
          .custom-table-scrollbar::-webkit-scrollbar-thumb {
            background: #2563eb; /* Blue-600 */
            border-radius: 4px;
            transition: background 0.2s;
          }
          .custom-table-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #1d4ed8; /* Blue-700 */
          }

          /* Firefox scrollbar styling */
          .custom-table-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #2563eb rgba(209, 213, 219, 0.3);
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#4285F4] mb-8 text-center sm:text-left">
          All Users
        </h2>

        {/* Filter inputs */}
        <div className="mb-4 bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <input
            type="text"
            placeholder="Search by name or email..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full sm:w-1/4 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all duration-300 placeholder-gray-400"
          />
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="cursor-pointer w-full sm:w-1/4 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all duration-300 text-gray-700"
          >
            <option value="">All User Types</option>
            <option value="patient">Patient</option>
            <option value="healthcare">Healthcare</option>
          </select>
          <select
            value={healthcareTypeFilter}
            onChange={(e) => setHealthcareTypeFilter(e.target.value)}
            className="cursor-pointer w-full sm:w-1/4 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all duration-300 text-gray-700"
          >
            <option value="">All Healthcare Types</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="laboratory">Laboratory</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer w-full sm:w-1/4 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all duration-300 text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Download Buttons */}
        <div className="flex justify-center mb-8 gap-4">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className={`cursor-pointer flex items-center gap-2 bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold ${
              isDownloadingPDF ? "opacity-70 cursor-not-allowed" : "hover:from-[#3267D6] hover:to-[#2E8B57]"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m-9 3V5a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2z"
              />
            </svg>
            {isDownloadingPDF ? "Downloading..." : "Download as PDF"}
          </button>
          <button
            onClick={handleDownloadExcel}
            disabled={isDownloadingExcel}
            className={`cursor-pointer flex items-center gap-2 bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold ${
              isDownloadingExcel ? "opacity-70 cursor-not-allowed" : "hover:from-[#3267D6] hover:to-[#2E8B57]"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m-9 3V5a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2z"
              />
            </svg>
            {isDownloadingExcel ? "Downloading..." : "Download as Excel"}
          </button>
        </div>

        {/* Users table or empty state */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <p className="text-gray-600 text-lg font-medium">
              {searchQuery || userTypeFilter || healthcareTypeFilter || statusFilter
                ? "No matching users found."
                : "No users found."}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto custom-table-scrollbar sm:overflow-x-visible">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#4285F4] text-white">
                      <th className="p-4 font-semibold text-base w-[80px]">Select</th>
                      <th className="p-4 font-semibold text-base w-[150px]">User ID</th>
                      <th className="p-4 font-semibold text-base w-[150px]">Name</th>
                      <th className="p-4 font-semibold text-base w-[200px]">Email</th>
                      <th className="p-4 font-semibold text-base w-[120px]">User Type</th>
                      <th className="p-4 font-semibold text-base w-[150px]">
                        Healthcare Type
                      </th>
                      <th className="p-4 font-semibold text-base w-[100px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className={`${
                          user.user_type === "healthcare"
                            ? "bg-[#E1EEFF]"
                            : "bg-white"
                        } hover:bg-[#D1E0FF] cursor-pointer transition-all duration-300 ${
                          selectedUserId === user._id ? "bg-[#B3CFFF]" : ""
                        }`}
                        onClick={() => handleRowClick(user._id)}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedUserId === user._id}
                            onChange={() => handleRowClick(user._id)}
                            onClick={(e) => e.stopPropagation()}
                            className="accent-[#4285F4] h-4 w-4"
                          />
                        </td>
                        <td className="p-4 text-gray-600 text-sm">{user._id}</td>
                        <td className="p-4 text-[#4285F4] font-medium">
                          {user.name}
                        </td>
                        <td className="p-4 text-gray-600">{user.email}</td>
                        <td className="p-4 text-[#4285F4] font-medium">
                          {user.user_type}
                        </td>
                        <td className="p-4 text-gray-600">
                          {user.user_type === "healthcare"
                            ? user.healthcare_type || "N/A"
                            : "patient"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              user.isBanned
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.isBanned ? "Banned" : "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination buttons */}
            <div className="flex justify-center mt-8 gap-4">
              {visibleCount <= 10 ? (
                <button
                  onClick={handleShowMore}
                  className="cursor-pointer bg-[#4285F4] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#3267D6] transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  Show More
                </button>
              ) : (
                <>
                  <button
                    onClick={handleShowLess}
                    className="cursor-pointer bg-gray-200 text-gray-800 px-6 py-3 rounded-full shadow-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    Show Less
                  </button>
                  <button
                    onClick={handleShowMore}
                    className="cursor-pointer bg-[#4285F4] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#3267D6] transition-all duration-300 transform hover:scale-105 font-semibold"
                  >
                    Show More
                  </button>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-center mt-6 gap-4">
              {!filteredUsers.find((u) => u._id === selectedUserId)?.isBanned && (
                <button
                  onClick={handleBan}
                  className="cursor-pointer bg-[#4285F4] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#3267D6] transition-all duration-300 transform hover:scale-105 font-semibold"
                  disabled={!selectedUserId}
                >
                  Ban
                </button>
              )}
              {filteredUsers.find((u) => u._id === selectedUserId)?.isBanned && (
                <button
                  onClick={handleUnban}
                  className="cursor-pointer bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 font-semibold"
                  disabled={!selectedUserId}
                >
                  Unban
                </button>
              )}
              <button
                onClick={() => setShowDeletePopup(true)}
                className="cursor-pointer bg-red-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 font-semibold"
                disabled={!selectedUserId}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-[#00000043] backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#4285F4] mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeletePopup(false)}
                className="cursor-pointer px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="cursor-pointer px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}