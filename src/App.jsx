import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PatientRegister from "./components/Register/PatientRegister";
import HealthcareRegister from "./components/Register/HealthCareRegister";
import HealthcareTypeSelection from "./components/Register/HealthcareTypeSelection";
import HealthcareDetails from "./components/Register/HealthCareDetails";
import HealthcareFinalStep from "./components/Register/HealthcareFinalStep";
import Register from "./pages/Register/page";
import Login from "./pages/Login/page";
import Admin from "./pages/Admin/page";
import Home from "./pages/Home/page";
import Chatbot from "./components/ChatBot/ChatBot";
import Patient from "./pages/Patient/page";
import DeleteAccount from "./components/PatientDashboard/DeleteAccount";
import HealthCare from "./pages/HealthCare/page";
import NotFound from "./pages/NotFound/page";
import ResetPassword from "./components/Login/ResetPassword";
import ChangePassword from "./components/Login/ChangePassword";
import OurTeam from "./pages/OurTeam/page";
import Location from "./pages/Location/page";
import PrivacyPolicy from "./pages/PrivacyPolicy/page";
import UserGuide from "./pages/UserGuide/page";
import DownloadAppointmentPDF from "./components/HealthCareDashboard/DownloadAppointmentPDF";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Register Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/register/patient-register" element={<PatientRegister />} />
        <Route path="/register/healthcare-register" element={<HealthcareRegister />} />
        <Route path="/register/HealthcareTypeSelection" element={<HealthcareTypeSelection />} />
        <Route path="/register/healthcare-details" element={<HealthcareDetails />} />
        <Route path="/register/HealthcareFinalStep" element={<HealthcareFinalStep />} />
        {/* Login Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        {/* Admin Routes */}
        <Route path="/admin" element={<Admin />} />
        {/* Patient Routes */}
        <Route path="/patient-dashboard" element={<Patient />} />
        {/* Healthcare Routes */}
        <Route path="/healthcare-dashboard" element={<HealthCare />} />
        <Route path="/download-appointment/:id" element={<DownloadAppointmentPDF />} />
        {/* Location Dashboards Routes */}
        <Route path="/location-dashboard" element={<Location />} />

        {/* Account Delete Routes */}
        <Route path="/delete-account" element={<DeleteAccount />} />
        {/*Our Team Route */}
        <Route path="/our-team" element={<OurTeam />} />
        {/*Privacy Policy Route*/}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        {/* User Guide Route */}
        <Route path="/user-guide" element={<UserGuide />} />
        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;