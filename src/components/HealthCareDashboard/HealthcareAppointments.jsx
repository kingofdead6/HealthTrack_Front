import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { QRCodeCanvas } from 'qrcode.react';
import { API_BASE_URL } from "../../../api";
import DocPlaceHolder from "/docPic.png"

// HealthcareAppointments component to manage and display appointments
export default function HealthcareAppointments() {
  // State for appointments data and UI control
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [buttonLoading, setButtonLoading] = useState({});
  const navigate = useNavigate();

  // Fetch appointments on component mount
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/healthcare/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok) {
          const sortedAppointments = data.sort((a, b) => new Date(b.date) - new Date(a.date));
          setAppointments(sortedAppointments);
          setFilteredAppointments(sortedAppointments);
        } else {
          throw new Error(data.message || "Failed to fetch appointments");
        }
      } catch (err) {
        setError(err.message);
        if (err.message.includes("Unauthorized")) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [navigate]);

  // Filter and sort appointments
  useEffect(() => {
    let result = [...appointments];

    if (searchQuery) {
      result = result.filter((appt) =>
        (appt.patient_id?.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase())
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

  // Update appointment status
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    const token = localStorage.getItem("token");
    setButtonLoading((prev) => ({ ...prev, [`${appointmentId}-${newStatus}`]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/healthcare/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        setAppointments((prev) =>
          prev.map((appt) =>
            appt._id === appointmentId ? { ...appt, status: newStatus } : appt
          )
        );
      } else {
        throw new Error(data.message || "Failed to update status");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setButtonLoading((prev) => ({ ...prev, [`${appointmentId}-${newStatus}`]: false }));
    }
  };

  // Fetch patient profile by ID
  const fetchPatientProfile = async (patientId) => {
    if (!patientId) {
      setPatientError("Patient profile not available (user deleted)");
      setSelectedPatient(null);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    setPatientLoading(true);
    setPatientError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/profile/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 50)}...`);
      }

      const data = await response.json();
      setSelectedPatient(data.patient);
    } catch (err) {
      setPatientError(`Failed to load profile: ${err.message}`);
    } finally {
      setPatientLoading(false);
    }
  };

  // Handle patient click to fetch profile
  const handlePatientClick = (patientId) => {
    fetchPatientProfile(patientId);
  };

  // Download patient's full profile as PDF
  const downloadMedicalStateAsPDF = () => {
    if (!selectedPatient) {
      alert("No patient profile available to download.");
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(33, 150, 243); // Blue background
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont("helvetica", "bold");
    doc.text("Patient Profile", 20, 20);

    // Content border
    doc.setDrawColor(33, 150, 243);
    doc.setLineWidth(0.5);
    doc.rect(10, 40, 190, 247, 'S');

    // Patient details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    let yOffset = 50;
    const lineHeight = 10;
    const labelWidth = 50;
    const valueWidth = 130;

    const fields = [
      { label: "Name", value: selectedPatient.user_id?.name || "Not provided" },
      { label: "Email", value: selectedPatient.user_id?.email || "Not provided" },
      { label: "Phone Number", value: selectedPatient.user_id?.phone_number || "Not provided" },
      { label: "Gender", value: selectedPatient.gender || "Not set" },
      { label: "Height", value: selectedPatient.height ? `${selectedPatient.height} cm` : "Not set" },
      { label: "Weight", value: selectedPatient.weight ? `${selectedPatient.weight} kg` : "Not set" },
      { label: "Blood Type", value: selectedPatient.blood_type || "Not set" },
      {
        label: "Account Status",
        value:
          selectedPatient.user_id?.isBanned === undefined
            ? "Unknown"
            : selectedPatient.user_id.isBanned
            ? "Banned"
            : "Active",
      },
      { label: "Medical State", value: selectedPatient.medical_state || "Not set" },
    ];

    fields.forEach((field, index) => {
      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(240, 248, 255); // Light blue
        doc.rect(15, yOffset - 5, 180, lineHeight, 'F');
      }

      // Label
      doc.setFont("helvetica", "bold");
      doc.text(field.label + ":", 15, yOffset);

      // Value
      doc.setFont("helvetica", "normal");
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

    const fileName = `${selectedPatient.user_id?.name || "Unknown"}_Profile.pdf`;
    doc.save(fileName);
  };

  // Download appointment details as PDF
  const downloadAppointmentPDF = (appointment) => {
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
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    let yOffset = 50;
    const lineHeight = 10;
    const labelWidth = 50;
    const valueWidth = 130;

    const fields = [
      { label: "Patient Name", value: appointment.patient_id?.name || "Unknown" },
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
      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(240, 248, 255); // Light blue
        doc.rect(15, yOffset - 5, 180, lineHeight, 'F');
      }

      // Label
      doc.setFont("helvetica", "bold");
      doc.text(field.label + ":", 15, yOffset);

      // Value
      doc.setFont("helvetica", "normal");
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

    const fileName = `${appointment.patient_id?.name || "Unknown"}_Appointment_${new Date(appointment.date).toLocaleDateString().replace(/\//g, "-")}.pdf`;
    doc.save(fileName);
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
    <div className="min-h-screen bg-[#E1EEFF] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-4xl">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-3 py-2 h-16 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:font-bold placeholder:text-gray-500 shadow-sm"
              placeholder="Search by patient name..."
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer"
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
            className="w-full sm:w-1/4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Appointment Cards */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg">
              {searchQuery || selectedDate || statusFilter
                ? "No matching appointments found."
                : "No appointments found."}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-2xl shadow-lg p-6 transition-transform duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Profile Picture and QR Code (Top on Mobile) */}
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div
                      className="cursor-pointer"
                      onClick={() => handlePatientClick(appointment.patient_id?._id)}
                    >
                      {appointment.patient_id?.profile_image ? (
                        <img
                          src={appointment.patient_id.profile_image}
                          alt={`${appointment.patient_id.name || "Unknown"}'s profile`}
                          className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/80?text=Image+Not+Found")}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <img
                            src={DocPlaceHolder}
                            alt="Unknown profile"
                            className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200"
                            onError={(e) => (e.target.src = "https://via.placeholder.com/80?text=Image+Not+Found")}
                          />
                        </div>
                      )}
                    </div>
                    <h3
                      className="text-lg font-semibold text-indigo-600 cursor-pointer hover:underline"
                      onClick={() => handlePatientClick(appointment.patient_id?._id)}
                    >
                      {appointment.patient_id?.name || "Unknown"}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        appointment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : appointment.status === "active"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : appointment.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    {(appointment.status === "active" || appointment.status === "completed") && (
                      <div className="mt-4">
                        <p className="text-gray-700 text-sm font-semibold mb-2 text-center">
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

                  {/* Appointment Info (Below on Mobile, Left on Desktop) */}
                  <div className="flex-1 space-y-2 md:order-first">
                    <p className="bg-indigo-50 p-2 rounded-md border border-indigo-200">
                      <strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}
                    </p>
                    <p className="bg-indigo-50 p-2 rounded-md border border-indigo-200">
                      <strong>Time:</strong>{" "}
                      {appointment.time ||
                        new Date(appointment.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </p>
                    <p className="bg-indigo-50 p-2 rounded-md border border-indigo-200">
                      <strong>Duration:</strong> {appointment.duration || 60} minutes
                    </p>
                    <p className="bg-indigo-50 p-2 rounded-md border border-indigo-200">
                      <strong>Message:</strong> {appointment.message || "No message provided"}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      {appointment.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, "active")}
                            disabled={buttonLoading[`${appointment._id}-active`]}
                            className={`px-4 py-2 rounded-lg cursor-pointer ${
                              buttonLoading[`${appointment._id}-active`]
                                ? "bg-green-400"
                                : "bg-green-600 hover:bg-green-700"
                            } text-white`}
                          >
                            {buttonLoading[`${appointment._id}-active`] ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, "rejected")}
                            disabled={buttonLoading[`${appointment._id}-rejected`]}
                            className={`px-4 py-2 rounded-lg cursor-pointer ${
                              buttonLoading[`${appointment._id}-rejected`]
                                ? "bg-red-400"
                                : "bg-red-600 hover:bg-red-700"
                            } text-white`}
                          >
                            {buttonLoading[`${appointment._id}-rejected`] ? "Rejecting..." : "Reject"}
                          </button>
                        </>
                      )}
                      {appointment.status === "active" && (
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, "completed")}
                          disabled={buttonLoading[`${appointment._id}-completed`]}
                          className={`w-full px-4 py-2 rounded-lg cursor-pointer ${
                            buttonLoading[`${appointment._id}-completed`]
                              ? "bg-blue-400"
                              : "bg-blue-600 hover:bg-blue-700"
                          } text-white`}
                        >
                          {buttonLoading[`${appointment._id}-completed`] ? "Completing..." : "Mark Completed"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Profile Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-[#00000034] flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Patient Profile</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="cursor-pointer text-gray-500 hover:text-red-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {patientLoading ? (
              <p className="text-gray-600 text-center animate-pulse">Loading patient details...</p>
            ) : patientError ? (
              <p className="text-red-600 text-center">{patientError}</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  {selectedPatient.user_id?.profile_image ? (
                    <img
                      src={selectedPatient.user_id.profile_image}
                      alt={`${selectedPatient.user_id.name || "Unknown"}'s profile`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-indigo-200 shadow-md"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/80?text=Image+Not+Found")}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium shadow-md">
                      <img
                        src={DocPlaceHolder}
                        alt="Unknown profile"
                        className="w-20 h-20 rounded-full object-cover border-4 border-indigo-200 shadow-md"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/80?text=Image+Not+Found")}
                      />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 text-center">
                  {selectedPatient.user_id?.name || "Unknown"}
                </h3>
                <div className="text-gray-700 text-sm">
                  <p><strong>Email:</strong> {selectedPatient.user_id?.email || "Not provided"}</p>
                  <p><strong>Phone Number:</strong> {selectedPatient.user_id?.phone_number || "Not set"}</p>
                  <p><strong>Gender:</strong> {selectedPatient.gender || "Not set"}</p>
                  <p><strong>Height:</strong> {selectedPatient.height || "Not set"} cm</p>
                  <p><strong>Weight:</strong> {selectedPatient.weight || "Not set"} kg</p>
                  <p><strong>Blood Type:</strong> {selectedPatient.blood_type || "Not set"}</p>
                  <p className="text-gray-700 font-semibold">
                    <strong>Account Status:</strong>{" "}
                    <span
                      className={`px-2 py-1 rounded-lg ${
                        selectedPatient.user_id?.isBanned ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
                      }`}
                    >
                      {selectedPatient.user_id?.isBanned === undefined
                        ? "Unknown"
                        : selectedPatient.user_id.isBanned
                        ? "Banned"
                        : "Active"}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="max-h-40 overflow-y-scroll">
                      <strong>Medical State:</strong> {selectedPatient.medical_state || "Not set"}
                    </span>
                    <button
                      onClick={downloadMedicalStateAsPDF}
                      className="cursor-pointer ml-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                      Download PDF
                    </button>
                  </p>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="cursor-pointer px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}