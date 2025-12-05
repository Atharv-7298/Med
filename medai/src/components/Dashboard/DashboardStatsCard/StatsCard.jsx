import { Users, Activity, Calendar, TrendingUp } from "lucide-react";
import ConsultationCard from "../ConsultationCard/Consultation.jsx";
import "./StatsCard.css";

const stats = [
  {
    title: "Total Patients",
    value: "1,247",
    change: "+12%",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary-light",
  },
  {
    title: "Active Consultations",
    value: "23",
    change: "+5%",
    icon: Activity,
    color: "text-success",
    bgColor: "bg-success-light",
  },
  {
    title: "Today's Appointments",
    value: "16",
    change: "+8%",
    icon: Calendar,
    color: "text-info",
    bgColor: "bg-info-light",
  },
  {
    title: "Success Rate",
    value: "94.2%",
    change: "+2.1%",
    icon: TrendingUp,
    color: "text-warning",
    bgColor: "bg-warning-light",
  },
];

export function StatsDashboard({ consultationActive, setConsultationActive }) {
  return (
    <div className="dashboard space-y-6">
      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="card stat-card"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="card-header">
              <h4 className="card-title">{stat.title}</h4>
              <div className={`icon-wrapper ${stat.bgColor}`}>
                <stat.icon className={`icon ${stat.color}`} />
              </div>
            </div>
            <div className="card-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-change">
                <TrendingUp className="change-icon" />
                <span className="change-text">{stat.change}</span>
                <span className="change-sub">from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sections */}
      <div className={`bottom-grid ${consultationActive ? "expanded" : ""}`}>
        {/* Consultation */}
        <div className="card consultation-block">
          <ConsultationCard onStart={setConsultationActive} />
        </div>

        {/* Quick Actions (hide if consultation active) */}
        {!consultationActive && (
          <div className="card quick-actions-card">
            <h3 className="section-title mb-4">Quick Actions</h3>
            <div className="quick-actions">
              <div className="action-item">
                <div className="action-left">
                  <Users className="action-icon text-blue-500" />
                  <span>View All Patients</span>
                </div>
                <span className="action-right">1,247 total records →</span>
              </div>
              <div className="action-item">
                <div className="action-left">
                  <Calendar className="action-icon text-green-500" />
                  <span>Today's Schedule</span>
                </div>
                <span className="action-right">16 appointments →</span>
              </div>
              <div className="action-item">
                <div className="action-left">
                  <Activity className="action-icon text-blue-400" />
                  <span>Recent Activity</span>
                </div>
                <span className="action-right">View latest updates →</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
