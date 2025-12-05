import React from 'react';
import './FeaturePage.css';
import { FaMicrophone, FaNotesMedical, FaFileMedical, FaUserMd, FaShieldAlt, FaMobileAlt } from 'react-icons/fa';

const features = [
  {
    icon: <FaMicrophone className="feature-icon blue" />,
    title: 'Speech-to-Text Transcription',
    description: 'Real-time conversion of doctor-patient conversations into accurate medical records with clinical language processing.'
  },
  {
    icon: <FaNotesMedical className="feature-icon green" />,
    title: 'AI Medical Summaries',
    description: 'Intelligent extraction of symptoms, diagnoses, and medications from conversations using trained clinical models.'
  },
  {
    icon: <FaFileMedical className="feature-icon blue" />,
    title: 'Electronic Health Records',
    description: 'Comprehensive EHR integration with voice interaction capabilities and secure patient data management.'
  },
  {
    icon: <FaUserMd className="feature-icon purple" />,
    title: 'Doctor Dashboard',
    description: 'Advanced patient management with search, filtering, and comprehensive record editing capabilities.'
  },
  {
    icon: <FaShieldAlt className="feature-icon orange" />,
    title: 'Secure & Compliant',
    description: 'HIPAA-compliant security measures with role-based access control and encrypted data storage.'
  },
  {
    icon: <FaMobileAlt className="feature-icon red" />,
    title: 'Mobile Responsive',
    description: 'Access your medical records and management tools from any device with our responsive design.'
  }
];

function FeaturePage() {
  return (
    <div className="featurePage">
      <section className="features-section">
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
    </div>
  );
}

export default FeaturePage;


