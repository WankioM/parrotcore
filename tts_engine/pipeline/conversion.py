"""Voice-to-voice conversion pipeline using RVC."""
import logging
from pathlib import Path
from typing import Optional

from ..models.base import AudioResult
from ..models.rvc_wrapper import RVCWrapper
from ..utils.audio import normalize_audio, save_audio

logger = logging.getLogger(__name__)


class ConversionPipeline:
    """
    Orchestrates voice-to-voice conversion using RVC.
    
    Takes source audio and converts the voice to match
    a target voice model while preserving timing, emotion,
    and musical characteristics.
    """
    
    def __init__(
        self,
        rvc: Optional[RVCWrapper] = None,
        device: str = "cuda",
        normalize_output: bool = True,
    ):
        self.rvc = rvc or RVCWrapper(device=device)
        self.device = device
        self.normalize_output = normalize_output
    
    def convert(
        self,
        source_audio_path: Path,
        embedding_path: Path,
        output_path: Optional[Path] = None,
        pitch_shift: int = 0,
    ) -> AudioResult:
        """
        Convert voice in source audio to target voice.
        
        Args:
            source_audio_path: Path to source audio file
            embedding_path: Path to voice embedding with RVC model
            output_path: Optional path to save converted audio
            pitch_shift: Semitones to shift (-12 to +12 typical)
            
        Returns:
            AudioResult with converted audio
        """
        logger.info(f"Converting {source_audio_path} with voice {embedding_path}")
        
        # Validate inputs
        if not source_audio_path.exists():
            return AudioResult(
                audio_array=__import__("numpy").array([]),
                sample_rate=self.rvc.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message=f"Source audio not found: {source_audio_path}",
            )
        
        if not embedding_path.exists():
            return AudioResult(
                audio_array=__import__("numpy").array([]),
                sample_rate=self.rvc.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message=f"Voice embedding not found: {embedding_path}",
            )
        
        # Run conversion
        result = self.rvc.convert_with_embedding(
            source_audio_path=source_audio_path,
            embedding_path=embedding_path,
            pitch_shift=pitch_shift,
        )
        
        if not result.success:
            return result
        
        # Post-process
        if self.normalize_output:
            result.audio_array = normalize_audio(result.audio_array)
        
        # Save if requested
        if output_path is not None:
            save_audio(output_path, result.audio_array, result.sample_rate)
            logger.info(f"Saved converted audio to {output_path}")
        
        return result


def convert(
    source_audio_path: Path,
    embedding_path: Path,
    output_path: Optional[Path] = None,
    pitch_shift: int = 0,
    device: str = "cuda",
) -> AudioResult:
    """
    Convenience function for voice conversion.
    
    Args:
        source_audio_path: Path to source audio
        embedding_path: Path to voice embedding
        output_path: Optional path to save output
        pitch_shift: Semitones to shift pitch
        device: Device for inference
        
    Returns:
        AudioResult
    """
    pipeline = ConversionPipeline(device=device)
    return pipeline.convert(
        source_audio_path=source_audio_path,
        embedding_path=embedding_path,
        output_path=output_path,
        pitch_shift=pitch_shift,
    )