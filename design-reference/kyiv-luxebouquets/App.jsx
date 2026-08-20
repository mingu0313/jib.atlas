import React from 'react';
import './styles/global.css';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import BenefitsSection from './components/BenefitsSection';
import ContactSection from './components/ContactSection';
import ServiceSection from './components/ServiceSection';
import ReviewsSection from './components/ReviewsSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="container">
      <Navbar />
      <main>
        <Hero />
        <AboutSection />
        <BenefitsSection />
        <ContactSection />
        <ServiceSection />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
