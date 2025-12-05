import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";   // ✅ useNavigate for logout
import "./DashboardHeader.css";

export function DashboardHeader({ user, notifications = 2, handleProfileAction }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Create initials from doctor name
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  };

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/signin"); // redirect to login page
  };

  return (
    <header className="header">
      {/* Left side: Logo + Title */}
      <div className="header-left">
        <Link to="/" className="logo-box">
          <span className="logo-text">M</span>
        </Link>
        <h1 className="dashboard-title">MedAI Dashboard</h1>
      </div>

      {/* Right side: Notifications + Profile */}
      <div className="header-right">
        {/* Notifications */}
        <button
          className="icon-btn"
          onClick={() => handleProfileAction?.("Notifications")}
        >
          🔔
          {notifications > 0 && (
            <span className="notification-badge">{notifications}</span>
          )}
        </button>

        {/* Profile Avatar */}
        <div className="profile-menu">
          <button
            className="avatar-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="avatar">
              {getInitials(`${user?.firstName || ""} ${user?.lastName || ""}`)}
            </div>
          </button>

          {dropdownOpen && (
            <div className="dropdown">
              <div className="dropdown-header">
                <p className="name">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="email">{user?.email}</p>
              </div>
              <hr />
              <button
                className="dropdown-item"
                onClick={() => handleProfileAction?.("Profile")}
              >
                👤 Profile
              </button>
              <button
                className="dropdown-item"
                onClick={() => handleProfileAction?.("Settings")}
              >
                ⚙️ Settings
              </button>
              <hr />
              <button
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
