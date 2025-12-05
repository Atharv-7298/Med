import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import { FaHeartbeat, FaMicrophone, FaNotesMedical, FaFileMedical, FaUserMd, FaShieldAlt, FaMobileAlt } from 'react-icons/fa';

import Footer from '../../components/FooterPage/Footer.jsx';

const features = [
  { icon: <FaMicrophone className="feature-icon blue" />, title: 'Speech-to-Text Transcription', description: 'Real-time conversion of doctor-patient conversations into accurate medical records with clinical language processing.' },
  { icon: <FaNotesMedical className="feature-icon green" />, title: 'AI Medical Summaries', description: 'Intelligent extraction of symptoms, diagnoses, and medications from conversations using trained clinical models.' },
  { icon: <FaFileMedical className="feature-icon blue" />, title: 'Electronic Health Records', description: 'Comprehensive EHR integration with voice interaction capabilities and secure patient data management.' },
  { icon: <FaUserMd className="feature-icon purple" />, title: 'Doctor Dashboard', description: 'Advanced patient management with search, filtering, and comprehensive record editing capabilities.' },
  { icon: <FaShieldAlt className="feature-icon orange" />, title: 'Secure & Compliant', description: 'HIPAA-compliant security measures with role-based access control and encrypted data storage.' },
  { icon: <FaMobileAlt className="feature-icon red" />, title: 'Mobile Responsive', description: 'Access your medical records and management tools from any device with our responsive design.' }
];

function Home() {
  return (
    <div className="app">
      {/* Navigation Bar */}
      <div className="navbar">
        <div className="container navbar-container">
          <div className="logo">
            <span><span className="logo-icon">🩺</span>MediAI</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact us</a>
          </div>
          <div className="nav-buttons">
            <Link to="/signup"><button className="signup-btn">Get Started</button></Link>
            <Link to="/signin"><button className="login-btn">Sign in</button></Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main className="hero">
        <div className="container hero-content">
          <h1>AI-Powered Healthcare Record Management</h1>
          <p className="hero-subtitle">
            Streamline doctor-patient conversations with real-time speech summarization and intelligent medical record management.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn">
              For Healthcare Providers
            </button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="features-title">Comprehensive Healthcare Solutions</h2>
        <p className="features-subtitle">
          Advanced AI technology meets healthcare excellence for better patient outcomes and streamlined workflows.
        </p>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              {feature.icon}
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
