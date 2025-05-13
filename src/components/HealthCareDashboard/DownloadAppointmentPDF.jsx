import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { API_BASE_URL } from "../../../api";

// Component to handle PDF download for a specific appointment
export default function DownloadAppointmentPDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointment = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Try patient context first
        let appointment = null;
        let context = "patient";
        let patientName = null;

        const patientResponse = await fetch(`${API_BASE_URL}/api/patients/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (patientResponse.ok) {
          const appointmentsData = await patientResponse.json();
          appointment = appointmentsData.find((appt) => appt._id === id);
          if (appointment) {
            // Fetch patient profile for filename
            const profileResponse = await fetch(`${API_BASE_URL}/api/patients/profile`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            const profileData = await profileResponse.json();
            if (profileResponse.ok) {
              patientName = profileData.patient?.name || "Unknown";
            }
          }
        }

        // If not found in patient context, try healthcare context
        if (!appointment) {
          context = "healthcare";
          const healthcareResponse = await fetch(`${API_BASE_URL}/api/healthcare/appointments`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (healthcareResponse.ok) {
            const appointmentsData = await healthcareResponse.json();
            appointment = appointmentsData.find((appt) => appt._id === id);
            // Patient name is included in appointment.patient_id
          } else {
            throw new Error("Failed to fetch appointment from healthcare context");
          }
        }

        if (!appointment) {
          throw new Error("Appointment not found");
        }

        downloadAppointmentPDF(appointment, context, patientName);
        navigate(-1); // Navigate back after download
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

    fetchAppointment();
  }, [id, navigate]);

  // Download appointment details as PDF
  const downloadAppointmentPDF = (appointment, context, patientName) => {
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
    const labelWidth = 50;
    const valueWidth = 130;

    const fields = context === "patient" ? [
      { label: "Provider Name", value: appointment.user_id?.name || "Unknown", highlight: true },
      { label: "Date", value: new Date(appointment.date).toLocaleDateString() },
      {
        label: "Time",
        value: appointment.time || new Date(appointment.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      { label: "Duration", value: `${appointment.duration || 60} minutes` },
      { label: "Status", value: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) },
      { label: "Message", value: appointment.message || "No message provided" },
    ] : [
      { label: "Patient Name", value: appointment.patient_id?.name || "Unknown", highlight: true },
      { label: "Provider Name", value: appointment.user_id?.name || "Unknown", highlight: false },
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

    const fileName = context === "patient" && patientName
      ? `${patientName}_Appointment_${new Date(appointment.date).toLocaleDateString().replace(/\//g, "-")}.pdf`
      : `Appointment_${new Date(appointment.date).toLocaleDateString().replace(/\//g, "-")}.pdf`;
    doc.save(fileName);
  };

  // Render loading or error state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] flex items-center justify-center">
        <div className="text-gray-600 text-lg animate-pulse">Generating PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] flex items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Return null as the download happens automatically
  return null;
}