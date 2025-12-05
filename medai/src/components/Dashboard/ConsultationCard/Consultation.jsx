import React, { useState, useEffect } from "react";
import { FaPlay, FaStop } from "react-icons/fa";
import "./Consultation.css";

export default function ConsultationCard({ onStart }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setPatientData(null);

    if (onStart) onStart(true);

    setTimeout(() => {
      stopRecording();
    }, 8000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setPatientData({
        name: "John Smith",
        disease: "Hypertension",
        symptoms: ["Headaches", "Dizziness"],
        medications: ["Lisinopril", "HCTZ"],
        notes: "Patient shows signs of improved blood pressure after treatment.",
      });
    }, 3000);
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="consult-card">
      <div className="consult-header">
        <h3>AI-Powered Consultation</h3>
        <p>
          Record doctor-patient conversations and let AI extract key medical
          information
        </p>
      </div>

      <div className="consult-body">
        {/* Default View */}
        {!isRecording && !isProcessing && !patientData && (
          <button className="primary-btn" onClick={startRecording}>
            <FaPlay /> Start Conversation
          </button>
        )}

        {/* Recording UI */}
        {isRecording && (
          <div className="recording-layout">
            <div className="recording-status-center">
              <span className="pulse-dot" />
              Recording... {formatTime(recordingTime)}
            </div>

            <button className="stop-btn" onClick={stopRecording}>
              <FaStop /> Stop Recording
            </button>

            <div className="wave-container">
              <div className="audio-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            <p className="recording-hint">Speak naturally — AI is listening 👂</p>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="processing-box">
            <div className="loader"></div>
            <p>Processing audio... extracting patient info</p>
          </div>
        )}

        {/* Extracted Data */}
        {patientData && (
          <div className="patient-box">
            <h4>Extracted Patient Information</h4>
            <div className="patient-info">
              <p>
                <strong>Name:</strong> {patientData.name}
              </p>
              <p>
                <strong>Disease:</strong> {patientData.disease}
              </p>
              <p>
                <strong>Symptoms:</strong> {patientData.symptoms.join(", ")}
              </p>
              <p>
                <strong>Medications:</strong> {patientData.medications.join(", ")}
              </p>
              <p>
                <strong>Notes:</strong> {patientData.notes}
              </p>
            </div>
            <button className="secondary-btn">Save to Patient Records</button>
          </div>
        )}
      </div>
    </div>
  );
}
