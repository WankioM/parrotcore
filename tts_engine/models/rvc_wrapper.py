"""RVC (Retrieval-based Voice Conversion) wrapper."""
import logging
import pickle
from pathlib import Path
from typing import Optional

import numpy as np

from .base import AudioResult
from ..utils.audio import load_audio, save_audio, normalize_audio

logger = logging.getLogger(__name__)

_rvc_model = None


def _get_rvc(device: str = "cuda"):
    """Lazy load RVC."""
    global _rvc_model
    if _rvc_model is None:
        logger.info("Loading RVC...")
        from rvc_python.infer import RVCInference
        _rvc_model = RVCInference(device=device)
        logger.info("RVC loaded")
    return _rvc_model


class RVCWrapper:
    """
    Wrapper for RVC voice conversion.
    
    RVC converts audio from one voice to another. Unlike TTS (text→speech),
    RVC does audio→audio conversion, preserving timing, emotion, and melody
    while changing the voice characteristics.
    
    Use cases:
    - Convert singing vocals to a different voice
    - Voice dubbing while preserving emotion
    - Real-time voice changing
    """
    
    def __init__(self, device: str = "cuda"):
        self.device = device
        self._rvc = None
    
    @property
    def name(self) -> str:
        return "rvc"
    
    @property
    def sample_rate(self) -> int:
        return 44100  # RVC typically works at 44.1kHz
    
    @property
    def rvc(self):
        if self._rvc is None:
            self._rvc = _get_rvc(self.device)
        return self._rvc
    
    def is_available(self) -> bool:
        try:
            import rvc_python
            return True
        except ImportError:
            return False
    
    def load_voice_model(self, model_path: Path) -> bool:
        """
        Load an RVC voice model (.pth file).
        
        Args:
            model_path: Path to the .pth model file
            
        Returns:
            True if loaded successfully
        """
        try:
            self.rvc.load_model(str(model_path))
            logger.info(f"Loaded RVC model: {model_path}")
            return True
        except Exception as e:
            logger.exception(f"Failed to load RVC model: {e}")
            return False
    
    def convert(
        self,
        source_audio_path: Path,
        output_path: Optional[Path] = None,
        pitch_shift: int = 0,
        index_path: Optional[Path] = None,
        index_rate: float = 0.5,
    ) -> AudioResult:
        """
        Convert audio to the loaded voice model.
        
        Args:
            source_audio_path: Path to source audio file
            output_path: Optional path to save converted audio
            pitch_shift: Semitones to shift pitch (0 = no change, 12 = octave up)
            index_path: Optional path to .index file for better quality
            index_rate: How much to use the index (0.0-1.0)
            
        Returns:
            AudioResult with converted audio
        """
        if not source_audio_path.exists():
            return AudioResult(
                audio_array=np.array([]),
                sample_rate=self.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message=f"Source audio not found: {source_audio_path}",
            )
        
        try:
            # Run conversion
            result_audio = self.rvc.infer_file(
                input_path=str(source_audio_path),
                pitch_shift=pitch_shift,
                index_path=str(index_path) if index_path else None,
                index_rate=index_rate,
            )
            
            # Handle output format
            if isinstance(result_audio, tuple):
                audio, sr = result_audio
            else:
                audio = result_audio
                sr = self.sample_rate
            
            # Convert to numpy if needed
            if hasattr(audio, "numpy"):
                audio = audio.squeeze().numpy()
            else:
                audio = np.array(audio).squeeze()
            
            # Normalize
            audio = normalize_audio(audio)
            
            duration = len(audio) / sr
            
            # Save if requested
            if output_path is not None:
                save_audio(output_path, audio, sr)
                logger.info(f"Saved converted audio to {output_path}")
            
            return AudioResult(
                audio_array=audio,
                sample_rate=sr,
                duration_seconds=duration,
                success=True,
            )
            
        except Exception as e:
            logger.exception("RVC conversion failed")
            return AudioResult(
                audio_array=np.array([]),
                sample_rate=self.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message=str(e),
            )
    
    def convert_with_embedding(
        self,
        source_audio_path: Path,
        embedding_path: Path,
        output_path: Optional[Path] = None,
        pitch_shift: int = 0,
    ) -> AudioResult:
        """
        Convert audio using a voice embedding created during enrollment.
        
        This loads the RVC model from the embedding and performs conversion.
        
        Args:
            source_audio_path: Path to source audio file
            embedding_path: Path to voice embedding (contains model path)
            output_path: Optional path to save converted audio
            pitch_shift: Semitones to shift pitch
            
        Returns:
            AudioResult with converted audio
        """
        if not embedding_path.exists():
            return AudioResult(
                audio_array=np.array([]),
                sample_rate=self.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message=f"Embedding not found: {embedding_path}",
            )
        
        # Load embedding to get model path
        with open(embedding_path, "rb") as f:
            embedding_data = pickle.load(f)
        
        model_path = embedding_data.get("rvc_model_path")
        index_path = embedding_data.get("rvc_index_path")
        
        if not model_path:
            return AudioResult(
                audio_array=np.array([]),
                sample_rate=self.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message="Embedding does not contain RVC model path",
            )
        
        # Load model and convert
        if not self.load_voice_model(Path(model_path)):
            return AudioResult(
                audio_array=np.array([]),
                sample_rate=self.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message=f"Failed to load RVC model: {model_path}",
            )
        
        return self.convert(
            source_audio_path=source_audio_path,
            output_path=output_path,
            pitch_shift=pitch_shift,
            index_path=Path(index_path) if index_path else None,
        )