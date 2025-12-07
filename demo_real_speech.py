"""
✅ REALTIME ENGLISH DOCTOR–PATIENT DIARIZATION + RECORDING
----------------------------------------------------------------
Features:
1. Continuous listening for a single conversation per run.
2. Auto-stops and saves after 10 seconds of silence or manual stop.
3. English-only transcription (no multilingual detection).
4. Displays spoken text in English only.
5. Each run saves one pair:
      recordings/convo_1.mp3 + recordings/convo_1.txt
      recordings/convo_2.mp3 + recordings/convo_2.txt
6. Doctor/patient role classification using diarize.csv
7. Entity dictionary from PreTraining.csv
8. GPU/CPU automatic detection for Whisper model
9. Whisper model cached locally
10. Triggers wolora.py automatically after saving.
"""

import os
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"  # harmless even if unused by simple-whisper
import re
import sys
import queue
import joblib
import soundfile as sf
from pathlib import Path
import numpy as np
import pandas as pd
import subprocess
import torch
from datetime import datetime

# --- Optional imports ---
try:
    import sounddevice as sd
except ImportError:
    raise RuntimeError("⚠️ Please install sounddevice: pip install sounddevice")

# 🔁 REPLACED faster-whisper WITH simple whisper
try:
    import whisper
except ImportError:
    raise RuntimeError("⚠️ Please install whisper: pip install -U openai-whisper")

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
except ImportError:
    raise RuntimeError("⚠️ Please install scikit-learn: pip install scikit-learn")

try:
    import spacy
except ImportError:
    raise RuntimeError("⚠️ Please install spaCy: pip install spacy")


# ---------------------------
# Configuration
# ---------------------------
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024
AUDIO_SECONDS_PER_CHUNK = 8.0
MODEL_SIZE = "small"  # Whisper model size
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)
RECORDINGS_DIR = Path("recordings")
RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)

DIARIZE_CSV = "diarize.csv"
PRETRAIN_CSV = "PreTraining.csv"

ROLE_CLF_PATH = MODEL_DIR / "role_clf.pkl"
ROLE_VEC_PATH = MODEL_DIR / "role_vectorizer.pkl"
ENTITY_DICT_PATH = MODEL_DIR / "entity_dict.pkl"

VAD_THRESHOLD = 0.0008
SILENCE_LIMIT = 10.0  # 10 seconds silence to stop
DEBUG_ENERGY = False


# ---------------------------
# Helpers
# ---------------------------
def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    return re.sub(r"\s+", " ", text).strip()


def vad_is_speech(audio_chunk: np.ndarray) -> bool:
    energy = np.mean(audio_chunk ** 2)
    if DEBUG_ENERGY:
        print(f"Energy: {energy:.6f}")
    return energy > VAD_THRESHOLD


def next_conversation_number(recordings_dir: Path) -> int:
    # Look for both wav and mp3, take max index
    existing = [f.stem for f in recordings_dir.glob("convo_*.*")]
    nums = []
    for e in existing:
        parts = e.split("_")
        if len(parts) > 1 and parts[1].isdigit():
            nums.append(int(parts[1]))
    return max(nums, default=0) + 1


def dedupe_transcript(new_text: str, prev_text: str, threshold: float = 0.6) -> str:
    """Removes repeated fragments between consecutive transcriptions."""
    if not prev_text:
        return new_text
    overlap_len = int(len(prev_text) * threshold)
    if overlap_len <= 0:
        return new_text
    overlap_portion = prev_text[-overlap_len:]
    if new_text.startswith(overlap_portion):
        return new_text[len(overlap_portion):].strip()
    return new_text


