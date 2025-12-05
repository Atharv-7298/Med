import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PatientDetails.css";

function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/ehr/${id}`);
        const data = await res.json();
        setPatient(data);
      } catch (err) {
        console.error("Error fetching patient:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  if (loading) return <p>Loading patient details...</p>;
  if (!patient) return <p>No patient found</p>;

  return (
    <div className="patient-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>
      <h2>Patient Details</h2>

      <div className="patient-info">
        <p><strong>Patient ID:</strong> {patient.patientId || id}</p>
        <p><strong>Name:</strong> {patient.patient?.name?.given?.[0] || "Unknown"}</p>
        <p><strong>Summary:</strong> {patient.summary || "N/A"}</p>
        <p><strong>Disease:</strong> {patient.disease || "N/A"}</p>
        <p>
          <strong>Symptoms:</strong>{" "}
          {patient.entities?.filter((e) => e.type === "Symptom")
            .map((e) => e.entity)
            .join(", ") || "N/A"}
        </p>
        <p>
          <strong>Medications:</strong>{" "}
          {patient.medications?.length
            ? patient.medications
                .map((med) => `${med?.name || "Unknown"} (${med?.dosage || "-"})`)
                .join(", ")
            : "N/A"}
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {patient.createdAt
            ? new Date(patient.createdAt).toLocaleString()
            : "N/A"}
        </p>
      </div>
    </div>
  );
}

export default PatientDetail;
