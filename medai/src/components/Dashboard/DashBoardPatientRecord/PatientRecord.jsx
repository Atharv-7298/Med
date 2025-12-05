import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./PatientRecord.css";

export function PatientRecordCard() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/ehr");
        const data = await res.json();
        console.log("Fetched Patients:", data);

        setPatients(Array.isArray(data) ? data : [data]);
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/ehr/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPatients((prev) => prev.filter((p) => p._id !== id));
      } else {
        console.error("Failed to delete patient:", await res.json());
      }
    } catch (err) {
      console.error("Error deleting patient:", err);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const name = patient.patient?.name?.given?.[0]?.toLowerCase() || "";
    const id = patient.patientId?.toLowerCase() || "";
    const disease =
      typeof patient.summary === "string"
        ? patient.summary.toLowerCase()
        : "";

    return (
      name.includes(searchTerm.toLowerCase()) ||
      id.includes(searchTerm.toLowerCase()) ||
      disease.includes(searchTerm.toLowerCase())
    );
  });

  if (loading) return <p>Loading patient records...</p>;

  return (
    <div className="patient-records-container">
      <div className="patient-records-header">
        <h2>Patient Records</h2>
        <p>Manage and view all patient records in your system</p>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, ID, or disease..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="patient-table">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Name</th>
            <th>Disease</th>
            <th>Symptoms</th>
            <th>Medications</th>
            <th>Last Visit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <tr
                key={patient._id}
                className="clickable-row"
                onClick={() => navigate(`/patient/${patient._id}`)} // ✅ row click → details
              >
                <td>{patient.patientId}</td>
                <td>{patient.patient?.name?.given?.[0] || "Unknown"}</td>
                <td>
                  {typeof patient.summary === "string"
                    ? patient.summary.split(".")[0]
                    : "N/A"}
                </td>
                <td>
                  {patient.entities
                    ?.filter((e) => e.type === "Symptom")
                    .map((e) => e.entity)
                    .join(", ") || "N/A"}
                </td>
                <td>
                  {patient.medications
                    ?.map(
                      (med) =>
                        `${med?.name || "Unknown"} (${med?.dosage || "-"})`
                    )
                    .join(", ") || "N/A"}
                </td>
                <td>
                  {patient.createdAt
                    ? new Date(patient.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td
                  onClick={(e) => e.stopPropagation()} // ✅ prevent row click when pressing buttons
                >
                  <div className="table-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => navigate(`/patient/${patient._id}/edit`)} // ✅ edit → edit page
                    >
                      <Edit className="icon" />
                    </button>

                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(patient._id)}
                    >
                      <Trash2 className="icon" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No patient records found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="patient-table-footer">
        <div>
          Showing {filteredPatients.length} of {patients.length} patients
        </div>
        <div className="pagination">
          <button className="pagination-btn" disabled>
            Previous
          </button>
          <button className="pagination-btn">Next</button>
        </div>
      </div>
    </div>
  );
}

export default PatientRecordCard;
