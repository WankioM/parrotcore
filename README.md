# ParrotCore 🦜

Voice cloning TTS platform.

## Project Structure
```
parrotcore/
├── backend/          # Django API server
│   ├── parrotcore/   # Django project settings
│   └── apps/         # Django apps (voices, tts, accounts, api)
├── tts_engine/       # Standalone TTS Python package
│   ├── models/       # TTS model wrappers (F5TTS, Chatterbox)
│   ├── pipeline/     # Enrollment & synthesis pipelines
│   └── utils/        # Audio utilities
├── frontend/         # Next.js web app
├── infra/            # Container & K8s configs
├── docs/             # Documentation
└── examples/         # Jupyter notebooks
```

## Quick Start
```bash
# Create virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Copy environment config
copy .env.example .env

# Start dev environment
cd infra\containerd && nerdctl compose up -d
```

## Development

See `docs/` for detailed guides.


Speaking vs Singing Enrollment - Quick Reference
Overview
Parrot Core uses two separate enrollment processes because speaking and singing require fundamentally different AI models:
FeatureSpeaking Voice (TTS)Singing Voice (Covers)PurposeText-to-speech synthesisVoice conversion in songsTechnologyChatterbox TTSRVC (Retrieval-based Voice Conversion)ProcessEmbedding creationFull model trainingTime Required~30 seconds2-4 hoursGPU UsageLow (inference only)High (training)Min Samples1 sample (5-15 sec)3 samples (15-60 sec each)Recommended Samples2-3 samples5-10 samplesModel Size~500 KB (embedding)~50 MB (.pth model)Use CaseGenerate spoken dialogueCreate AI covers of songs

Speaking Voice Enrollment (Chatterbox)
What It Does
Creates a voice embedding that Chatterbox uses to generate speech from text.
Process Flow
Voice Samples → Audio Processing → Create Embedding → Store to MinIO
   (2-3 clips)      (~10 sec)        (~15 sec)         (~5 sec)
Sample Requirements

Duration: 5-15 seconds per sample
Content: Natural speaking (not singing)
Quality: Clear, minimal background noise
Count: 1 minimum, 2-3 recommended
Examples:

Reading a paragraph
Casual conversation
Podcast/interview clips



Output

chatterbox_embedding.pkl (~500 KB)
Contains reference audio and metadata
Used directly during TTS synthesis

When to Use

✅ User wants to generate spoken content
✅ Voiceovers, audiobooks, dialogue
✅ Fast turnaround needed
✅ Limited voice samples available


Singing Voice Enrollment (RVC)
What It Does
Trains a full neural network model that can convert any singing voice to match your voice.
Process Flow
Voice Samples → Preprocess → Extract F0 → Extract Features → Train Model → Build Index
 (5-10 clips)     (20 min)    (30 min)     (40 min)         (90-180 min)   (10 min)
Sample Requirements

Duration: 15-60 seconds per sample
Content: Clean singing vocals (no talking)
Quality: Studio-quality, isolated vocals preferred
Count: 3 minimum, 5-10 recommended
Examples:

Acapella recordings
Isolated vocal tracks
Clean karaoke performances
Original songs (vocals only)



Output

voice_model.pth (~50 MB)
voice_model.index (~10 MB, optional)
Full RVC model with 300+ training epochs
Used for voice conversion in covers

Training Stages (2-4 hours total)

Preprocessing (15-20 min)

Resample to 40kHz
Slice into segments
Normalize audio


F0 Extraction (20-30 min)

Extract pitch information
RMVPE algorithm
CPU-intensive


Feature Extraction (30-40 min)

HuBERT embeddings
GPU-accelerated
Most memory-intensive


Model Training (90-180 min)

Train generator + discriminator
300 epochs (300 iterations)
GPU memory: ~4-5 GB
Progress saved every 50 epochs


Index Building (5-10 min)

Build feature index for retrieval
Improves quality
Optional but recommended



When to Use

✅ User wants to create AI covers
✅ High-quality singing voice needed
✅ User has time to wait (2-4 hours)
✅ Multiple singing samples available

