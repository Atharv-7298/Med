#!/usr/bin/env python3
"""
wolora.py — Fast Ollama + T5 EMR summarization & NER pipeline
--------------------------------------------------------------
- Uses T5-small for summarization.
- Uses Ollama (llama3:8b or compatible) for JSON-based clinical NER extraction (no BIO tagging).
- Produces:
    - convo_*_structured.json
    - convo_*_ehr_bundle.json

Usage:
    python wolora.py --input recordings/convo_1.txt
"""

import os
import sys
import json
import re
import argparse
import subprocess
from datetime import datetime
from pprint import pprint
from pathlib import Path
import csv
import shutil

# transformers only required for T5 summarizer
try:
    from transformers import pipeline
except ImportError:
    raise ImportError("Please install transformers: pip install transformers")

# ---------------------------
# Config
# ---------------------------
STRUCTURED_KEYS = [
    "Disease", "Symptoms", "Diagnosis", "Medication", "Dosage",
    "Duration", "FollowUp", "OtherAdvice", "BodyPart", "Test", "Treatment"
]
LAST_INPUT_CACHE_FILE = "last_input.txt"
DEFAULT_PRETRAIN_CSV = "PreTraining.csv"
OLLAMA_MODEL = "llama3"  # you can switch to a smaller model if RAM is low
OLLAMA_TIMEOUT = 300  # increased for long conversations

# 🔧 CUSTOM OLLAMA PATH CONFIGURATION
CUSTOM_OLLAMA_PATH = r"C:\Users\rtivy\AppData\Local\Programs\Ollama\ollama.exe"  # your actual path

# ---------------------------
# Force CPU mode for Ollama and T5 summarizer
# ---------------------------
def detect_device():
    """Force CPU mode for Ollama."""
    print("💻 Using CPU — no GPU detected or GPU disabled.")
    os.environ["OLLAMA_LLM_LIBRARY"] = "cpu"  # Ensures Ollama uses CPU
    return "cpu"

DEVICE_TYPE = detect_device()

# ---------------------------
# Ollama executable resolver
# ---------------------------
def get_ollama_executable():
    """
    Return the command to execute Ollama.

    Priority:
    1. System 'ollama' on PATH
    2. CUSTOM_OLLAMA_PATH
    3. Pip-installed Ollama via `python -m ollama`
    """
    # 1) System-installed Ollama on PATH
    local_path = shutil.which("ollama")
    if local_path:
        print(f"✅ Using system Ollama from: {local_path}")
        return [local_path]

    # 2) Custom absolute path provided above
    if CUSTOM_OLLAMA_PATH and os.path.exists(CUSTOM_OLLAMA_PATH):
        print(f"✅ Using custom Ollama from: {CUSTOM_OLLAMA_PATH}")
        return [CUSTOM_OLLAMA_PATH]

    # 3) Pip-installed Ollama (Python module)
    try:
        import ollama  # noqa: F401
        print("✅ Using pip-installed Ollama via `python -m ollama`")
        # We return the base command list; 'run' and model will be appended later.
        return [sys.executable, "-m", "ollama"]
    except ImportError:
        print("❌ Ollama not found on PATH, custom path, or as a pip-installed module.")
        sys.exit(1)

# ---------------------------
# Helpers
# ---------------------------
def save_last_input_path(path):
    with open(LAST_INPUT_CACHE_FILE, "w", encoding="utf-8") as f:
        f.write(path)

