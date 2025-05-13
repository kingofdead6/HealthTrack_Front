import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../api";
import jsPDF from "jspdf";
import { QRCodeCanvas } from 'qrcode.react';

// PatientAppointments component to manage and display patient appointments
export default function PatientAppointments() {
  // State declarations for managing appointments and UI
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratingData, setRatingData] = useState({ appointmentId: null, rating: 0, comment: "" });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [patient, setPatient] = useState(null);
  const navigate = useNavigate();

  // Fetch appointments and patient profile on component mount
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/patients/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          setAppointments(data);
          setFilteredAppointments(data);
        } else {
          throw new Error(data.message || "Failed to fetch appointments");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchPatientProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/patients/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          setPatient(data.patient);
        } else {
          throw new Error(data.message || "Failed to fetch patient profile");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAppointments();
    fetchPatientProfile();
  }, [navigate]);

  // Filter and sort appointments
  useEffect(() => {
    let result = [...appointments];

    if (searchQuery) {
      result = result.filter((appt) =>
        (appt.user_id?.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDate) {
      result = result.filter(
        (appt) => new Date(appt.date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
      );
    }

    if (statusFilter) {
      result = result.filter((appt) => appt.status === statusFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredAppointments(result);
  }, [appointments, searchQuery, selectedDate, sortOrder, statusFilter]);

  // Handle downloading appointment PDF
  const handleDownloadAppointmentPDF = (appointment) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(33, 150, 243); // Blue background
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont("helvetica", "bold");
    doc.text("Appointment Details", 20, 20);

    // Content border
    doc.setDrawColor(33, 150, 243);
    doc.setLineWidth(0.5);
    doc.rect(10, 40, 190, 247, 'S');

    // Appointment details
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    let yOffset = 50;
    const lineHeight = 10;
    const valueWidth = 130;

    const fields = [
      { label: "Provider Name", value: appointment.user_id?.name || "Unknown", highlight: true },
      { label: "Date", value: new Date(appointment.date).toLocaleDateString() },
      {
        label: "Time",
        value: appointment.time || new Date(appointment.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      { label: "Duration", value: `${appointment.duration || 60} minutes` },
      { label: "Status", value: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) },
      { label: "Message", value: appointment.message || "No message provided" },
    ];

    fields.forEach((field, index) => {
      // Alternating or highlighted row background
      if (field.highlight) {
        doc.setFillColor(227, 242, 253); // Light blue (#E3F2FD)
        doc.rect(15, yOffset - 5, 180, lineHeight, 'F');
      } else if (index % 2 === 0) {
        doc.setFillColor(240, 248, 255); // Light blue (#F0F8FF)
        doc.rect(15, yOffset - 5, 180, lineHeight, 'F');
      }

      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(field.highlight ? 14 : 12);
      doc.text(field.label + ":", 15, yOffset);

      // Value
      doc.setFont("helvetica", "normal");
      doc.setFontSize(field.highlight ? 14 : 12);
      const splitValue = doc.splitTextToSize(field.value, valueWidth);
      doc.text(splitValue, 65, yOffset);
      yOffset += Math.max(splitValue.length, 1) * lineHeight;
    });

    // Footer
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 293);
    doc.text("Healthcare System", 170, 293);

    const fileName = `Appointment_${new Date(appointment.date).toLocaleDateString().replace(/\//g, "-")}.pdf`;
    doc.save(fileName);
  };

  // Handle submission of appointment rating
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/appointments/rate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ratingData),
      });
      const data = await response.json();
      if (response.ok) {
        setAppointments((prev) =>
          prev.map((appt) =>
            appt._id === ratingData.appointmentId
              ? { ...appt, rating: ratingData.rating, comment: ratingData.comment }
              : appt
          )
        );
        setShowRatingModal(false);
        setRatingData({ appointmentId: null, rating: 0, comment: "" });
      } else {
        throw new Error(data.message || "Failed to submit rating");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle star rating selection
  const handleStarClick = (rating) => {
    setRatingData({ ...ratingData, rating });
  };

  // Render star rating UI
  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-5 h-5 ${
            i <= rating ? "text-yellow-400 fill-current" : "text-gray-500 fill-current"
          } ${interactive ? "cursor-pointer hover:text-yellow-500" : ""}`}
          onClick={interactive ? () => handleStarClick(i) : undefined}
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    }
    return stars;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] flex items-center justify-center">
        <div className="text-gray-600 text-lg animate-pulse">Loading appointments...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] flex items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-[#e1eeff1b] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Filters and Sorting Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <input
            type="text"
            placeholder="Search by provider name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 placeholder-gray-400"
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="cursor-pointer w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="cursor-pointer w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg font-medium">
              {searchQuery || selectedDate || statusFilter
                ? "No matching appointments found."
                : "No appointments found. Book one today!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-10 grid-cols-1 md:grid-cols-2">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-100"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  {/* Appointment Details */}
                  <div className="flex-1 space-y-3">
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                      <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-800">Provider:</strong>{" "}
                        {appointment.user_id?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                      <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-800">Date:</strong>{" "}
                        {new Date(appointment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                      <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-800">Time:</strong>{" "}
                        {appointment.time ||
                          new Date(appointment.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                      <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-800">Message:</strong>{" "}
                        {appointment.message || "No message provided"}
                      </p>
                    </div>
                    {(appointment.status === "active" || appointment.status === "completed") && (
                      <button
                        onClick={() => handleDownloadAppointmentPDF(appointment)}
                        className="cursor-pointer mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 font-medium shadow-sm"
                      >
                        Download PDF
                      </button>
                    )}
                    {appointment.status === "completed" && !appointment.rating && (
                      <button
                        onClick={() => {
                          setRatingData({ ...ratingData, appointmentId: appointment._id });
                          setShowRatingModal(true);
                        }}
                        className="cursor-pointer mt-2 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 font-medium shadow-sm"
                      >
                        Rate This Appointment
                      </button>
                    )}
                  </div>
                  {/* Status, Rating, and QR Code */}
                  <div className="flex flex-col items-center md:w-1/3 space-y-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        appointment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "active"
                          ? "bg-blue-100 text-blue-800"
                          : appointment.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    {appointment.rating && (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-1">
                          {renderStars(appointment.rating)}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          {appointment.comment || "No comment"}
                        </p>
                      </div>
                    )}
                    {(appointment.status === "active" || appointment.status === "completed") && (
                      <div className="mt-4 text-center">
                        <p className="text-gray-700 text-sm font-semibold mb-2">
                          Appointment QR Code :
                        </p>
                        <QRCodeCanvas
                          className="ml-3"
                          value={`${window.location.origin}/download-appointment/${appointment._id}`}
                          size={128}
                          level="H"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-[#0000006c] flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Rate Your Appointment</h3>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="cursor-pointer text-gray-500 hover:text-red-500 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleRatingSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Rating</label>
                  <div className="flex space-x-2">
                    {renderStars(ratingData.rating, true)}
                  </div>
                  {ratingData.rating === 0 && (
                    <p className="text-red-500 text-sm mt-1">Please select a rating</p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Comment</label>
                  <textarea
                    value={ratingData.comment}
                    onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 resize-none"
                    rows="4"
                    placeholder="Share your feedback..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="cursor-pointer px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300 font-medium shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ratingData.rating === 0}
                    className={`cursor-pointer px-6 py-2 rounded-lg text-white font-medium transition-colors duration-300 shadow-sm ${
                      ratingData.rating === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}