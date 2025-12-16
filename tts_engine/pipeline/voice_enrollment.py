"""Voice enrollment pipeline."""
import logging
from pathlib import Path
from typing import List, Optional

from ..models.base import BaseTTSEngine, EmbeddingResult
from ..utils.audio import validate_audio_file, get_audio_duration

logger = logging.getLogger(__name__)


class VoiceEnrollmentPipeline:
    """
    Orchestrates the voice enrollment process.
    
    This is a thin layer that validates inputs, delegates to the TTS engine,
    and handles any pre/post processing.
    """
    
    def __init__(
        self,
        engine: BaseTTSEngine,
        min_sample_duration: float = 3.0,
        max_sample_duration: float = 30.0,
        min_total_duration: float = 10.0,
    ):
        self.engine = engine
        self.min_sample_duration = min_sample_duration
        self.max_sample_duration = max_sample_duration
        self.min_total_duration = min_total_duration
    
    def validate_samples(self, samples: List[Path]) -> tuple[List[Path], List[str]]:
        """
        Validate audio samples for enrollment.
        
        Returns:
            Tuple of (valid_samples, error_messages)
        """
        valid = []
        errors = []
        
        for sample in samples:
            is_valid, error = validate_audio_file(
                sample,
                min_duration=self.min_sample_duration,
                max_duration=self.max_sample_duration,
            )
            if is_valid:
                valid.append(sample)
            else:
                errors.append(f"{sample.name}: {error}")
        
        return valid, errors
    
    def enroll(
        self,
        samples: List[Path],
        output_path: Path,
        skip_validation: bool = False,
    ) -> EmbeddingResult:
        """
        Run the full enrollment pipeline.
        
        Args:
            samples: List of audio sample paths
            output_path: Where to save the embedding
            skip_validation: Skip sample validation (for testing)
            
        Returns:
            EmbeddingResult with embedding info
        """
        logger.info(f"Starting enrollment with {len(samples)} samples")
        
        # Validate samples
        if not skip_validation:
            valid_samples, errors = self.validate_samples(samples)
            
            if errors:
                logger.warning(f"Validation errors: {errors}")
            
            if not valid_samples:
                return EmbeddingResult(
                    embedding_path=output_path,
                    sample_count=0,
                    total_duration_seconds=0.0,
                    success=False,
                    error_message=f"No valid samples. Errors: {'; '.join(errors)}",
                )
            
            # Check total duration
            total_duration = sum(get_audio_duration(s) for s in valid_samples)
            if total_duration < self.min_total_duration:
                return EmbeddingResult(
                    embedding_path=output_path,
                    sample_count=len(valid_samples),
                    total_duration_seconds=total_duration,
                    success=False,
                    error_message=f"Total duration {total_duration:.1f}s below minimum {self.min_total_duration}s",
                )
        else:
            valid_samples = samples
        
        # Delegate to engine
        result = self.engine.enroll(valid_samples, output_path)
        
        if result.success:
            logger.info(f"Enrollment successful: {result.embedding_path}")
        else:
            logger.error(f"Enrollment failed: {result.error_message}")
        
        return result


def enroll(
    samples: List[Path],
    output_path: Path,
    engine: Optional[BaseTTSEngine] = None,
    engine_name: str = "chatterbox",
    device: str = "cuda",
) -> EmbeddingResult:
    """
    Convenience function for voice enrollment.
    
    Args:
        samples: List of audio sample paths
        output_path: Where to save the embedding
        engine: TTS engine instance (optional)
        engine_name: Engine to use if engine not provided
        device: Device for inference
        
    Returns:
        EmbeddingResult
    """
    if engine is None:
        if engine_name == "chatterbox":
            from ..models.chatterbox_wrapper import ChatterboxWrapper
            engine = ChatterboxWrapper(device=device)
        else:
            raise ValueError(f"Unknown engine: {engine_name}")
    
    pipeline = VoiceEnrollmentPipeline(engine)
    return pipeline.enroll(samples, output_path)