def get_last_input_path():
    if os.path.exists(LAST_INPUT_CACHE_FILE):
        with open(LAST_INPUT_CACHE_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    return None

def run_ollama_raw(prompt, model=OLLAMA_MODEL, timeout=OLLAMA_TIMEOUT):
    """
    Call Ollama with a raw prompt.

    Supports:
    - CLI on PATH (['ollama'])
    - Custom exe path ([CUSTOM_OLLAMA_PATH])
    - Pip-installed module ([sys.executable, '-m', 'ollama'])
    """
    base_cmd = get_ollama_executable()
    cmd = base_cmd + ["run", model]

    try:
        proc = subprocess.run(
            cmd,
            input=prompt.encode("utf-8"),
            capture_output=True,
            timeout=timeout
        )
        out = proc.stdout.decode("utf-8", errors="ignore").strip() or proc.stderr.decode("utf-8", errors="ignore").strip()
        return out if out else None
    except subprocess.TimeoutExpired:
        print("⚠️ Ollama call timed out.")
        return None
    except Exception as e:
        print(f"⚠️ Ollama failed: {e}")
        return None

def run_ollama_json(prompt, model=OLLAMA_MODEL, timeout=OLLAMA_TIMEOUT):
    raw = run_ollama_raw(prompt, model=model, timeout=timeout)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        # Try to rescue JSON if it's wrapped with other text
        match = re.search(r"(\{[\s\S]*\})", raw)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                return None
        return None

# ---------------------------
# PreTraining CSV loader
# ---------------------------
def build_entity_resources(pretrain_csv_path=DEFAULT_PRETRAIN_CSV):
    entity_dict, known_terms = {}, set()
    if not os.path.exists(pretrain_csv_path):
        return {}, set()
    try:
        with open(pretrain_csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for c in reader.fieldnames or []:
                entity_dict[c] = set()
            for row in reader:
                for c in reader.fieldnames or []:
                    v = row.get(c)
                    if v:
                        for part in re.split(r"[;/,()|]", v):
                            term = part.strip().lower()
                            if term:
                                entity_dict[c].add(term)
                                known_terms.add(term)
    except Exception as e:
        print(f"⚠️ Could not load PreTraining CSV: {e}")
    return entity_dict, known_terms

# ---------------------------
# Summarization (T5 + Ollama refinement)
# ---------------------------
def load_summarizer():
    try:
        # Force using CPU for T5 as well
        return pipeline("summarization", model="t5-small", tokenizer="t5-small", device=-1)  # -1 for CPU
    except Exception as e:
        print(f"⚠️ Summarizer initialization failed: {e}")
        return None

def summarize_text(summarizer, text):
    """
    Summarize the conversation, then refine via Ollama,
    preserving clinically important numeric details (days, doses, mg, etc.).
    """
    if not summarizer:
        return "Summarizer unavailable."
    try:
        clean_text = re.sub(r'\[[^\]]+\]', '', text).strip()
        summary_output = summarizer(
            f"summarize: {clean_text}",
            max_length=120,   # slightly tighter to reduce warnings
            min_length=30,
            do_sample=False
        )
        summary = summary_output[0]['summary_text'].strip()

        ollama_prompt = f"""
You are a clinical summarization expert.

Goal:
- Produce 1–3 concise clinical sentences.
- explain every medical term used and not mess up using external words just keep it simple and easy to understand.
- If dosages or durations are mentioned, copy them exactly into the summary.

Input summary:
\"\"\"{summary}\"\"\"


Return only the refined clinical summary as plain text (no bullet points, no JSON).
"""
        refined = run_ollama_raw(ollama_prompt)
        return refined.strip() if refined else summary
    except Exception as e:
        print(f"⚠️ Summarization failed: {e}")
        return "Could not summarize."

# ---------------------------
# JSON-based NER extraction (fast)
# ---------------------------
def ask_ollama_json_ner(text, model=OLLAMA_MODEL):
    """
    Ask Ollama to extract structured entities, with a strong emphasis on
    keeping all numeric information (doses, durations, etc.).
    """
    keys_str = ", ".join(STRUCTURED_KEYS)
    prompt = f"""
You are a clinical information extraction expert.

Task:
From the following doctor–patient conversation, extract structured entities in JSON format
with these EXACT top-level keys:

{keys_str}

Output schema and rules (IMPORTANT):
- Return a single JSON object, NOT an array.
- Use exactly these keys and no others.
- Each value must be either:
  - an empty string "", OR
  - a string, OR
  - a list of strings.
- Do NOT nest objects inside values.

Field semantics:
- "Disease": main disease names, e.g. "Malaria", "Diabetes".
- "Symptoms": list of symptom phrases, each including any durations if mentioned
  (e.g., "slight fever for 7 days", "severe headache", "sore throat").
- "Diagnosis": doctor's explicit or implied diagnosis in your own words, if mentioned.
- "Medication": list of medication strings including names AND strengths if given
  (e.g., "ibuprofen 200 milligrams", "paracetamol 500 milligrams").
- "Dosage": list of dosage-related phrases with numeric values and units like milligrams, etc.
  (e.g., "200 milligrams of ibuprofen", "500 milligrams of paracetamol").
- "Duration": list or string for time spans (e.g., "7 days", "7 days of rest").
- "FollowUp": any follow-up advice (e.g., "come back if symptoms worsen", "follow up after 3 days").
- "OtherAdvice": any lifestyle or general advice ("take rest", "drink water").
- "BodyPart": list of body parts mentioned ("throat", "head", "chest").
- "Test": list of investigations or lab tests requested.
- "Treatment": non-medication treatments or plans (e.g., "rest", "physiotherapy").

CRITICAL INSTRUCTION:
- Always preserve all numeric values and units from the conversation
  (e.g., "7 days", "200 milligrams", "500 mg", "two weeks").
- If a medication is mentioned with a number, that number MUST appear
  in at least one of "Medication", "Dosage", or "Duration".
- If the information is not present in the text, leave the field as "" (empty string).

Conversation:
\"\"\"{text}\"\"\"


Return ONLY the JSON object, nothing else.
"""
    return run_ollama_json(prompt, model=model)

# ---------------------------
# FHIR bundle generator
# ---------------------------
def to_fhir_bundle(entities):
    """
    Convert extracted entities into a minimal FHIR Bundle.

    NOTE:
    - Static demo names have been removed.
    - You can plug real patient/doctor names here if you add them to STRUCTURED_KEYS / NER.
    """
    now = datetime.now().isoformat()

    bundle = {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": []
    }

    # Patient resource (no static name)
    patient_resource = {
        "resourceType": "Patient",
        "id": "patient-1",
        # "name": [{"text": "<PATIENT_NAME>"}],  # TODO: Inject actual patient name if available
    }
    bundle["entry"].append({"resource": patient_resource})

    # Practitioner resource (no static name)
    practitioner_resource = {
        "resourceType": "Practitioner",
        "id": "doctor-1",
        # "name": [{"text": "<DOCTOR_NAME>"}],  # TODO: Inject actual doctor name if available
    }
    bundle["entry"].append({"resource": practitioner_resource})

    # Diagnosis → Condition
    diagnosis = entities.get("Diagnosis")
    if diagnosis:
        bundle["entry"].append({
            "resource": {
                "resourceType": "Condition",
                "code": {"text": diagnosis},
                "recordedDate": now,
            }
        })

    # Symptoms → Observations
    for s in entities.get("Symptoms", []) or []:
        if not s:
            continue
        bundle["entry"].append({
            "resource": {
                "resourceType": "Observation",
                "code": {"text": s},
                "effectiveDateTime": now,
            }
        })

    return bundle

# ---------------------------
# Main
# ---------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Summarize + Extract EMR using T5 + Ollama JSON NER")
    parser.add_argument("--input", "-i")
    parser.add_argument("--out_dir", "-o", default="recordings")
    parser.add_argument("--pretrain", "-p", default=DEFAULT_PRETRAIN_CSV)
    args = parser.parse_args()

    input_path = args.input or get_last_input_path()
    if not input_path or not os.path.exists(input_path):
        print("❌ Input file missing or invalid.")
        sys.exit(1)
    save_last_input_path(input_path)

    with open(input_path, "r", encoding="utf-8") as f:
        text = f.read()

    output_dir = Path(args.out_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    stem = output_dir / Path(input_path).stem

    summarizer = load_summarizer()
    summary = summarize_text(summarizer, text)
    print("\n==================== CONVERSATION SUMMARY ====================")
    print(summary)
    print("==============================================================\n")

    # Fast JSON-based NER
    print("🦙 Extracting structured clinical entities (JSON NER)...")
    ehr = ask_ollama_json_ner(text)
    if not ehr or not isinstance(ehr, dict):
        print("⚠️ NER extraction failed.")
        sys.exit(1)

    # Convert to FHIR bundle
    fhir_bundle = to_fhir_bundle(ehr)
    print("FHIR Bundle:")
    pprint(fhir_bundle, indent=2)

    # ----- File paths (no invalid with_suffix) -----
    structured_path = stem.parent / f"{stem.name}_structured.json"
    ehr_bundle_path = stem.parent / f"{stem.name}_ehr_bundle.json"

    # Save structured entities to JSON
    with open(structured_path, "w", encoding="utf-8") as f:
        json.dump(ehr, f, indent=2)

    # Save FHIR bundle
    with open(ehr_bundle_path, "w", encoding="utf-8") as f:
        json.dump(fhir_bundle, f, indent=2)

    print(f"\n🔨 Processed output saved to {output_dir}")
    print(f"   - Structured entities: {structured_path.name}")
    print(f"   - FHIR bundle:        {ehr_bundle_path.name}\n")
