import requests

url = "http://localhost:5000/api/ehr"  # change if your backend runs on a different port

ehr_data = {
    "patientId": "P001",   # 🔹 REQUIRED
    "patientName": "Vinayak",
    "age": 21,
    "gender": "Male",
    "summary": "Patient has fever and body pain, treated with paracetamol.",
    "entities": [
        {"entity": "fever", "type": "Symptom"},
        {"entity": "body pain", "type": "Symptom"},
        {"entity": "paracetamol", "type": "Medication"}
    ],
    "symptoms": ["fever", "body pain"],
    "diagnoses": ["Viral infection"],
    "medications": [
        {"name": "Paracetamol", "dosage": "500mg", "frequency": "2 times a day", "duration": "5 days"}
    ],
    "vitals": {
        "temperature": "101F",
        "bloodPressure": "120/80",
        "heartRate": "88",
        "oxygenSaturation": "98%"
    },
    "allergies": ["None"],
    "pastHistory": ["Asthma"],
    "followUpDate": "2025-08-30"
}

response = requests.post(url, json=ehr_data)
print(response.status_code)
print(response.json())
