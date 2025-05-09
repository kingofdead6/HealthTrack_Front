import React from 'react';
import HealthcareServices from '../../components/Home/main/HealthcareServices';
import WhyChooseUs from '../../components/Home/main/WhyChooseUs';
import HealthcareReviews from '../../components/Home/main/HealthcareReviews';
import HealthcareChat from '../../components/Home/main/HealthcareChat';
import HeroPage from '../../components/Home/main/HeroPage';
import Footer from '../../components/Home/main/Footer';
import NavBar from '../../components/Shared/NavBar';

const Home = () => {
  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <NavBar />
      <HeroPage />
      <HealthcareServices />
      <WhyChooseUs />
      <HealthcareReviews />
      <HealthcareChat />
      <Footer />
    </div>
  );
};

export default Home;