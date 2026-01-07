"""
TTS Engine Package - Voice cloning and AI song covers.
"""
from .models import (
    BaseTTSEngine,
    EmbeddingResult,
    AudioResult,
    ChatterboxWrapper,
    RVCWrapper,
    DemucsWrapper,
    SeparationResult,
    get_engine,
)
from .pipeline import (
    VoiceEnrollmentPipeline,
    SynthesisPipeline,
    ConversionPipeline,
    SongCoverPipeline,
    CoverResult,
    enroll,
    synthesize,
    convert,
    create_cover,
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
    "RVCWrapper",
    "DemucsWrapper",
    "SeparationResult",
    "get_engine",
    # Pipelines
    "VoiceEnrollmentPipeline",
    "SynthesisPipeline",
    "ConversionPipeline", 
    "SongCoverPipeline",
    "CoverResult",
    "enroll",
    "synthesize",
    "convert",
    "create_cover",
    # Utils
    "load_audio",
    "save_audio",
    "normalize_audio",
    "get_audio_duration",
]