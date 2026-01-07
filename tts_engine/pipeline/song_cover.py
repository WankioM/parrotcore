"""Full song cover pipeline: separate → convert → mix."""
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import tempfile
import shutil

import numpy as np

from ..models.separator import DemucsWrapper, SeparationResult
from ..models.rvc_wrapper import RVCWrapper
from ..models.base import AudioResult
from ..utils.audio import save_audio, load_audio, normalize_audio

logger = logging.getLogger(__name__)


@dataclass
class CoverResult:
    """Result from song cover generation."""
    output_path: Optional[Path]
    audio_array: Optional[np.ndarray]
    sample_rate: int
    duration_seconds: float
    success: bool
    error_message: Optional[str] = None
    # Intermediate results for debugging/preview
    vocals_path: Optional[Path] = None
    instrumentals_path: Optional[Path] = None
    converted_vocals_path: Optional[Path] = None


class SongCoverPipeline:
    """
    Full pipeline for creating AI song covers.
    
    Steps:
    1. Separate vocals from instrumentals (Demucs)
    2. Convert vocals to target voice (RVC)
    3. Mix converted vocals with instrumentals
    
    The result is the original song with the vocals replaced
    by the user's cloned voice.
    """
    
    def __init__(
        self,
        separator: Optional[DemucsWrapper] = None,
        rvc: Optional[RVCWrapper] = None,
        device: str = "cuda",
        keep_intermediates: bool = False,
    ):
        self.separator = separator or DemucsWrapper(device=device)
        self.rvc = rvc or RVCWrapper(device=device)
        self.device = device
        self.keep_intermediates = keep_intermediates
    
    def create_cover(
        self,
        song_path: Path,
        embedding_path: Path,
        output_path: Path,
        pitch_shift: int = 0,
        vocal_volume: float = 1.0,
        instrumental_volume: float = 1.0,
        work_dir: Optional[Path] = None,
    ) -> CoverResult:
        """
        Create an AI cover of a song.
        
        Args:
            song_path: Path to original song
            embedding_path: Path to voice embedding (with RVC model)
            output_path: Path to save final cover
            pitch_shift: Semitones to shift vocals (-12 to +12)
            vocal_volume: Volume multiplier for vocals (1.0 = normal)
            instrumental_volume: Volume multiplier for instrumentals
            work_dir: Directory for intermediate files (temp if not provided)
            
        Returns:
            CoverResult with final audio and metadata
        """
        logger.info(f"Creating cover of {song_path} with voice {embedding_path}")
        
        # Validate inputs
        if not song_path.exists():
            return CoverResult(
                output_path=None,
                audio_array=None,
                sample_rate=44100,
                duration_seconds=0.0,
                success=False,
                error_message=f"Song not found: {song_path}",
            )
        
        if not embedding_path.exists():
            return CoverResult(
                output_path=None,
                audio_array=None,
                sample_rate=44100,
                duration_seconds=0.0,
                success=False,
                error_message=f"Voice embedding not found: {embedding_path}",
            )
        
        # Set up work directory
        temp_dir = None
        if work_dir is None:
            temp_dir = tempfile.mkdtemp(prefix="songcover_")
            work_dir = Path(temp_dir)
        else:
            work_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Step 1: Separate vocals from instrumentals
            logger.info("Step 1/3: Separating vocals...")
            separation = self.separator.separate(
                audio_path=song_path,
                output_dir=work_dir,
                save_stems=True,
            )
            
            if not separation.success:
                return CoverResult(
                    output_path=None,
                    audio_array=None,
                    sample_rate=44100,
                    duration_seconds=0.0,
                    success=False,
                    error_message=f"Separation failed: {separation.error_message}",
                )
            
            # Step 2: Convert vocals to target voice
            logger.info("Step 2/3: Converting vocals...")
            converted_vocals_path = work_dir / f"{song_path.stem}_converted_vocals.wav"
            
            conversion = self.rvc.convert_with_embedding(
                source_audio_path=separation.vocals_path,
                embedding_path=embedding_path,
                output_path=converted_vocals_path,
                pitch_shift=pitch_shift,
            )
            
            if not conversion.success:
                return CoverResult(
                    output_path=None,
                    audio_array=None,
                    sample_rate=44100,
                    duration_seconds=0.0,
                    success=False,
                    error_message=f"Voice conversion failed: {conversion.error_message}",
                    vocals_path=separation.vocals_path,
                    instrumentals_path=separation.instrumentals_path,
                )
            
            # Step 3: Mix converted vocals with instrumentals
            logger.info("Step 3/3: Mixing final cover...")
            final_audio = self._mix_audio(
                vocals=conversion.audio_array,
                instrumentals=separation.instrumentals_array,
                vocal_volume=vocal_volume,
                instrumental_volume=instrumental_volume,
                target_sr=separation.sample_rate,
                vocal_sr=conversion.sample_rate,
            )
            
            # Normalize final mix
            final_audio = normalize_audio(final_audio, target_db=-14.0)
            
            # Save final cover
            output_path.parent.mkdir(parents=True, exist_ok=True)
            save_audio(output_path, final_audio, separation.sample_rate)
            
            duration = len(final_audio) / separation.sample_rate
            logger.info(f"Cover created: {output_path} ({duration:.1f}s)")
            
            return CoverResult(
                output_path=output_path,
                audio_array=final_audio,
                sample_rate=separation.sample_rate,
                duration_seconds=duration,
                success=True,
                vocals_path=separation.vocals_path if self.keep_intermediates else None,
                instrumentals_path=separation.instrumentals_path if self.keep_intermediates else None,
                converted_vocals_path=converted_vocals_path if self.keep_intermediates else None,
            )
            
        except Exception as e:
            logger.exception("Cover creation failed")
            return CoverResult(
                output_path=None,
                audio_array=None,
                sample_rate=44100,
                duration_seconds=0.0,
                success=False,
                error_message=str(e),
            )
        
        finally:
            # Clean up temp directory if we created one
            if temp_dir and not self.keep_intermediates:
                shutil.rmtree(temp_dir, ignore_errors=True)
    
    def _mix_audio(
        self,
        vocals: np.ndarray,
        instrumentals: np.ndarray,
        vocal_volume: float,
        instrumental_volume: float,
        target_sr: int,
        vocal_sr: int,
    ) -> np.ndarray:
        """
        Mix vocals and instrumentals together.
        
        Handles sample rate conversion and channel matching.
        """
        import torchaudio
        import torch
        
        # Resample vocals if needed
        if vocal_sr != target_sr:
            vocals_tensor = torch.from_numpy(vocals).float()
            if vocals_tensor.ndim == 1:
                vocals_tensor = vocals_tensor.unsqueeze(0)
            resampler = torchaudio.transforms.Resample(vocal_sr, target_sr)
            vocals_tensor = resampler(vocals_tensor)
            vocals = vocals_tensor.numpy()
        
        # Ensure vocals are the right shape
        if vocals.ndim == 1:
            # Mono vocals - duplicate to stereo
            vocals = np.stack([vocals, vocals], axis=0)
        
        # Ensure instrumentals are stereo
        if instrumentals.ndim == 1:
            instrumentals = np.stack([instrumentals, instrumentals], axis=0)
        
        # Match lengths (pad shorter one with silence)
        vocal_len = vocals.shape[1]
        inst_len = instrumentals.shape[1]
        
        if vocal_len < inst_len:
            padding = np.zeros((vocals.shape[0], inst_len - vocal_len))
            vocals = np.concatenate([vocals, padding], axis=1)
        elif inst_len < vocal_len:
            padding = np.zeros((instrumentals.shape[0], vocal_len - inst_len))
            instrumentals = np.concatenate([instrumentals, padding], axis=1)
        
        # Apply volume adjustments and mix
        mixed = (vocals * vocal_volume) + (instrumentals * instrumental_volume)
        
        return mixed


def create_cover(
    song_path: Path,
    embedding_path: Path,
    output_path: Path,
    pitch_shift: int = 0,
    vocal_volume: float = 1.0,
    instrumental_volume: float = 1.0,
    device: str = "cuda",
) -> CoverResult:
    """
    Convenience function to create an AI song cover.
    
    Args:
        song_path: Path to original song
        embedding_path: Path to voice embedding
        output_path: Path to save final cover
        pitch_shift: Semitones to shift vocals
        vocal_volume: Volume for converted vocals
        instrumental_volume: Volume for instrumentals
        device: Device for inference
        
    Returns:
        CoverResult
    """
    pipeline = SongCoverPipeline(device=device)
    return pipeline.create_cover(
        song_path=song_path,
        embedding_path=embedding_path,
        output_path=output_path,
        pitch_shift=pitch_shift,
        vocal_volume=vocal_volume,
        instrumental_volume=instrumental_volume,
    )