import React from 'react'
import HealthcareServices from '../Home/healthcare/HealthcareServices';
import WhyChooseUs from '../Home/main/WhyChooseUs';
import HealthcareReviews from '../Home/main/HealthcareReviews';
import HealthcareChat from '../Home/healthcare/HealthcareChat';
import HeroPage from '../Home/healthcare/HeroPage';
import Footer from '../Home/main/Footer';
const HealthCareMain = () => {
  return (
    <div className='w-full min-h-screen overflow-x-hidden -mb-20'>
      <HeroPage />
      <HealthcareServices />
      <WhyChooseUs />
      <HealthcareReviews />
      <HealthcareChat />
      <Footer />
    </div>
  )
}

export default HealthCareMain ;