def save_audio_as_mp3(audio_arr: np.ndarray, mp3_path: Path):
    """
    Save raw float32 mono audio at SAMPLE_RATE as MP3 using ffmpeg.
    Uses a temporary WAV via soundfile, then converts and deletes it.
    """
    tmp_wav_path = mp3_path.with_suffix(".tmp_raw.wav")

    # 1) Save temporary WAV
    sf.write(str(tmp_wav_path), audio_arr, SAMPLE_RATE)

    # 2) Convert to MP3 using ffmpeg (requires ffmpeg in PATH)
    # -qscale:a 3 → good VBR quality, you can tweak if needed
    cmd = [
        "ffmpeg",
        "-y",              # overwrite if exists
        "-loglevel", "error",
        "-i", str(tmp_wav_path),
        "-acodec", "libmp3lame",
        "-qscale:a", "3",
        str(mp3_path),
    ]

    try:
        subprocess.run(cmd, check=True)
    except FileNotFoundError:
        print("❌ ffmpeg not found. Please install it and ensure it's on PATH.")
        print(f"Keeping temporary WAV at: {tmp_wav_path}")
        return
    except subprocess.CalledProcessError as e:
        print("❌ ffmpeg failed to convert WAV to MP3:", e)
        print(f"Keeping temporary WAV at: {tmp_wav_path}")
        return

    # 3) Remove temp WAV if conversion succeeded
    try:
        os.remove(tmp_wav_path)
    except OSError:
        pass


# ---------------------------
# Role Classifier
# ---------------------------
def prepare_role_classifier(csv_path=DIARIZE_CSV):
    if ROLE_CLF_PATH.exists() and ROLE_VEC_PATH.exists():
        print("✅ Loading saved role classifier...")
        clf = joblib.load(ROLE_CLF_PATH)
        vec = joblib.load(ROLE_VEC_PATH)
        return clf, vec

    print("🧠 Training new role classifier...")
    df = pd.read_csv(csv_path)
    utterances, labels = [], []

    for _, row in df.iterrows():
        if pd.notna(row.get("doctor")):
            utterances.append(clean_text(row["doctor"]))
            labels.append("doctor")
        if pd.notna(row.get("patient")):
            utterances.append(clean_text(row["patient"]))
            labels.append("patient")

    if len(utterances) < 10:
        raise ValueError("❌ Not enough examples in diarize.csv")

    vec = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    X = vec.fit_transform(utterances)
    clf = LogisticRegression(max_iter=1000).fit(X, labels)

    joblib.dump(clf, ROLE_CLF_PATH)
    joblib.dump(vec, ROLE_VEC_PATH)
    print("💾 Saved classifier to models/ folder.")
    return clf, vec


# ---------------------------
# Entity Dictionary
# ---------------------------
def build_entity_resources(csv_path=PRETRAIN_CSV):
    if ENTITY_DICT_PATH.exists():
        print("✅ Loaded entity dictionary.")
        return joblib.load(ENTITY_DICT_PATH), None

    print("🧩 Building entity dictionary...")
    df = pd.read_csv(csv_path)
    cols = ["symptom", "treatment", "bodypart", "diagnosis", "others"]
    entity_dict = {c: set() for c in cols}
    for c in cols:
        if c in df.columns:
            for val in df[c].dropna().astype(str):
                for p in re.split(r"[;/,()|]", val):
                    if p.strip():
                        entity_dict[c].add(p.strip().lower())
    joblib.dump(entity_dict, ENTITY_DICT_PATH)
    print("✅ Entity dictionary saved.")

    # ✅ SpaCy model loading + auto-download without shadowing `spacy`
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        print("⚙️ Downloading en_core_web_sm...")
        from spacy.cli import download  # this does NOT create a local `spacy` variable
        download("en_core_web_sm")
        nlp = spacy.load("en_core_web_sm")

    return entity_dict, nlp


# ---------------------------
# Load Models
# ---------------------------
print("🚀 Initializing pipeline...")
role_clf, role_vec = prepare_role_classifier()
entity_dict, nlp = build_entity_resources()

print("🔊 Loading Whisper ASR model (simple whisper)...")
WHISPER_CACHE_DIR = MODEL_DIR / "whisper_cache"
WHISPER_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# GPU / CPU auto-detect for simple whisper
if torch.cuda.is_available():
    WHISPER_DEVICE = "cuda"
    WHISPER_FP16 = True
    print("✅ Using GPU (CUDA)")
