import { Link, useNavigate } from 'react-router-dom';
import { FaHeartbeat } from 'react-icons/fa';
import Swal from "sweetalert2";
import axios from "axios";
import './SignInPage.css';

const SignInPage = () => {
  const navigate = useNavigate();

  async function handleSignin(e) {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await axios.post("http://localhost:5000/api/auth/signin", { email, password });

      // ✅ Save token & user info
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      Swal.fire("Success", "Login successful!", "success");

      // ✅ Navigate based on role
      if (res.data.user.role === "Doctor") {
        navigate("/dashboard");   // go to doctor dashboard
      } else {
        navigate("/"); // fallback for other roles
      }

    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Login failed", "error");
    }
  }

  return (
    <div className="signin-page">
      <Link to="/"><button className="home">Home</button></Link>
      <div className="signin-logo-section">
        <h1 className="logo-text">
          <FaHeartbeat style={{ marginRight: '8px', color: '#0077cc' }} />
          MedAI
        </h1>
        <p className="create-account-text">Welcome Back</p>
      </div>

      <div className="signin-container">
        <h2 className="signin-title">Sign in to your account</h2>
        <p className="signin-subtitle">Enter your details to access MedAI</p>

        <form className="signin-form" onSubmit={handleSignin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" name="email" required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" name="password" required />
          </div>

          <button type="submit" className="signin-button">Sign In</button>

          <p className="signin-footer">
            Don’t have an account? <Link to="/signup">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
