"""TTS engine models."""
from .base import BaseTTSEngine, EmbeddingResult, AudioResult
from .chatterbox_wrapper import ChatterboxWrapper
from .f5tts_wrapper import F5TTSWrapper

__all__ = [
    "BaseTTSEngine",
    "EmbeddingResult",
    "AudioResult",
    "ChatterboxWrapper",
    "F5TTSWrapper",
]


def get_engine(name: str = "chatterbox", device: str = "cuda") -> BaseTTSEngine:
    """
    Factory function to get a TTS engine by name.
    
    Args:
        name: Engine name ("chatterbox" or "f5tts")
        device: Device for inference ("cuda" or "cpu")
        
    Returns:
        TTS engine instance
    """
    engines = {
        "chatterbox": ChatterboxWrapper,
        "f5tts": F5TTSWrapper,
    }
    
    if name not in engines:
        raise ValueError(f"Unknown engine: {name}. Available: {list(engines.keys())}")
    
    return engines[name](device=device)