"""Base classes for TTS engines."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional
import numpy as np


@dataclass
class EmbeddingResult:
    """Result from voice enrollment."""
    embedding_path: Path
    sample_count: int
    total_duration_seconds: float
    success: bool
    error_message: Optional[str] = None


@dataclass
class AudioResult:
    """Result from speech synthesis."""
    audio_array: np.ndarray
    sample_rate: int
    duration_seconds: float
    success: bool
    error_message: Optional[str] = None


class BaseTTSEngine(ABC):
    """Abstract base class for TTS engines."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Engine identifier."""
        pass
    
    @property
    @abstractmethod
    def sample_rate(self) -> int:
        """Native sample rate of the engine."""
        pass
    
    @abstractmethod
    def enroll(self, samples: List[Path], output_path: Path) -> EmbeddingResult:
        """
        Create a voice embedding from audio samples.
        
        Args:
            samples: List of paths to audio files (wav, mp3, etc.)
            output_path: Where to save the embedding file
            
        Returns:
            EmbeddingResult with embedding path and metadata
        """
        pass
    
    @abstractmethod
    def synthesize(self, embedding_path: Path, text: str) -> AudioResult:
        """
        Generate speech from text using a voice embedding.
        
        Args:
            embedding_path: Path to the voice embedding file
            text: Text to synthesize
            
        Returns:
            AudioResult with audio data and metadata
        """
        pass
    
    def is_available(self) -> bool:
        """Check if engine dependencies are available."""
        return True