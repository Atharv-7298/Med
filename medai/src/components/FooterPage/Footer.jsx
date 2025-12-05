import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer>
      {/* ✅ CTA Section */}
      <div className="footer-cta">
        <h2>Ready to Transform Your Practice?</h2>
        <p>
          Join hundreds of healthcare professionals already using MedAI to
          enhance their consultations
        </p>
        <div className="cta-buttons">
          <button className="cta-btn primary">Start Free Trial</button>
        </div>
      </div>

      {/* ✅ Dark Footer Section */}
      <div className="footer">
        <div className="footer-container">
          {/* Left Section */}
          <div className="footer-left">
            <div className="footer-logo">
              <span className="logo-icon">🩺</span>
              <span className="logo-text">MedAI</span>
            </div>
            <p className="footer-desc">
              Transforming healthcare with AI-powered consultation tools
            </p>
          </div>

          {/* Links Section */}
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                <li><a href="#">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
                <li><a href="#">HIPAA</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="footer-bottom">
          <p>© 2024 MedAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