else:
    WHISPER_DEVICE = "cpu"
    WHISPER_FP16 = False  # fp16 not supported on CPU
    print("✅ Using CPU mode")

stt_model = whisper.load_model(
    MODEL_SIZE,
    device=WHISPER_DEVICE,
    download_root=str(WHISPER_CACHE_DIR),
)


# ---------------------------
# Audio Queue
# ---------------------------
audio_q = queue.Queue()


def audio_callback(indata, frames, time_info, status):
    if status:
        print("⚠️", status)
    audio_q.put(indata.copy())


# ---------------------------
# Real-Time Recording
# ---------------------------
def run_realtime():
    convo_number = next_conversation_number(RECORDINGS_DIR)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    mp3_path = RECORDINGS_DIR / f"convo_{convo_number}_{timestamp}.mp3"
    txt_path = RECORDINGS_DIR / f"convo_{convo_number}_{timestamp}.txt"

    print("\n🎙️ Starting real-time English doctor/patient transcription...")
    print(f"💾 Current session: convo_{convo_number}")
    print("🗣️ Speak naturally — stops after 10s of silence or Ctrl+C.\n")

    samples_needed = SAMPLE_RATE * AUDIO_SECONDS_PER_CHUNK
    buffer = []
    recorded_audio = []
    transcript_lines = []

    silence_time = 0.0
    active = False
    prev_text = ""

    try:
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            blocksize=CHUNK_SIZE,
            channels=1,
            dtype="float32",
            callback=audio_callback,
        ):
            print("🎧 Listening...\n")

            while True:
                try:
                    chunk = audio_q.get(timeout=1.0)
                except queue.Empty:
                    continue

                if chunk.ndim > 1:
                    chunk = chunk[:, 0]

                recorded_audio.append(chunk.copy())

                if vad_is_speech(chunk):
                    silence_time = 0.0
                    active = True
                else:
                    if active:
                        silence_time += CHUNK_SIZE / SAMPLE_RATE
                        if silence_time >= SILENCE_LIMIT:
                            print("🔚 Silence detected — saving session.")
                            break

                buffer.extend(chunk.tolist())
                if len(buffer) >= samples_needed:
                    audio_array = np.array(buffer, dtype=np.float32)
                    buffer = []

                    # ✅ English-only transcription with simple whisper
                    result = stt_model.transcribe(
                        audio_array,
                        language="en",       # fixed to English only
                        task="transcribe",   # no translation, just EN text
                        fp16=WHISPER_FP16,
                    )

                    text = (result.get("text") or "").strip()
                    if not text:
                        continue

                    text = dedupe_transcript(text, prev_text)
                    prev_text += " " + text

                    cleaned = clean_text(text)
                    try:
                        role_vecs = role_vec.transform([cleaned])
                        role = role_clf.predict(role_vecs)[0]
                    except Exception:
                        role = "unknown"

                    line = f"[{role.capitalize()}] {text}"
                    print(line)
                    transcript_lines.append(line)

    except KeyboardInterrupt:
        print("\n🛑 Stopped manually.")

    if recorded_audio:
        audio_arr = np.concatenate(recorded_audio, axis=0).astype(np.float32)
        save_audio_as_mp3(audio_arr, mp3_path)
        if mp3_path.exists():
            print(f"💾 Saved audio (MP3): {mp3_path}")
        else:
            print("⚠️ Audio not saved as MP3 (see ffmpeg error above).")

    if transcript_lines:
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(transcript_lines))
        print(f"💾 Saved transcript: {txt_path}")

    if os.path.exists("wolora.py"):
        print("⚙️ Running wolora.py for post-processing...\n")
        subprocess.run([sys.executable, "wolora.py", "--input", str(txt_path)], check=False)
    else:
        print("⚠️ wolora.py not found. Skipping FHIR step.")


# ---------------------------
# Entry Point
# ---------------------------
if __name__ == "__main__":
    run_realtime()
