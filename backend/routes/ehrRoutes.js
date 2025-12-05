const express = require("express");
const router = express.Router();
const { createEHR, getAllEHRs, getEHRByPatient } = require("../controllers/ehrController");

router.post("/", createEHR);               // Store EHR
router.get("/", getAllEHRs);               // Fetch all
router.get("/:patient_id", getEHRByPatient); // Fetch by patient
module.exports = router;


