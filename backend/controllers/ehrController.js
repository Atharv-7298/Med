  const EHR = require("../models/EHR");

  // Store new EHR
  const createEHR = async (req, res) => {
    try {
      const ehr = new EHR(req.body);
      await ehr.save();
      res.status(201).json({ message: "EHR stored successfully", ehr });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Get all EHRs
  const getAllEHRs = async (req, res) => {
    try {
      const records = await EHR.find().sort({ createdAt: -1 });
      res.json(records);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Get EHR by patientId
  const getEHRByPatient = async (req, res) => {
    try {
      const record = await EHR.findOne({ patientId: req.params.patient_id }); // ✅ match schema field
      if (!record) return res.status(404).json({ message: "No record found" });
      res.json(record);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  exports.getEHRByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const ehr = await EHR.findOne({ patientId });

    if (!ehr) {
      return res.status(404).json({ message: "EHR not found" });
    }

    res.json(ehr);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
 };
module.exports = { createEHR, getAllEHRs, getEHRByPatient };
