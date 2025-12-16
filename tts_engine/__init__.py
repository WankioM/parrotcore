"""
TTS Engine Package

A standalone package for text-to-speech with voice cloning capabilities.
Supports multiple TTS backends (Chatterbox, F5-TTS).

Usage:
    from tts_engine import enroll, synthesize
    from pathlib import Path
    
    # Enroll a voice
    samples = [Path("sample1.wav"), Path("sample2.wav")]
    result = enroll(samples, Path("voice.pkl"))
    
    # Synthesize speech
    audio = synthesize(Path("voice.pkl"), "Hello world!")
"""
from .models import (
    BaseTTSEngine,
    EmbeddingResult,
    AudioResult,
    ChatterboxWrapper,
    F5TTSWrapper,
    get_engine,
)
from .pipeline import (
    VoiceEnrollmentPipeline,
    SynthesisPipeline,
    enroll,
    synthesize,
)
from .utils import (
    load_audio,
    save_audio,
    normalize_audio,
    get_audio_duration,
)

__version__ = "0.1.0"

__all__ = [
    # Models
    "BaseTTSEngine",
    "EmbeddingResult",
    "AudioResult",
    "ChatterboxWrapper",
    "F5TTSWrapper",
    "get_engine",
    # Pipelines
    "VoiceEnrollmentPipeline",
    "SynthesisPipeline",
    "enroll",
    "synthesize",
    # Utils
    "load_audio",
    "save_audio",
    "normalize_audio",
    "get_audio_duration",
]