import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { API_BASE_URL } from "../../../api";

// Component for adding a new admin user
export default function AddAdmin() {
  // State for form data, errors, success message, and UI
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone_number.replace(/\s/g, ""))) {
      newErrors.phone_number = "Phone number must be exactly 10 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is complete
  const isFormComplete = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      formData.phone_number.trim()
    );
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone_number") {
      const cleanedValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, [name]: cleanedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrors({ ...errors, [name]: null });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/add-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add admin");
      }

      setSuccess("Admin added successfully");
      setFormData({ name: "", email: "", password: "", phone_number: "" });
      setErrors({});
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Animation variants for motion components
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, delay: i * 0.1, ease: "easeOut" },
    }),
  };

  const buttonVariants = {
    disabled: { scale: 1, opacity: 0.6 },
    enabled: {
      scale: [1, 1.02, 1],
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 -mt-25">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_5px_rgba(59,130,246,0.7),0_0_25px_5px_rgba(147,197,253,0.7)]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-50" />
        <h2 className="text-4xl font-extrabold text-center mb-8 text-indigo-700 relative z-10">
          Add New Admin
        </h2>
        <AnimatePresence>
          {errors.general && (
            <motion.div
              className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200 relative z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {errors.general}
            </motion.div>
          )}
          {success && (
            <motion.div
              className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm border border-green-200 relative z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {[
            { name: "name", label: "Full Name", type: "text", placeholder: "Enter full name" },
            { name: "email", label: "Email Address", type: "email", placeholder: "Enter email address" },
            { name: "password", label: "Password (it should contain a capital letter and a number):", type: showPassword ? "text" : "password", placeholder: "Enter password" },
            { name: "phone_number", label: "Phone Number", type: "tel", placeholder: "Enter 10-digit phone number" },
          ].map((field, index) => (
            <motion.div key={field.name} custom={index} variants={inputVariants} initial="hidden" animate="visible">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <div className="relative">
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-xl border-2 ${
                    errors[field.name] ? "border-red-400" : "border-gray-200"
                  } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-gray-800 placeholder-gray-400 shadow-sm`}
                  placeholder={field.placeholder}
                  maxLength={field.name === "phone_number" ? 10 : undefined}
                  pattern={field.name === "phone_number" ? "\\d{10}" : undefined}
                />
                {field.name === "password" && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
              <AnimatePresence>
                {errors[field.name] && (
                  <motion.p
                    className="text-red-500 text-xs mt-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors[field.name]}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          <motion.button
            type="submit"
            disabled={loading || !isFormComplete()}
            variants={buttonVariants}
            initial="disabled"
            animate={loading || !isFormComplete() ? "disabled" : "enabled"}
            whileHover={loading || !isFormComplete() ? {} : "hover"}
            whileTap={loading || !isFormComplete() ? {} : "tap"}
            className={`w-full py-3 px-4 rounded-full text-white font-semibold transition-all duration-200 flex items-center justify-center shadow-md ${
              loading || !isFormComplete()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 cursor-pointer"
            }`}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {loading ? "Adding..." : "Add Admin"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}