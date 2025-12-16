"""TTS engine models."""
from .base import BaseTTSEngine, EmbeddingResult, AudioResult
from .chatterbox_wrapper import ChatterboxWrapper
from .rvc_wrapper import RVCWrapper
from .separator import DemucsWrapper, SeparationResult

__all__ = [
    # Base
    "BaseTTSEngine",
    "EmbeddingResult",
    "AudioResult",
    # TTS
    "ChatterboxWrapper",
    # Voice Conversion
    "RVCWrapper",
    # Separation
    "DemucsWrapper",
    "SeparationResult",
]


def get_engine(name: str = "chatterbox", device: str = "cuda") -> BaseTTSEngine:
    """Get a TTS engine by name."""
    if name == "chatterbox":
        return ChatterboxWrapper(device=device)
    raise ValueError(f"Unknown engine: {name}")