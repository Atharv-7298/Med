import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const menuItems = [
  { title: "Dashboard", url: null, icon: "📊" },
  { title: "Patients", url: null, icon: "🧑‍⚕️" }, // handled separately
  { title: "Appointments", url: "/appointments", icon: "📅" },
  { title: "Reports", url: "/reports", icon: "📑" },
  { title: "Settings", url: "/settings", icon: "⚙️" },
];

export function DashboardSidebar({ collapsed, setCollapsed, setShowPatientRecords }) {
  const handleMenuClick = (item) => {
    if (item.title === "Patients") {
      setShowPatientRecords(true); // show Patients section only
    } else {
      setShowPatientRecords(false); // reset to dashboard default view
    }
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && <span className="logo">Navigation</span>}
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-content">
        <ul className="menu">
          {menuItems.map((item) => (
            <li key={item.title}>
              {item.title === "Patients" ? (
                <button
                  className="menu-item"
                  onClick={() => handleMenuClick(item)}
                >
                  <span className="icon">{item.icon}</span>
                  {!collapsed && <span className="title">{item.title}</span>}
                </button>
              ) : (
                <NavLink
                  to={item.url}
                  className={({ isActive }) =>
                    `menu-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => handleMenuClick(item)}
                >
                  <span className="icon">{item.icon}</span>
                  {!collapsed && <span className="title">{item.title}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
