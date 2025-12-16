"""Base TTS engine interface."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import List


@dataclass
class EmbeddingResult:
    """Result from voice enrollment."""
    embedding_path: Path
    duration_seconds: float
    sample_count: int
    success: bool
    error: str | None = None


@dataclass
class AudioResult:
    """Result from speech synthesis."""
    audio_path: Path
    duration_seconds: float
    sample_rate: int
    success: bool
    error: str | None = None


class BaseTTSEngine(ABC):
    """Abstract base class for TTS engines."""

    @abstractmethod
    def enroll(self, samples: List[Path]) -> EmbeddingResult:
        """Create a voice embedding from audio samples."""
        pass

    @abstractmethod
    def synthesize(self, embedding_path: Path, text: str) -> AudioResult:
        """Synthesize speech using a voice embedding."""
        pass