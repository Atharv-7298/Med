const mongoose = require("mongoose");

const EhrSchema = new mongoose.Schema({
  patientId: { type: String, required: true },        // Unique patient identifier
  summary: { type: String, required: true },          // Auto-generated summary (from NLP)

  // ✅ Patient Info
  patient: {
    name: {
      family: { type: String },
      given: [{ type: String }],
      fullName: { type: String }                      // Quick access
    },
    gender: { type: String, enum: ["male", "female", "other"] },
    birthDate: { type: Date },
    telecom: [
      {
        system: { type: String },                     // phone/email
        value: { type: String },
        use: { type: String }
      }
    ],
    address: {
      line: [{ type: String }],
      city: { type: String },
      country: { type: String }
    }
  },

  // ✅ Encounter details
  encounter: {
    encounterId: { type: String },
    status: { type: String },
    class: {
      system: { type: String },
      code: { type: String },
      display: { type: String }
    },
    practitioner: {
      id: { type: String },
      name: { type: String },
      qualification: { type: String }
    },
    period: {
      start: { type: Date },
      end: { type: Date }
    }
  },

  // ✅ Conditions / Diagnoses
  conditions: [
    {
      conditionId: { type: String },
      code: { type: String },                          // e.g., "Malaria"
      clinicalStatus: { type: String },
      verificationStatus: { type: String },
      onsetDateTime: { type: Date }
    }
  ],

  // ✅ Symptoms (from Observation)
  observations: [
    {
      observationId: { type: String },
      code: { type: String },                          // e.g., "Symptom"
      valueString: { type: String },
      status: { type: String }
    }
  ],

  // ✅ Medications (from MedicationRequest)
  medications: [
    {
      medId: { type: String },
      name: { type: String },                          // medicationCodeableConcept.text
      status: { type: String },
      dosage: { type: String },                        // e.g. "Take twice a day..."
      frequency: { type: String },                     // structured from timing
      route: { type: String },                         // e.g., oral
      authoredOn: { type: Date }
    }
  ],

  // ✅ Care Plan
  carePlan: {
    planId: { type: String },
    status: { type: String },
    intent: { type: String },
    description: { type: String }
  },

  // ✅ Structured clinical entities (NER)
  entities: [
    {
      entity: { type: String },
      type: { type: String }
    }
  ],

  // ✅ Additional details
  vitals: {
    temperature: { type: String },
    bloodPressure: { type: String },
    heartRate: { type: String },
    oxygenSaturation: { type: String }
  },
  allergies: [{ type: String }],
  pastHistory: [{ type: String }],
  followUpDate: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ehr", EhrSchema);
