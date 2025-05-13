/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { API_BASE_URL } from "../../../api";
import jsPDF from "jspdf"; 
import axios from "axios"; 

// PatientProfile component to manage and display patient profile details
export default function PatientProfile({ user }) {
  // State declarations for managing patient data, form inputs, and UI control
  const [patient, setPatient] = useState(null); // Store patient profile data
  const [isEditing, setIsEditing] = useState(false); // Toggle between view and edit modes
  const [formData, setFormData] = useState({
    // Form input fields for editing profile
    gender: "",
    height: "",
    weight: "",
    blood_type: "",
    medical_state: "",
    phone_number: "",
  });
  const [profileImage, setProfileImage] = useState(null); // Store selected profile image file
  const [previewImage, setPreviewImage] = useState(null); // Store URL for image preview
  const [medicalRegister, setMedicalRegister] = useState(null); // Store selected medical register PDF file
  const [medicalRegisterName, setMedicalRegisterName] = useState(""); // Store name for medical register
  const [loading, setLoading] = useState(true); // Indicate loading state for profile fetch
  const [error, setError] = useState(""); // Store error messages
  const [viewingIndex, setViewingIndex] = useState(null); // Track index of PDF being downloaded
  const [deletingIndex, setDeletingIndex] = useState(null); // Track index of PDF being deleted
  const [openingIndex, setOpeningIndex] = useState(null); // Track index of PDF being opened
  const [selectedRegister, setSelectedRegister] = useState(null); // Track selected medical register for actions
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null); // Store blob URL for PDF viewing
  const [isUploading, setIsUploading] = useState(false); // Indicate medical register upload status
  const [isSaving, setIsSaving] = useState(false); // Indicate profile save status
  const navigate = useNavigate(); // Initialize navigation hook

  // Fetch patient profile on component mount and handle cleanup
  useEffect(() => {
    // Async function to fetch patient profile from API
    const fetchPatient = async () => {
      const token = localStorage.getItem("token"); // Get auth token from localStorage
      if (!token || !user) {
        navigate("/login"); // Redirect to login if token or user is missing
        return;
      }
      try {
        setLoading(true); // Set loading state to true
        const response = await fetch(`${API_BASE_URL}/api/patients/profile`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include auth token in headers
            "Content-Type": "application/json",
          },
        });
        const data = await response.json(); // Parse response JSON
        if (response.ok) {
          setPatient(data.patient); // Update patient state with fetched data
          setFormData({
            // Populate form data with patient details or empty strings
            gender: data.patient.gender || "",
            height: data.patient.height || "",
            weight: data.patient.weight || "",
            blood_type: data.patient.blood_type || "",
            medical_state: data.patient.medical_state || "",
            phone_number: data.patient.user_id.phone_number || user.phone_number || "",
          });
          // Enable edit mode if any required fields are missing
          if (
            !data.patient.gender ||
            !data.patient.height ||
            !data.patient.weight ||
            !data.patient.blood_type ||
            !data.patient.medical_state
          ) {
            setIsEditing(true);
          }
        } else if (response.status === 401) {
          localStorage.removeItem("token"); // Remove token if unauthorized
          navigate("/login"); // Redirect to login
        } else {
          setPatient(null); // Clear patient data on error
          setFormData({ ...formData, phone_number: user.phone_number || "" }); // Set phone number from user prop
        }
      } catch (error) {
        setPatient(null); // Clear patient data on fetch error
        setFormData({ ...formData, phone_number: user.phone_number || "" }); // Set phone number from user prop
      } finally {
        setLoading(false); // Reset loading state
      }
    };
    fetchPatient(); // Call fetch function

    // Cleanup function to revoke PDF blob URL on component unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl); // Free memory by revoking blob URL
      }
    };
  }, [navigate, user, pdfBlobUrl]); // Dependencies for useEffect

  // Handle changes to form input fields
  const handleChange = (e) => {
    const { name, value } = e.target; // Extract input name and value
    setFormData({ ...formData, [name]: value }); // Update form data state
  };

  // Handle profile image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0]; // Get selected file
    if (file) {
      setProfileImage(file); // Store file in state
      const previewUrl = URL.createObjectURL(file); // Create preview URL
      setPreviewImage(previewUrl); // Store preview URL
    }
  };

  // Handle medical register PDF file selection
  const handleMedicalRegisterChange = (e) => {
    const file = e.target.files[0]; // Get selected file
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file"); // Validate file type
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB"); // Validate file size
        return;
      }
      setMedicalRegister(file); // Store file in state
      setError(""); // Clear any previous errors
    }
  };

  // Handle medical register name input
  const handleMedicalRegisterNameChange = (e) => {
    setMedicalRegisterName(e.target.value); // Update medical register name
  };

  // Remove selected medical register file
  const handleRemoveMedicalRegister = () => {
    setMedicalRegister(null); // Clear medical register file
    setMedicalRegisterName(""); // Clear medical register name
    const input = document.querySelector('input[type="file"][accept="application/pdf"]'); // Get file input
    if (input) input.value = null; // Reset file input
  };

  // Submit updated profile data to API
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    const token = localStorage.getItem("token"); // Get auth token
    if (!token) {
      navigate("/login"); // Redirect to login if no token
      return;
    }

    const formDataToSend = new FormData(); // Create FormData for multipart request
    formDataToSend.append("gender", formData.gender); // Append form fields
    formDataToSend.append("height", formData.height);
    formDataToSend.append("weight", formData.weight);
    formDataToSend.append("blood_type", formData.blood_type);
    formDataToSend.append("medical_state", formData.medical_state);
    formDataToSend.append("phone_number", formData.phone_number);
    if (profileImage) {
      formDataToSend.append("profile_image", profileImage); // Append profile image if selected
    }

    try {
      setIsSaving(true); // Indicate saving in progress
      const response = await fetch(`${API_BASE_URL}/api/patients/profile`, {
        method: "PUT", // Update profile via PUT request
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
        },
        body: formDataToSend, // Send form data
      });
      const data = await response.json(); // Parse response
      if (response.ok) {
        setPatient(data.patient); // Update patient state with new data
        setIsEditing(false); // Exit edit mode
        setProfileImage(null); // Clear profile image
        setPreviewImage(null); // Clear preview image
        // Refresh patient profile to ensure latest data
        const refreshResponse = await fetch(`${API_BASE_URL}/api/patients/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const refreshedData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setPatient(refreshedData.patient); // Update patient state with refreshed data
        }
      } else if (response.status === 401) {
        localStorage.removeItem("token"); // Remove token if unauthorized
        navigate("/login"); // Redirect to login
      } else {
        throw new Error(data.message || "Failed to update profile"); // Throw error on failure
      }
    } catch (error) {
      alert("Error updating profile: " + error.message); // Display error to user
    } finally {
      setIsSaving(false); // Reset saving state
    }
  };

  // Upload medical register PDF to API
  const handleMedicalRegisterUpload = async () => {
    const token = localStorage.getItem("token"); // Get auth token
    if (!token) {
      navigate("/login"); // Redirect to login if no token
      return;
    }
    if (!medicalRegister) {
      alert("Please select a PDF file to upload."); // Validate file selection
      return;
    }

    const formDataToSend = new FormData(); // Create FormData for multipart request
    formDataToSend.append("medical_register", medicalRegister); // Append PDF file
    if (medicalRegisterName) {
      formDataToSend.append("name", medicalRegisterName); // Append optional name
    }

    try {
      setIsUploading(true); // Indicate uploading in progress
      const response = await fetch(`${API_BASE_URL}/api/patients/medical-register`, {
        method: "POST", // Upload via POST request
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
        },
        body: formDataToSend, // Send form data
      });
      const data = await response.json(); // Parse response
      if (response.ok) {
        // Refresh patient profile to include new medical register
        const refreshResponse = await fetch(`${API_BASE_URL}/api/patients/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const refreshedData = await refreshResponse.json();
        if (refreshResponse.ok) {
          setPatient(refreshedData.patient); // Update patient state
        }
        setMedicalRegister(null); // Clear medical register file
        setMedicalRegisterName(""); // Clear medical register name
        const input = document.querySelector('input[type="file"][accept="application/pdf"]'); // Get file input
        if (input) input.value = null; // Reset file input
      } else if (response.status === 401) {
        localStorage.removeItem("token"); // Remove token if unauthorized
        navigate("/login"); // Redirect to login
      } else {
        throw new Error(data.message || "Failed to upload medical register"); // Throw error on failure
      }
    } catch (error) {
      alert("Error uploading medical register: " + error.message); // Display error to user
    } finally {
      setIsUploading(false); // Reset uploading state
    }
  };

  // Request account deletion
  const handleDeleteRequest = async () => {
    const token = localStorage.getItem("token"); // Get auth token
    if (!token) {
      navigate("/login"); // Redirect to login if no token
      return;
    }
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return; // Cancel if user does not confirm
    }
    try {
      const frontendUrl = window.location.origin; // Get frontend URL
      const response = await fetch(`${API_BASE_URL}/api/patients/delete-request`, {
        method: "POST", // Send deletion request
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ frontendUrl }), // Include frontend URL
      });
      const data = await response.json(); // Parse response
      if (response.ok) {
        alert("A confirmation email has been sent. Please check your inbox."); // Notify user
      } else {
        throw new Error(data.message || "Failed to request account deletion"); // Throw error on failure
      }
    } catch (error) {
      alert(`Error requesting account deletion: ${error.message}`); // Display error to user
    }
  };

  // Generate and download medical state as PDF
  const downloadMedicalState = () => {
  if (!patient?.medical_state) {
    alert("No medical state information available to download.");
    return;
  }

  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(33, 150, 243); // Blue background (#2196F3)
  doc.rect(0, 0, 210, 30, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255); // White text
  doc.setFont("helvetica", "bold");
  doc.text("Medical State Information", 20, 20);

  // Content border
  doc.setDrawColor(33, 150, 243);
  doc.setLineWidth(0.5);
  doc.rect(10, 40, 190, 247, 'S');

  // Content details
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  
  let yOffset = 50;
  const lineHeight = 10;
  const labelWidth = 50;
  const valueWidth = 130;

  const fields = [
    { label: "Patient Name", value: user.name || "Unknown", highlight: true },
    { label: "Date", value: new Date().toLocaleDateString() },
    { label: "Medical State", value: patient.medical_state || "No medical state provided" },
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

  const fileName = `MedicalState_${user.name || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
};

  // Download medical register PDF from API
  const handleDownloadPDF = async (index) => {
    try {
      const token = localStorage.getItem("token"); // Get auth token
      if (!token) {
        navigate("/login"); // Redirect to login if no token
        return;
      }

      setViewingIndex(index); // Track downloading index
      setError(""); // Clear errors

      const response = await axios.get(`${API_BASE_URL}/api/patients/medical-register/${index}/download`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
        },
        responseType: "blob", // Expect binary data
      });

      const blob = new Blob([response.data], { type: "application/pdf" }); // Create blob from response
      const url = window.URL.createObjectURL(blob); // Create blob URL
      const link = document.createElement("a"); // Create download link
      link.href = url; // Set link href

      let fileName = `medical-register-${index}.pdf`; // Default file name
      const contentDisposition = response.headers["content-disposition"]; // Check for file name in headers
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/); // Extract file name
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1]; // Use provided file name
        }
      }

      link.download = fileName; // Set download file name
      document.body.appendChild(link); // Append link to DOM
      link.click(); // Trigger download
      document.body.removeChild(link); // Remove link from DOM
      window.URL.revokeObjectURL(url); // Free blob URL
    } catch (error) {
      // Handle specific error cases
      const message =
        error.response?.status === 404
          ? "Medical register not found."
          : error.response?.status === 403
          ? "Unauthorized access."
          : `Failed to download PDF: ${error.response?.data?.message || error.message}`;
      setError(message); // Set error message
    } finally {
      setViewingIndex(null); // Reset downloading index
    }
  };

  // Open medical register PDF in new tab
  const handleOpenPDF = async (index) => {
    try {
      const token = localStorage.getItem("token"); // Get auth token
      if (!token) {
        navigate("/login"); // Redirect to login if no token
        return;
      }

      setOpeningIndex(index); // Track opening index
      setError(""); // Clear errors

      const response = await axios.get(`${API_BASE_URL}/api/patients/medical-register/${index}/view`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
        },
        responseType: "blob", // Expect binary data
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: "application/pdf" }); // Create blob from response
        const blobUrl = URL.createObjectURL(blob); // Create blob URL
        window.open(blobUrl, "_blank"); // Open PDF in new tab
        setPdfBlobUrl(blobUrl); // Store blob URL
      } else {
        throw new Error("Failed to fetch PDF for viewing"); // Throw error on failure
      }
    } catch (error) {
      // Handle specific error cases
      const message =
        error.response?.status === 404
          ? "Medical register not found."
          : error.response?.status === 403
          ? "Unauthorized access."
          : `Failed to open PDF: ${error.response?.data?.message || error.message}`;
      setError(message); // Set error message
    } finally {
      setOpeningIndex(null); // Reset opening index
    }
  };

  // Delete medical register PDF from API
  const handleDeletePDF = async (index) => {
    const token = localStorage.getItem("token"); // Get auth token
    if (!token) {
      navigate("/login"); // Redirect to login if no token
      return;
    }

    if (!window.confirm("Are you sure you want to delete this medical register? This action cannot be undone.")) {
      return; // Cancel if user does not confirm
    }

    try {
      setDeletingIndex(index); // Track deleting index
      setError(""); // Clear errors

      await axios.delete(`${API_BASE_URL}/api/patients/medical-register/${index}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include auth token
        },
      }); // Delete medical register

      // Refresh patient profile to reflect deletion
      const refreshResponse = await fetch(`${API_BASE_URL}/api/patients/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const refreshedData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setPatient(refreshedData.patient); // Update patient state
      }
    } catch (error) {
      // Handle specific error cases
      const message =
        error.response?.status === 404
          ? "Medical register not found."
          : error.response?.status === 403
          ? "Unauthorized access."
          : `Failed to delete PDF: ${error.response?.data?.message || error.message}`;
      setError(message); // Set error message
    } finally {
      setDeletingIndex(null); // Reset deleting index
    }
  };

  // Toggle selection of medical register for actions
  const handleSelectRegister = (index) => {
    setSelectedRegister(selectedRegister === index ? null : index); // Toggle selected register
    setPdfBlobUrl(null); // Clear PDF blob URL
  };

  // Determine account status based on ban state
  const accountStatus = patient?.user_id?.isBanned ? "banned" : "activated";

  // Render loading state if user is undefined
  if (!user) {
    return (
      <div className="min-h-screen bg-[#E1EEFF] p-4 flex items-center justify-center">
        <p className="text-center text-gray-500 text-lg">Loading user data...</p>
      </div>
    );
  }

  // Main UI with profile editing and viewing modes
  return (
    <div className="min-h-screen bg-[#E1EEFF] p-4 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-5 md:p-8 lg:p-10">
        {/* Profile Header */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6 text-center md:text-left">
          Your Profile Details
        </h2>

        {/* Display Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}

        {/* Display Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-gray-500 text-lg">Loading patient details...</p>
          </div>
        ) : (
          <>
            {isEditing ? (
              /* Edit Profile Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Profile Image Section */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2 text-lg">Profile Image</label>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                      {previewImage ? (
                        <img src={previewImage} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : patient?.user_id?.profile_image ? (
                        <img
                          src={patient.user_id.profile_image}
                          alt="Current profile"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.src = "https://via.placeholder.com/128?text=No+Image")}
                        />
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <p className="text-sm text-gray-500 mt-1">Upload a profile picture (optional)</p>
                    </div>
                  </div>
                </div>

                {/* Medical Register Upload Section */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2 text-lg">Medical Register (PDF)</label>
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex-1 w-full space-y-3">
                      <input
                        type="text"
                        value={medicalRegisterName}
                        onChange={handleMedicalRegisterNameChange}
                        placeholder="Enter PDF name (optional)"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleMedicalRegisterChange}
                        className="cursor-pointer w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <p className="text-sm text-gray-500">Upload a medical register (PDF only, multiple files allowed)</p>
                      {medicalRegister && (
                        <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg">
                          <svg
                            className="w-6 h-6 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm text-gray-700 truncate max-w-xs">{medicalRegister.name}</p>
                          <button
                            onClick={handleRemoveMedicalRegister}
                            className="cursor-pointer px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {medicalRegister && (
                        <button
                          type="button"
                          onClick={handleMedicalRegisterUpload}
                          disabled={isUploading}
                          className={`cursor-pointer mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 ${
                            isUploading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {isUploading ? "Uploading..." : "Upload Medical Register"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Fields for Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="cursor-pointer w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Blood Type</label>
                    <select
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleChange}
                      className="cursor-pointer w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                {/* Medical State Textarea */}
                <div className="mt-4">
                  <label className="block text-gray-700 font-medium mb-2">Medical State</label>
                  <textarea
                    name="medical_state"
                    value={formData.medical_state}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    rows="4"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Provide important information about your health condition</p>
                </div>

                {/* Form Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false); // Exit edit mode
                      setProfileImage(null); // Clear profile image
                      setPreviewImage(null); // Clear preview image
                      setMedicalRegister(null); // Clear medical register
                      setMedicalRegisterName(""); // Clear medical register name
                      setError(""); // Clear errors
                    }}
                    className="cursor-pointer px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-200 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`cursor-pointer px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 w-full sm:w-auto ${
                      isSaving ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSaving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              /* Profile View Mode */
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Information Section */}
                <div className="w-full md:w-1/2 bg-blue-50 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col items-center mb-6">
                    {patient?.user_id?.profile_image ? (
                      <img
                        src={patient.user_id.profile_image}
                        alt={`${user.name}'s profile`}
                        className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md mb-3"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/128?text=No+Image")}
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-4 border-white shadow-md mb-3">
                        <span className="font-medium">{user.name?.charAt(0) || "?"}</span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900">{user.name || "Not provided"}</h3>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          accountStatus === "activated" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {accountStatus}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{user.email || "Not provided"}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2">
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">
                        {patient?.user_id?.phone_number || user.phone_number || "Not provided"}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2">
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{patient?.gender || "Not provided"}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2">
                      <p className="text-sm text-gray-500">Height</p>
                      <p className="text-sm font-medium text-gray-900">
                        {patient?.height ? `${patient.height} cm` : "Not provided"}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2">
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="text-sm font-medium text-gray-900">
                        {patient?.weight ? `${patient.weight} kg` : "Not provided"}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <p className="text-sm text-gray-500">Blood Type</p>
                      <p className="text-sm font-medium text-gray-900">{patient?.blood_type || "Not provided"}</p>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-1/2 flex flex-col">
                  {/* Medical State Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19 a2 2 0 01-2 2z"
                          ></path>
                        </svg>
                        Medical State
                      </h3>
                      <button
                        onClick={downloadMedicalState}
                        disabled={!patient?.medical_state}
                        className="cursor-pointer text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                        title="Download medical state information"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          ></path>
                        </svg>
                        Download
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 h-40 overflow-y-auto">
                      <p className="text-gray-700">
                        {patient?.medical_state || "No medical information provided yet."}
                      </p>
                    </div>
                  </div>
                  {/* Medical Registers Section */}
                  {patient?.medical_register?.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-blue-500"
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
                            ></path>
                          </svg>
                          Medical Registers
                        </h3>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <ul className="space-y-2">
                          {[...patient.medical_register].reverse().map((register, idx) => {
                            const originalIndex = patient.medical_register.length - 1 - idx;
                            const isSelected = selectedRegister === originalIndex;
                            return (
                              <li key={originalIndex} className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleSelectRegister(originalIndex)}
                                    className="cursor-pointer text-sm text-gray-700 flex-1 text-left hover:text-blue-600 transition-colors duration-200 truncate"
                                  >
                                    {register.name || `Medical Register ${originalIndex + 1}`}
                                  </button>
                                </div>
                                {isSelected && (
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => handleOpenPDF(originalIndex)}
                                      disabled={openingIndex === originalIndex}
                                      className={`cursor-pointer flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors text-sm ${
                                        openingIndex === originalIndex ? "opacity-50 cursor-not-allowed" : ""
                                      }`}
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        ></path>
                                      </svg>
                                      {openingIndex === originalIndex ? "Opening..." : "Open"}
                                    </button>
                                    <button
                                      onClick={() => handleDownloadPDF(originalIndex)}
                                      disabled={viewingIndex === originalIndex}
                                      className={`cursor-pointer flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-sm ${
                                        viewingIndex === originalIndex ? "opacity-50 cursor-not-allowed" : ""
                                      }`}
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        ></path>
                                      </svg>
                                      {viewingIndex === originalIndex ? "Downloading..." : "Download"}
                                    </button>
                                    <button
                                      onClick={() => handleDeletePDF(originalIndex)}
                                      disabled={deletingIndex === originalIndex}
                                      className={`cursor-pointer flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors text-sm ${
                                        deletingIndex === originalIndex ? "opacity-50 cursor-not-allowed" : ""
                                      }`}
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M6 18L18 6M6 6l12 12"
                                        ></path>
                                      </svg>
                                      {deletingIndex === originalIndex ? "Deleting..." : "Delete"}
                                    </button>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                  {/* Action Buttons for Editing and Deleting Account */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="cursor-pointer flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center justify-center"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path>
                      </svg>
                      Edit Profile
                    </button>
                    <button
                      onClick={handleDeleteRequest}
                      className="cursor-pointer flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium flex items-center justify-center"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12"
                        ></path>
                      </svg>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}