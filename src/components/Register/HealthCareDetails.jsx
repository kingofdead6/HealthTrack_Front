import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import doctorImg from "../../assets/doctor.svg";
import nurseImg from "../../assets/Nurse.svg";
import laboratoryImg from "../../assets/Laboratory.svg";
import pharmacyImg from "../../assets/Pharmacist.svg";
import { FaUpload, FaPlus, FaMinus } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";

export default function HealthcareDetails() {
  // State for form data, certificate preview, and UI controls
  const [formData, setFormData] = useState({
    location_link: "",
    working_hours: "",
    can_deliver: false,
    certificate: null,
  });
  const [certificatePreview, setCertificatePreview] = useState(null);
  const [error, setError] = useState(null);
  const [showSpecialityList, setShowSpecialityList] = useState(false);
  const [expandedSpeciality, setExpandedSpeciality] = useState(null);
  const { state } = useLocation();
  const navigate = useNavigate();
  const healthcareType = state?.formData?.healthcare_type;

  // Initialize type-specific data based on healthcare type
  const initialTypeSpecificData = {
    doctor: { speciality: "", clinic_name: "" },
    nurse: { ward: "", clinic_name: "" },
    laboratory: { lab_name: "", equipment: "", clinic_name: "" },
    pharmacy: { pharmacy_name: "" },
  };

  const [typeSpecificData, setTypeSpecificData] = useState(initialTypeSpecificData[healthcareType] || {});

  // Specialty options for doctors
  const specialties = {
    "General Medicine": ["Family Medicine", "Preventive Medicine", "Geriatric Medicine"],
    "Pediatrics": ["Neonatology", "Pediatric Cardiology", "Pediatric Endocrinology"],
    "Gynecology & Obstetrics": ["Reproductive Medicine", "Maternal-Fetal Medicine", "Gynecologic Oncology"],
    "Cardiology": ["Interventional Cardiology", "Pediatric Cardiology", "Electrophysiology"],
    "Internal Medicine": ["Endocrinology", "Rheumatology", "Gastroenterology", "Nephrology"],
    "Dermatology": ["Cosmetic Dermatology", "Pediatric Dermatology"],
    "Ophthalmology": ["Retina Specialist", "Pediatric Ophthalmology", "Cataract and Refractive Surgery"],
    "ENT (Ear, Nose, Throat)": ["Otology", "Rhinology", "Laryngology"],
    "Orthopedic Surgery": ["Spine Surgery", "Sports Medicine", "Joint Replacement"],
    "Neurology": ["Epileptology", "Stroke Specialist", "Multiple Sclerosis"],
    "Psychiatry": ["Child & Adolescent Psychiatry", "Addiction Psychiatry", "Geriatric Psychiatry"],
    "Pulmonology": ["Sleep Medicine", "Interventional Pulmonology", "Tuberculosis Specialist"],
    "Radiology": ["Interventional Radiology", "Neuroradiology", "Musculoskeletal Imaging"],
    "Dentistry": ["Orthodontics", "Oral Surgery", "Periodontics"],
    "Surgery": ["General Surgery", "Laparoscopic Surgery", "Bariatric Surgery"],
    "Anesthesiology": ["Pain Management", "Critical Care Anesthesia"],
  };

  // Images for different healthcare types
  const typeImages = {
    doctor: doctorImg,
    nurse: nurseImg,
    laboratory: laboratoryImg,
    pharmacy: pharmacyImg,
  };

  // Load form data from state on mount
  useEffect(() => {
    if (state?.formData) {
      const loadedFormData = {
        location_link: state.formData.location_link || "",
        working_hours: state.formData.working_hours || "",
        can_deliver: state.formData.can_deliver === "true" || state.formData.can_deliver === true,
        certificate: state.formData.certificate,
      };
      setFormData(loadedFormData);

      if (state.formData.certificate instanceof File) {
        setCertificatePreview(URL.createObjectURL(state.formData.certificate));
      } else if (typeof state.formData.certificate === "string" && state.formData.certificate.startsWith("data:image/")) {
        setCertificatePreview(state.formData.certificate);
      }

      const typeSpecificKeys = Object.keys(initialTypeSpecificData[healthcareType] || {});
      const loadedTypeSpecific = {};
      typeSpecificKeys.forEach((key) => {
        loadedTypeSpecific[key] = state.formData[key] || "";
      });
      setTypeSpecificData(loadedTypeSpecific);
    }
  }, [state, healthcareType]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "certificate") {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, certificate: reader.result });
          setCertificatePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFormData({ ...formData, certificate: null });
        setCertificatePreview(null);
      }
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (["speciality", "ward", "lab_name", "equipment", "pharmacy_name", "clinic_name"].includes(name)) {
      setTypeSpecificData({ ...typeSpecificData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Toggle speciality category expansion
  const handleSpecialityToggle = (speciality) => {
    setExpandedSpeciality(expandedSpeciality === speciality ? null : speciality);
  };

  // Handle sub-speciality selection
  const handleSubSpecialitySelect = (speciality, subSpeciality) => {
    setTypeSpecificData({ ...typeSpecificData, speciality: subSpeciality });
    setShowSpecialityList(false);
    setExpandedSpeciality(null);
  };

  // Toggle speciality list visibility
  const toggleSpecialityList = () => {
    setShowSpecialityList(!showSpecialityList);
    if (showSpecialityList) {
      setExpandedSpeciality(null);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const requiredFields = {
      doctor: ["location_link", "working_hours", "speciality", "certificate"],
      nurse: ["location_link", "working_hours", "certificate"],
      laboratory: ["location_link", "working_hours", "lab_name", "certificate"],
      pharmacy: ["location_link", "working_hours", "pharmacy_name", "certificate"],
    };

    const isComplete =
      requiredFields[healthcareType].every((field) =>
        field === "certificate" ? formData[field] : formData[field]?.toString().trim() !== ""
      ) &&
      Object.keys(typeSpecificData)
        .filter((key) => requiredFields[healthcareType].includes(key))
        .every((key) => typeSpecificData[key].toString().trim() !== "");

    if (!isComplete) {
      setError("Please fill in all required fields");
      return;
    }

    const updatedFormData = {
      ...formData,
      ...typeSpecificData,
      healthcare_type: healthcareType,
    };

    if (state.formData) {
      for (const key in state.formData) {
        if (key !== "healthcare_type" && key !== "user_type" && key !== "sub_speciality") {
          updatedFormData[key] = state.formData[key];
        }
      }
    }

    updatedFormData.user_type = "healthcare";

    navigate("/register/HealthcareFinalStep", { state: { formData: updatedFormData } });
  };

  // Navigate back to previous step
  const handleBack = () => {
    const updatedFormData = {
      ...state.formData,
      ...formData,
      ...typeSpecificData,
    };
    navigate("/register/HealthcareTypeSelection", { state: { formData: updatedFormData } });
  };

  // Check if form is complete
  const isFormComplete =
    formData.location_link.trim() !== "" &&
    formData.working_hours.trim() !== "" &&
    formData.certificate !== null &&
    (healthcareType !== "doctor" || (typeSpecificData.speciality.trim() !== "")) &&
    (healthcareType !== "laboratory" || typeSpecificData.lab_name.trim() !== "") &&
    (healthcareType !== "pharmacy" || typeSpecificData.pharmacy_name.trim() !== "");

  const workingHoursOptions = ["8 AM - 4 PM", "9 AM - 5 PM", "10 AM - 6 PM", "24/7"];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 mx-12 mt-16">
      {/* Back Arrow Button */}
      <button
        onClick={handleBack}
        className="cursor-pointer absolute top-1/6 left-1/15 flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-300 ease-in-out"
        title="Go back"
      >
        <IoArrowBack size={24} />
      </button>
      <div className="w-full max-w-5xl pt-6 pb-6 flex flex-col md:flex-row">
        {/* Left Section (Decorative) */}
        <div className="hidden md:flex md:w-1/2 bg-blue-200 p-6 rounded-r-4xl rounded-l-4xl mr-6">
          <div className="flex flex-col items-center w-full">
            <h2 className="text-4xl font-bold pt-10 text-black mb-4">
              Register as a :{" "}
              <span className="text-blue-800">
                {healthcareType.charAt(0).toUpperCase() + healthcareType.slice(1).toLowerCase()}
              </span>
            </h2>
            <img src={typeImages[healthcareType]} alt={healthcareType} className="w-3/4 pt-10" />
          </div>
        </div>

        {/* Right Section (Form) */}
        <div className="-mx-10 md:mx-0 md:w-1/2 p-6 shadow-2xl rounded-r-4xl rounded-l-4xl bg-white">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
            {healthcareType.charAt(0).toUpperCase() + healthcareType.slice(1).toLowerCase()} Details
          </h2>

          {/* Error Message */}
          {error && <div className="bg-red-100 text-red-700 p-3 mb-6 rounded-2xl text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Link Input */}
            <div>
              <label className="block p-2 text-gray-500">Location Link:</label>
              <input
                name="location_link"
                placeholder="Enter location link"
                value={formData.location_link}
                onChange={handleChange}
                className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>

            {/* Working Hours Dropdown */}
            <div>
              <label className="block p-2 text-gray-500">Working Hours:</label>
              <select
                name="working_hours"
                value={formData.working_hours}
                onChange={handleChange}
                className="cursor-pointer w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              >
                <option value="">Select Working Hours</option>
                {workingHoursOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Can Deliver Toggle */}
            <div className="flex items-center justify-between p-2">
              <label className="text-gray-500 font-medium">Can Deliver:</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  name="can_deliver"
                  type="checkbox"
                  checked={formData.can_deliver}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                    formData.can_deliver ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                      formData.can_deliver ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </div>
              </label>
            </div>

            {/* Certificate Upload */}
            <div>
              <label className="block p-2 text-gray-500">Certificate (Upload Image):</label>
              <div className="relative">
                <input
                  name="certificate"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="cursor-pointer w-full p-3 pr-10 border rounded-2xl text-gray-500 file:hidden"
                  required={!formData.certificate}
                />
                <FaUpload className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600" />
              </div>
              {certificatePreview && (
                <img
                  src={certificatePreview}
                  alt="Certificate Preview"
                  className="mt-2 w-32 h-32 object-cover rounded shadow-md"
                />
              )}
            </div>

            {/* Doctor-Specific Fields */}
            {healthcareType === "doctor" && (
              <>
                <div>
                  <label className="block p-2 text-gray-500">Speciality:</label>
                  <input
                    name="speciality"
                    placeholder="Select speciality"
                    value={typeSpecificData.speciality || ""}
                    onClick={toggleSpecialityList}
                    readOnly
                    className="cursor-pointer w-full p-3 border rounded-2xl bg-gray-50 text-gray-600 focus:outline-none"
                    required
                  />
                  <AnimatePresence>
                    {showSpecialityList && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-2xl bg-white shadow-sm"
                      >
                        {Object.keys(specialties).map((s) => (
                          <div key={s} className="border-b border-gray-100 last:border-b-0">
                            <button
                              type="button"
                              onClick={() => handleSpecialityToggle(s)}
                              className="cursor-pointer w-full flex items-center justify-between p-3 text-gray-700 hover:bg-blue-50 transition duration-200"
                            >
                              <span className="font-medium">{s}</span>
                              <motion.div
                                animate={{ rotate: expandedSpeciality === s ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                {expandedSpeciality === s ? (
                                  <FaMinus className="text-blue-600" />
                                ) : (
                                  <FaPlus className="text-blue-600" />
                                )}
                              </motion.div>
                            </button>
                            <AnimatePresence>
                              {expandedSpeciality === s && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                  className="pl-6 bg-gray-50 overflow-hidden"
                                >
                                  {specialties[s].map((sub) => (
                                    <button
                                      key={sub}
                                      type="button"
                                      onClick={() => handleSubSpecialitySelect(s, sub)}
                                      className="cursor-pointer w-full text-left p-2 text-gray-600 hover:bg-blue-100 rounded transition duration-200"
                                    >
                                      {sub}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <label className="block p-2 text-gray-500">Clinic Name (Optional):</label>
                  <input
                    name="clinic_name"
                    placeholder="Enter clinic name"
                    value={typeSpecificData.clinic_name}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </>
            )}

            {/* Nurse-Specific Fields */}
            {healthcareType === "nurse" && (
              <>
                <div>
                  <label className="block p-2 text-gray-500">Ward/Department (Optional):</label>
                  <input
                    name="ward"
                    placeholder="e.g., ICU, Pediatrics"
                    value={typeSpecificData.ward}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block p-2 text-gray-500">Clinic Name (Optional):</label>
                  <input
                    name="clinic_name"
                    placeholder="Enter clinic name"
                    value={typeSpecificData.clinic_name}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </>
            )}

            {/* Laboratory-Specific Fields */}
            {healthcareType === "laboratory" && (
              <>
                <div>
                  <label className="block p-2 text-gray-500">Lab Name:</label>
                  <input
                    name="lab_name"
                    placeholder="Enter laboratory name"
                    value={typeSpecificData.lab_name}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  />
                </div>
                <div>
                  <label className="block p-2 text-gray-500">Key Equipment (Optional):</label>
                  <input
                    name="equipment"
                    placeholder="e.g., X-ray, MRI"
                    value={typeSpecificData.equipment}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block p-2 text-gray-500">Clinic Name (Optional):</label>
                  <input
                    name="clinic_name"
                    placeholder="Enter clinic name"
                    value={typeSpecificData.clinic_name}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </>
            )}

            {/* Pharmacy-Specific Fields */}
            {healthcareType === "pharmacy" && (
              <>
                <div>
                  <label className="block p-2 text-gray-500">Pharmacy Name:</label>
                  <input
                    name="pharmacy_name"
                    placeholder="Enter pharmacy name"
                    value={typeSpecificData.pharmacy_name}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-2/4 mx-auto block text-white p-3 rounded-2xl shadow-md font-semibold transition duration-300 hover:shadow-lg ${
                isFormComplete ? "cursor-pointer bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!isFormComplete}
            >
              Next
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}