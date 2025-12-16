"""F5-TTS wrapper."""
import logging
import pickle
from pathlib import Path
from typing import List, Optional

import numpy as np

from .base import BaseTTSEngine, EmbeddingResult, AudioResult
from ..utils.audio import load_audio, get_audio_duration, normalize_audio

logger = logging.getLogger(__name__)

_f5_model = None


def _get_model(device: str = "cuda"):
    """Lazy load F5-TTS model."""
    global _f5_model
    if _f5_model is None:
        logger.info("Loading F5-TTS model...")
        from f5_tts.api import F5TTS
        _f5_model = F5TTS(device=device)
        logger.info("F5-TTS model loaded")
    return _f5_model


class F5TTSWrapper(BaseTTSEngine):
    """
    Wrapper for F5-TTS.
    
    F5-TTS is a zero-shot TTS model that uses reference audio
    for voice cloning. Similar to Chatterbox, it doesn't create
    traditional embeddings.
    """
    
    def __init__(self, device: str = "cuda"):
        self.device = device
        self._model = None
    
    @property
    def name(self) -> str:
        return "f5tts"
    
    @property
    def sample_rate(self) -> int:
        return 24000  # F5-TTS native sample rate
    
    @property
    def model(self):
        if self._model is None:
            self._model = _get_model(self.device)
        return self._model
    
    def is_available(self) -> bool:
        try:
            import f5_tts
            return True
        except ImportError:
            return False
    
    def enroll(self, samples: List[Path], output_path: Path) -> EmbeddingResult:
        """
        Create voice embedding from samples.
        
        For F5-TTS, we store the reference audio and its transcript
        (if available) for use during synthesis.
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
            
            # Check for transcript file alongside audio
            transcript_path = best_sample.with_suffix(".txt")
            ref_text = ""
            if transcript_path.exists():
                ref_text = transcript_path.read_text().strip()
                logger.info(f"Found transcript: {ref_text[:50]}...")
            
            # Store embedding data
            embedding_data = {
                "engine": self.name,
                "reference_audio": audio,
                "reference_text": ref_text,
                "sample_rate": self.sample_rate,
                "source_file": str(best_sample),
                "total_samples": len(samples),
            }
            
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                pickle.dump(embedding_data, f)
            
            logger.info(f"Created F5-TTS embedding from {len(samples)} samples")
            
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
            # Load embedding
            with open(embedding_path, "rb") as f:
                embedding_data = pickle.load(f)
            
            reference_audio = embedding_data["reference_audio"]
            reference_text = embedding_data.get("reference_text", "")
            
            # Generate speech using F5-TTS
            wav, sr, _ = self.model.infer(
                ref_file=reference_audio,  # Can accept numpy array
                ref_text=reference_text,
                gen_text=text,
            )
            
            # Convert to numpy if needed
            if hasattr(wav, "numpy"):
                audio = wav.squeeze().numpy()
            else:
                audio = np.array(wav).squeeze()
            
            duration = len(audio) / self.sample_rate
            
            return AudioResult(
                audio_array=audio,
                sample_rate=self.sample_rate,
                duration_seconds=duration,
                success=True,
            )
            
        except Exception as e:
            logger.exception("Synthesis failed")
            return AudioResult(
                audio_array=np.array([]),
                sample_rate=self.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message=str(e),
            )