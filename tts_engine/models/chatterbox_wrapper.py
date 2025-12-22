"""Chatterbox TTS wrapper."""
import logging
import pickle
from pathlib import Path
from typing import List, Optional
import soundfile as sf  
import tempfile

import numpy as np

from .base import BaseTTSEngine, EmbeddingResult, AudioResult
from ..utils.audio import load_audio, get_audio_duration, normalize_audio

logger = logging.getLogger(__name__)

# Lazy load chatterbox
_chatterbox_model = None


def _get_model(device: str = "cuda"):
    """Lazy load Chatterbox model."""
    global _chatterbox_model
    if _chatterbox_model is None:
        logger.info("Loading Chatterbox model...")
        from chatterbox.tts import ChatterboxTTS
        _chatterbox_model = ChatterboxTTS.from_pretrained(device=device)
        logger.info("Chatterbox model loaded")
    return _chatterbox_model


class ChatterboxWrapper(BaseTTSEngine):
    """
    Wrapper for Chatterbox TTS.
    
    Chatterbox uses a reference audio approach - it doesn't create traditional
    embeddings but uses the audio directly during synthesis. We store the
    processed reference audio as our "embedding".
    """
    
    def __init__(self, device: str = "cuda"):
        self.device = device
        self._model = None
    
    @property
    def name(self) -> str:
        return "chatterbox"
    
    @property
    def sample_rate(self) -> int:
        return 24000  # Chatterbox native sample rate
    
    @property
    def model(self):
        if self._model is None:
            self._model = _get_model(self.device)
        return self._model
    
    def is_available(self) -> bool:
        try:
            import chatterbox
            return True
        except ImportError:
            return False
    
    def enroll(self, samples: List[Path], output_path: Path) -> EmbeddingResult:
        """
        Create voice embedding from samples.
        
        For Chatterbox, we select the best reference audio and store it
        along with any extracted speaker characteristics.
        """
        if not samples:
            return EmbeddingResult(
                embedding_path=output_path,
                sample_count=0,
                total_duration_seconds=0.0,
                success=False,
                error_message="No samples provided"
            )
        
        try:
            total_duration = 0.0
            best_sample = None
            best_duration = 0.0
            
            # Find the best sample (prefer 5-15 second clips)
            for sample_path in samples:
                duration = get_audio_duration(sample_path)
                total_duration += duration
                
                # Prefer samples in the sweet spot
                if 5.0 <= duration <= 15.0:
                    if best_sample is None or duration > best_duration:
                        best_sample = sample_path
                        best_duration = duration
                elif best_sample is None:
                    best_sample = sample_path
                    best_duration = duration
            
            # Load and process the best sample
            audio, sr = load_audio(best_sample, target_sr=self.sample_rate)
            audio = normalize_audio(audio)
            
            # Store embedding data
            embedding_data = {
                "engine": self.name,
                "reference_audio": audio,
                "sample_rate": self.sample_rate,
                "source_file": str(best_sample),
                "total_samples": len(samples),
            }
            
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                pickle.dump(embedding_data, f)
            
            logger.info(f"Created embedding from {len(samples)} samples at {output_path}")
            
            return EmbeddingResult(
                embedding_path=output_path,
                sample_count=len(samples),
                total_duration_seconds=total_duration,
                success=True,
            )
            
        except Exception as e:
            logger.exception("Enrollment failed")
            return EmbeddingResult(
                embedding_path=output_path,
                sample_count=len(samples),
                total_duration_seconds=0.0,
                success=False,
                error_message=str(e),
            )
    def synthesize(self, embedding_path: Path, text: str) -> AudioResult:
        """Generate speech using the voice embedding."""
        if not embedding_path.exists():
            return AudioResult(
                audio_array=np.array([]),
                sample_rate=self.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message=f"Embedding not found: {embedding_path}",
            )
        
        try:
            with open(embedding_path, "rb") as f:
                embedding_data = pickle.load(f)
            
            reference_audio = embedding_data["reference_audio"]
            
            # Write reference audio to temp file (Chatterbox expects a file path)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = tmp.name
            
            sf.write(tmp_path, reference_audio, self.sample_rate)
            
            try:
                wav = self.model.generate(
                    text=text,
                    audio_prompt_path=tmp_path,
                )
                
                import torch
                if isinstance(wav, torch.Tensor):
                    audio = wav.squeeze().cpu().numpy()
                else:
                    audio = np.array(wav)
                
                duration = len(audio) / self.sample_rate
                
                return AudioResult(
                    audio_array=audio,
                    sample_rate=self.sample_rate,
                    duration_seconds=duration,
                    success=True,
                )
            finally:
                Path(tmp_path).unlink(missing_ok=True)
            
        except Exception as e:
            logger.exception("Synthesis failed")
            return AudioResult(
                audio_array=np.array([]),
                sample_rate=self.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message=str(e),
            )