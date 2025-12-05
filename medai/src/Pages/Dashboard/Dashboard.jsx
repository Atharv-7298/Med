import React, { useState } from "react";
import { DashboardHeader } from "../../components/Dashboard/DashboardHeader/DashboardHeader.jsx";
import { DashboardSidebar } from "../../components/Dashboard/DashboardSideBar/Sidebar.jsx";
import { PatientRecordCard } from "../../components/Dashboard/DashBoardPatientRecord/PatientRecord.jsx";
import { StatsDashboard } from "../../components/Dashboard/DashboardStatsCard/StatsCard.jsx";
import "./Dashboard.css";

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [consultationActive, setConsultationActive] = useState(false);
  const [showPatientRecords, setShowPatientRecords] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")); // ✅ get logged in user

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <DashboardHeader user={user} />
      </header>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${collapsed ? "collapsed" : ""}`}>
          <DashboardSidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            setShowPatientRecords={setShowPatientRecords}
          />
        </aside>

        {/* Main section */}
        <main className="dashboard-main">
          <div className="welcome-message">
            <h1>Welcome Back, Dr. {user?.firstName} {user?.lastName}</h1>
            <p>Here's what's happening with your patients today.</p>
          </div>

          {/* If "Patients" clicked → show ONLY Patient Records */}
          {showPatientRecords ? (
            <div className="patientRecord">
              <PatientRecordCard />
            </div>
          ) : (
            <>
              {/* Default Dashboard View */}
              <div className="stats">
                <StatsDashboard
                  consultationActive={consultationActive}
                  setConsultationActive={setConsultationActive}
                />
              </div>

              {/* Show patient records in dashboard unless consultation is active */}
              {!consultationActive && (
                <div className="patientRecord">
                  <PatientRecordCard />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
