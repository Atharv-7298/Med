import { Link, useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import axios from "axios";
import './SignUpPage.css';

const SignUpPage = () => {
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();

    const role = e.target.role.value;
    const firstName = e.target.firstName.value;
    const lastName = e.target.lastName.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const rePassword = e.target.rePassword.value;

    if (password !== rePassword) {
      Swal.fire("Error", "Passwords do not match!", "error");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/signup", {
        role, firstName, lastName, email, password,
      });

      Swal.fire("Success", "Account created successfully!", "success");
      navigate("/signin"); // ✅ redirect after signup
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Signup failed", "error");
    }
  }

  return (
    <div className="signin-page">
      <Link to="/"><button className="home">Home</button></Link>
      <div className="signin-logo-section">
        <h1 className="logo-text"><span>🩺</span>MedAI</h1>
      </div>

      <div className="signin-container">
        <h2 className="signin-title">Get started</h2>
        <p className="signin-subtitle">Create your account to start using MedAI</p>

        <form className="signin-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">I am a</label>
            <select className="form-select" name="role" required>
              <option>Select your role</option>
              <option>Doctor</option>
              <option>Nurse</option>
              <option>Administrator</option>
              <option>Patient</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">First Name</label>
              <input type="text" className="form-input" name="firstName" required />
            </div>
            <div className="form-group half">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-input" name="lastName" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" name="email" required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" name="password" required />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" className="form-input" name="rePassword" required />
          </div>

          <button type="submit" className="signin-button">Create Account</button>

          <p className="signin-footer">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpPage;
