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