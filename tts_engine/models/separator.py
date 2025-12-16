"""Audio source separation using Demucs."""
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np

from ..utils.audio import save_audio

logger = logging.getLogger(__name__)

_demucs_model = None


def _get_demucs(model_name: str = "htdemucs"):
    """Lazy load Demucs model."""
    global _demucs_model
    if _demucs_model is None:
        logger.info(f"Loading Demucs model: {model_name}...")
        import torch
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
        
        _demucs_model = get_model(model_name)
        if torch.cuda.is_available():
            _demucs_model.cuda()
        logger.info("Demucs model loaded")
    return _demucs_model


@dataclass
class SeparationResult:
    """Result from audio separation."""
    vocals_path: Optional[Path]
    instrumentals_path: Optional[Path]
    vocals_array: Optional[np.ndarray]
    instrumentals_array: Optional[np.ndarray]
    sample_rate: int
    success: bool
    error_message: Optional[str] = None


class DemucsWrapper:
    """
    Wrapper for Demucs audio source separation.
    
    Demucs separates audio into stems:
    - vocals: singing/speaking voice
    - drums: percussion
    - bass: bass instruments  
    - other: everything else (guitars, synths, etc.)
    
    For song covers, we primarily need vocals vs instrumentals
    (drums + bass + other combined).
    """
    
    def __init__(self, model_name: str = "htdemucs", device: str = "cuda"):
        self.model_name = model_name
        self.device = device
        self._model = None
    
    @property
    def name(self) -> str:
        return "demucs"
    
    @property
    def sample_rate(self) -> int:
        return 44100  # Demucs native sample rate
    
    @property
    def model(self):
        if self._model is None:
            self._model = _get_demucs(self.model_name)
        return self._model
    
    def is_available(self) -> bool:
        try:
            import demucs
            return True
        except ImportError:
            return False
    
    def separate(
        self,
        audio_path: Path,
        output_dir: Optional[Path] = None,
        save_stems: bool = True,
    ) -> SeparationResult:
        """
        Separate audio into vocals and instrumentals.
        
        Args:
            audio_path: Path to input audio file
            output_dir: Directory to save separated stems
            save_stems: Whether to save stems to disk
            
        Returns:
            SeparationResult with paths/arrays for vocals and instrumentals
        """
        if not audio_path.exists():
            return SeparationResult(
                vocals_path=None,
                instrumentals_path=None,
                vocals_array=None,
                instrumentals_array=None,
                sample_rate=self.sample_rate,
                success=False,
                error_message=f"Audio file not found: {audio_path}",
            )
        
        try:
            import torch
            import torchaudio
            from demucs.apply import apply_model
            
            # Load audio
            waveform, sr = torchaudio.load(str(audio_path))
            
            # Resample if needed
            if sr != self.sample_rate:
                resampler = torchaudio.transforms.Resample(sr, self.sample_rate)
                waveform = resampler(waveform)
            
            # Ensure stereo
            if waveform.shape[0] == 1:
                waveform = waveform.repeat(2, 1)
            elif waveform.shape[0] > 2:
                waveform = waveform[:2]
            
            # Add batch dimension
            waveform = waveform.unsqueeze(0)
            
            # Move to device
            if self.device == "cuda" and torch.cuda.is_available():
                waveform = waveform.cuda()
            
            # Apply model
            logger.info(f"Separating audio: {audio_path}")
            with torch.no_grad():
                sources = apply_model(self.model, waveform, device=self.device)
            
            # sources shape: (batch, sources, channels, samples)
            # htdemucs sources order: drums, bass, other, vocals
            sources = sources.squeeze(0).cpu().numpy()
            
            # Extract stems (index depends on model)
            # For htdemucs: 0=drums, 1=bass, 2=other, 3=vocals
            vocals = sources[3]  # (channels, samples)
            drums = sources[0]
            bass = sources[1]
            other = sources[2]
            
            # Combine non-vocal stems into instrumentals
            instrumentals = drums + bass + other
            
            # Convert to mono for RVC compatibility (average channels)
            vocals_mono = vocals.mean(axis=0)
            instrumentals_mono = instrumentals.mean(axis=0)
            
            vocals_path = None
            instrumentals_path = None
            
            # Save if requested
            if save_stems and output_dir is not None:
                output_dir.mkdir(parents=True, exist_ok=True)
                
                stem_name = audio_path.stem
                vocals_path = output_dir / f"{stem_name}_vocals.wav"
                instrumentals_path = output_dir / f"{stem_name}_instrumentals.wav"
                
                # Save stereo versions for final mix
                save_audio(vocals_path, vocals, self.sample_rate)
                save_audio(instrumentals_path, instrumentals, self.sample_rate)
                
                logger.info(f"Saved vocals to {vocals_path}")
                logger.info(f"Saved instrumentals to {instrumentals_path}")
            
            return SeparationResult(
                vocals_path=vocals_path,
                instrumentals_path=instrumentals_path,
                vocals_array=vocals_mono,
                instrumentals_array=instrumentals,  # Keep stereo for mixing
                sample_rate=self.sample_rate,
                success=True,
            )
            
        except Exception as e:
            logger.exception("Separation failed")
            return SeparationResult(
                vocals_path=None,
                instrumentals_path=None,
                vocals_array=None,
                instrumentals_array=None,
                sample_rate=self.sample_rate,
                success=False,
                error_message=str(e),
            )


def separate_vocals(
    audio_path: Path,
    output_dir: Optional[Path] = None,
    device: str = "cuda",
) -> SeparationResult:
    """
    Convenience function to separate vocals from a song.
    
    Args:
        audio_path: Path to input audio
        output_dir: Directory to save stems
        device: Device for inference
        
    Returns:
        SeparationResult
    """
    separator = DemucsWrapper(device=device)
    return separator.separate(audio_path, output_dir)