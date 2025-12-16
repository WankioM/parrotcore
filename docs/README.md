# ParrotCore Architecture

## Project Overview

ParrotCore is a voice cloning TTS platform that allows users to:
1. Upload voice samples to create a voice profile
2. Generate text-to-speech using their cloned voice
3. Create AI song covers using their voice

---

## Project Structure
```
parrot-core/
├── .venv/                    # Python virtual environment
├── pyproject.toml            # Python dependencies
├── .env.example              # Environment variables template
├── README.md
│
├── backend/                  # Django API server
│   ├── manage.py
│   ├── parrotcore/           # Django project settings
│   │   ├── settings.py       # Main config (DB, Celery, CORS)
│   │   ├── urls.py           # Root URL routing
│   │   ├── wsgi.py           # WSGI entry point
│   │   ├── asgi.py           # ASGI entry point
│   │   └── celery.py         # Celery configuration
│   └── apps/
│       ├── accounts/         # User authentication
│       ├── voices/           # Voice profiles & samples
│       ├── tts/              # TTS & cover jobs
│       ├── api/              # REST API endpoints
│       └── common/           # Shared utilities (storage, etc.)
│
├── tts_engine/               # Standalone TTS Python package
│   ├── models/
│   │   ├── base.py           # BaseTTSEngine abstract class
│   │   ├── chatterbox_wrapper.py
│   │   └── rvc_wrapper.py
│   ├── pipeline/
│   │   ├── voice_enrollment.py
│   │   ├── synthesis.py
│   │   └── song_cover.py
│   └── utils/
│       └── audio.py          # Audio processing utilities
│
├── frontend/                 # Next.js web app
│   ├── pages/
│   ├── components/
│   └── lib/
│
├── infra/                    # Infrastructure configs
│   ├── images/
│   │   ├── api/Containerfile
│   │   └── worker/Containerfile
│   └── docker/
│       └── docker-compose.yml
│
├── docs/                     # Documentation
└── examples/                 # Jupyter notebooks
```

---

## Key Abstractions

### 1. BaseTTSEngine (Abstract Interface)

All TTS models must implement this interface:
```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import List

@dataclass
class EmbeddingResult:
    embedding_path: Path
    duration_seconds: float
    sample_count: int
    success: bool
    error: str | None = None

@dataclass
class AudioResult:
    audio_path: Path
    duration_seconds: float
    sample_rate: int
    success: bool
    error: str | None = None

class BaseTTSEngine(ABC):
    @abstractmethod
    def enroll(self, samples: List[Path]) -> EmbeddingResult:
        """Create voice embedding from audio samples."""
        pass

    @abstractmethod
    def synthesize(self, embedding_path: Path, text: str) -> AudioResult:
        """Generate speech from text using voice embedding."""
        pass
```

### 2. VoiceEnrollmentPipeline

Orchestrates the enrollment process with validation:
```python
from tts_engine.pipeline.voice_enrollment import VoiceEnrollmentPipeline

pipeline = VoiceEnrollmentPipeline(
    engine=my_tts_engine,
    min_sample_duration=3.0,
    max_sample_duration=30.0,
    min_total_duration=10.0,
)
result = pipeline.enroll(samples, output_path)
```

---

## Song Cover Pipeline
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User's     │     │   Upload    │     │   Demucs    │     │    RVC      │
│  Voice      │────▶│   Song      │────▶│  Separate   │────▶│  Convert    │
│  Samples    │     │             │     │  Vocals     │     │  Vocals     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │    Mix      │
                                                            │  Vocals +   │
                                                            │Instrumentals│
                                                            └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │   Final     │
                                                            │   Cover     │
                                                            └─────────────┘
```

---

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| `api` | 8000 | Django REST API |
| `worker` | - | Celery worker (TTS processing) |
| `postgres` | 5433 | PostgreSQL database |
| `redis` | 6379 | Celery broker & cache |
| `minio` | 9000, 9001 | S3-compatible object storage |

---

## Environment Variables
```env
# Django
DEBUG=True
SECRET_KEY=change-me-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://parrot:parrot@localhost:5433/parrotcore

# Redis
REDIS_URL=redis://localhost:6379/0

# Storage (MinIO for dev, S3 for prod)
STORAGE_BACKEND=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=parrotcore

# TTS Engine
TTS_MODEL=chatterbox
TTS_DEVICE=cpu
```

---

## Quick Commands
```powershell
# Activate virtual environment
cd C:\Users\VICTUS\Documents\WebApps\parrot-core
.venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Start Docker stack
cd infra\docker
docker compose up

# Run Django locally (alternative)
cd C:\Users\VICTUS\Documents\WebApps\parrot-core
python backend/manage.py migrate
python backend/manage.py runserver

# Run Celery worker locally
celery -A backend.parrotcore worker --loglevel=info

# Test imports
python -c "from tts_engine import BaseTTSEngine; print('✓')"
python -c "import django; print(f'Django {django.VERSION}')"
```

---

## Build Progress

| Step | Status | Description |
|------|--------|-------------|
| 1 | ✅ Done | Project scaffolding |
| 2 | ✅ Done | Docker dev environment |
| 3 | 🔄 Next | TTS Engine (Chatterbox, RVC, Demucs wrappers) |
| 4 | ⬜ | Voice models (VoiceProfile, VoiceSample) |
| 5 | ⬜ | TTS & Cover job models |
| 6 | ⬜ | Storage layer (MinIO/S3) |
| 7 | ⬜ | Celery tasks |
| 8 | ⬜ | REST API endpoints |
| 9 | ⬜ | Next.js frontend |
| 10 | ⬜ | Production hardening & privacy |

---

## Key Dependencies

- **Django 6.0** - Web framework
- **Django REST Framework** - API toolkit
- **Celery 5.6** - Async task queue
- **PyTorch 2.9** - ML framework
- **torchaudio 2.9** - Audio processing
- **PostgreSQL 16** - Database
- **Redis 7** - Message broker
- **MinIO** - Object storage (S3-compatible)