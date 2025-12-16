"""Speech synthesis pipeline."""
import logging
import pickle
from pathlib import Path
from typing import Optional

from ..models.base import BaseTTSEngine, AudioResult
from ..utils.audio import normalize_audio, save_audio

logger = logging.getLogger(__name__)

# Maximum text length to synthesize at once
MAX_TEXT_LENGTH = 500


class SynthesisPipeline:
    """
    Orchestrates the speech synthesis process.
    
    Handles text preprocessing, chunking for long texts,
    and post-processing of generated audio.
    """
    
    def __init__(
        self,
        engine: BaseTTSEngine,
        max_text_length: int = MAX_TEXT_LENGTH,
        normalize_output: bool = True,
    ):
        self.engine = engine
        self.max_text_length = max_text_length
        self.normalize_output = normalize_output
    
    def preprocess_text(self, text: str) -> str:
        """Clean and normalize input text."""
        # Basic normalization
        text = text.strip()
        text = " ".join(text.split())  # Normalize whitespace
        return text
    
    def chunk_text(self, text: str) -> list[str]:
        """
        Split long text into chunks for synthesis.
        
        Tries to split on sentence boundaries.
        """
        if len(text) <= self.max_text_length:
            return [text]
        
        chunks = []
        current = ""
        
        # Split on sentences
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        for sentence in sentences:
            if len(current) + len(sentence) <= self.max_text_length:
                current = f"{current} {sentence}".strip()
            else:
                if current:
                    chunks.append(current)
                current = sentence
        
        if current:
            chunks.append(current)
        
        return chunks
    
    def synthesize(
        self,
        embedding_path: Path,
        text: str,
        output_path: Optional[Path] = None,
    ) -> AudioResult:
        """
        Run the full synthesis pipeline.
        
        Args:
            embedding_path: Path to voice embedding
            text: Text to synthesize
            output_path: Optional path to save audio file
            
        Returns:
            AudioResult with generated audio
        """
        logger.info(f"Synthesizing {len(text)} chars with embedding {embedding_path}")
        
        # Preprocess
        text = self.preprocess_text(text)
        
        if not text:
            return AudioResult(
                audio_array=__import__("numpy").array([]),
                sample_rate=self.engine.sample_rate,
                duration_seconds=0.0,
                success=False,
                error_message="Empty text after preprocessing",
            )
        
        # Handle long text by chunking
        chunks = self.chunk_text(text)
        
        if len(chunks) == 1:
            # Single chunk - direct synthesis
            result = self.engine.synthesize(embedding_path, text)
        else:
            # Multiple chunks - synthesize and concatenate
            logger.info(f"Text split into {len(chunks)} chunks")
            results = []
            
            for i, chunk in enumerate(chunks):
                logger.debug(f"Synthesizing chunk {i+1}/{len(chunks)}")
                chunk_result = self.engine.synthesize(embedding_path, chunk)
                
                if not chunk_result.success:
                    return chunk_result
                
                results.append(chunk_result.audio_array)
            
            # Concatenate with small gaps
            from ..utils.audio import concatenate_audio
            import numpy as np
            
            combined = concatenate_audio(results, self.engine.sample_rate, silence_ms=200)
            
            result = AudioResult(
                audio_array=combined,
                sample_rate=self.engine.sample_rate,
                duration_seconds=len(combined) / self.engine.sample_rate,
                success=True,
            )
        
        # Post-process
        if result.success and self.normalize_output:
            result.audio_array = normalize_audio(result.audio_array)
        
        # Save if requested
        if result.success and output_path is not None:
            save_audio(output_path, result.audio_array, result.sample_rate)
            logger.info(f"Saved audio to {output_path}")
        
        return result


def synthesize(
    embedding_path: Path,
    text: str,
    output_path: Optional[Path] = None,
    engine: Optional[BaseTTSEngine] = None,
    device: str = "cuda",
) -> AudioResult:
    """
    Convenience function for speech synthesis.
    
    Args:
        embedding_path: Path to voice embedding
        text: Text to synthesize
        output_path: Optional path to save audio file
        engine: TTS engine instance (optional, will auto-detect from embedding)
        device: Device for inference
        
    Returns:
        AudioResult
    """
    # Auto-detect engine from embedding if not provided
    if engine is None:
        with open(embedding_path, "rb") as f:
            embedding_data = pickle.load(f)
        
        engine_name = embedding_data.get("engine", "chatterbox")
        
        if engine_name == "chatterbox":
            from ..models.chatterbox_wrapper import ChatterboxWrapper
            engine = ChatterboxWrapper(device=device)
        elif engine_name == "f5tts":
            from ..models.f5tts_wrapper import F5TTSWrapper
            engine = F5TTSWrapper(device=device)
        else:
            raise ValueError(f"Unknown engine in embedding: {engine_name}")
    
    pipeline = SynthesisPipeline(engine)
    return pipeline.synthesize(embedding_path, text, output_path)