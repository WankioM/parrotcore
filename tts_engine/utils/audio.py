"""Audio processing utilities."""
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Lazy imports for optional dependencies
_torchaudio = None
_torch = None


def _get_torchaudio():
    global _torchaudio, _torch
    if _torchaudio is None:
        import torchaudio
        import torch
        _torchaudio = torchaudio
        _torch = torch
    return _torchaudio, _torch


def load_audio(path: Path, target_sr: Optional[int] = None) -> Tuple[np.ndarray, int]:
    """
    Load audio file and optionally resample.
    
    Args:
        path: Path to audio file
        target_sr: Target sample rate (None to keep original)
        
    Returns:
        Tuple of (audio_array, sample_rate)
    """
    try:
        # Try librosa first (best MP3 support)
        import librosa
        waveform, sr = librosa.load(str(path), sr=target_sr, mono=True)
        return waveform, sr
    except ImportError:
        # Fallback to torchaudio
        torchaudio, torch = _get_torchaudio()
        waveform, sr = torchaudio.load(str(path))
        
        # Convert to mono if stereo
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)
        
        # Resample if needed
        if target_sr is not None and sr != target_sr:
            resampler = torchaudio.transforms.Resample(sr, target_sr)
            waveform = resampler(waveform)
            sr = target_sr
        
        return waveform.squeeze(0).numpy(), sr


def get_audio_duration(path: Path) -> float:
    """Get duration of audio file in seconds."""
    try:
        import librosa
        duration = librosa.get_duration(path=str(path))
        return duration
    except ImportError:
        # Fallback to loading with torchaudio
        torchaudio, torch = _get_torchaudio()
        waveform, sample_rate = torchaudio.load(str(path))
        return waveform.shape[1] / sample_rate
    """Get duration of audio file in seconds."""
    torchaudio, torch = _get_torchaudio()
    
    # Use soundfile backend for reliability
    waveform, sample_rate = torchaudio.load(str(path), backend="soundfile")
    return waveform.shape[1] / sample_rate

def save_audio(path: Path, audio: np.ndarray, sample_rate: int) -> None:
    """Save audio array to file."""
    torchaudio, torch = _get_torchaudio()
    
    if audio.ndim == 1:
        audio = audio[np.newaxis, :]
    
    tensor = torch.from_numpy(audio).float()
    torchaudio.save(str(path), tensor, sample_rate)
    logger.info(f"Saved audio to {path}")


def normalize_audio(audio: np.ndarray, target_db: float = -20.0) -> np.ndarray:
    """
    Normalize audio to target loudness.
    
    Args:
        audio: Input audio array
        target_db: Target loudness in dB
        
    Returns:
        Normalized audio array
    """
    rms = np.sqrt(np.mean(audio ** 2))
    if rms < 1e-10:
        return audio
    
    current_db = 20 * np.log10(rms)
    gain_db = target_db - current_db
    gain = 10 ** (gain_db / 20)
    
    normalized = audio * gain
    # Clip to prevent clipping
    return np.clip(normalized, -1.0, 1.0)


def trim_silence(
    audio: np.ndarray, 
    sample_rate: int,
    threshold_db: float = -40.0,
    min_silence_ms: int = 100
) -> np.ndarray:
    """
    Trim leading and trailing silence from audio.
    
    Args:
        audio: Input audio array
        sample_rate: Sample rate
        threshold_db: Silence threshold in dB
        min_silence_ms: Minimum silence duration to trim
        
    Returns:
        Trimmed audio array
    """
    threshold = 10 ** (threshold_db / 20)
    min_samples = int(sample_rate * min_silence_ms / 1000)
    
    # Find non-silent regions
    amplitude = np.abs(audio)
    non_silent = amplitude > threshold
    
    if not np.any(non_silent):
        return audio
    
    # Find first and last non-silent samples
    indices = np.where(non_silent)[0]
    start = max(0, indices[0] - min_samples)
    end = min(len(audio), indices[-1] + min_samples)
    
    return audio[start:end]



def concatenate_audio(
    audio_list: list, 
    sample_rate: int,
    silence_ms: int = 500
) -> np.ndarray:
    """
    Concatenate multiple audio arrays with silence between them.
    
    Args:
        audio_list: List of audio arrays
        sample_rate: Sample rate
        silence_ms: Silence duration between clips in ms
        
    Returns:
        Concatenated audio array
    """
    if not audio_list:
        return np.array([])
    
    silence = np.zeros(int(sample_rate * silence_ms / 1000))
    result = []
    
    for i, audio in enumerate(audio_list):
        result.append(audio)
        if i < len(audio_list) - 1:
            result.append(silence)
    
    return np.concatenate(result)


def validate_audio_file(path: Path, min_duration: float = 1.0, max_duration: float = 30.0) -> Tuple[bool, str]:
    """
    Validate an audio file for voice enrollment.
    
    Args:
        path: Path to audio file
        min_duration: Minimum duration in seconds
        max_duration: Maximum duration in seconds
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not path.exists():
        return False, f"File not found: {path}"
    
    try:
        duration = get_audio_duration(path)
    except Exception as e:
        return False, f"Could not read audio file: {e}"
    
    if duration < min_duration:
        return False, f"Audio too short: {duration:.1f}s (min: {min_duration}s)"
    
    if duration > max_duration:
        return False, f"Audio too long: {duration:.1f}s (max: {max_duration}s)"
    
    return True, ""