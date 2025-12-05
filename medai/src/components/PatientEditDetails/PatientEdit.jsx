import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PatientEdit.css"; // ✅ Reuse same CSS theme

function EditPatient() {
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

  // ✅ Handles direct field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handles nested array updates (e.g., medications)
  const handleArrayChange = (index, field, value, key) => {
    setPatient((prev) => {
      const updated = [...prev[key]];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [key]: updated };
    });
  };

  // ✅ Save updated patient
  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/ehr/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient),
      });
      if (res.ok) {
        alert("Patient details updated successfully!");
        navigate(`/patient/${id}`); // ✅ redirect back to details
      } else {
        alert("Failed to update patient details");
      }
    } catch (err) {
      console.error("Error updating patient:", err);
    }
  };

  if (loading) return <p>Loading patient details...</p>;
  if (!patient) return <p>No patient found</p>;

  return (
    <div className="patient-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>
      <h2>Edit Patient Details</h2>

      <div className="patient-info edit-mode">
        {/* Patient ID */}
        <label>
          <strong>Patient ID :</strong>
          <input
            type="text"
            name="patientId"
            value={patient.patientId || ""}
            onChange={handleChange}
            disabled
          />
        </label>

        {/* Name */}
        <label>
          <strong>Name :</strong>
          <input
            type="text"
            value={patient.patient?.name?.given?.[0] || ""}
            onChange={(e) =>
              setPatient((prev) => ({
                ...prev,
                patient: {
                  ...prev.patient,
                  name: { given: [e.target.value] },
                },
              }))
            }
          />
        </label>

        {/* Summary */}
        <label className="span-2">
          <strong>Summary :</strong>
          <textarea
            name="summary"
            value={patient.summary || ""}
            onChange={handleChange}
          />
        </label>

        {/* Disease */}
        <label className="span-2">
          <strong>Disease :</strong>
          <input
            type="text"
            name="disease"
            value={patient.disease || ""}
            onChange={handleChange}
          />
        </label>

        {/* Symptoms */}
        <label className="span-2">
          <strong>Symptoms :</strong>
          <input
            type="text"
            placeholder="Comma-separated"
            value={
              patient.entities
                ?.filter((e) => e.type === "Symptom")
                .map((e) => e.entity)
                .join(", ") || ""
            }
            onChange={(e) =>
              setPatient((prev) => ({
                ...prev,
                entities: e.target.value
                  .split(",")
                  .filter((sym) => sym.trim() !== "")
                  .map((sym) => ({ type: "Symptom", entity: sym.trim() })),
              }))
            }
          />
        </label>

        {/* Medications */}
        <div className="span-2">
          <strong>Medications :</strong>
          {patient.medications?.map((med, idx) => (
            <div key={idx} className="medication-input">
              <input
                type="text"
                placeholder="Name"
                value={med.name || ""}
                onChange={(e) =>
                  handleArrayChange(idx, "name", e.target.value, "medications")
                }
              />
              <input
                type="text"
                placeholder="Dosage"
                value={med.dosage || ""}
                onChange={(e) =>
                  handleArrayChange(idx, "dosage", e.target.value, "medications")
                }
              />
            </div>
          ))}
        </div>

        {/* Created At */}
        <label>
          <strong>Created At :</strong>
          <input
            type="text"
            value={
              patient.createdAt
                ? new Date(patient.createdAt).toLocaleString()
                : "N/A"
            }
            disabled
          />
        </label>
      </div>

      <button className="save-btn" onClick={handleSave}>💾 Save Changes</button>
    </div>
  );
}

export default EditPatient;
