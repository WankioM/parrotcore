"""TTS pipeline modules."""
from .voice_enrollment import VoiceEnrollmentPipeline, enroll
from .synthesis import SynthesisPipeline, synthesize
from .conversion import ConversionPipeline, convert
from .song_cover import SongCoverPipeline, CoverResult, create_cover

__all__ = [
    # Enrollment
    "VoiceEnrollmentPipeline",
    "enroll",
    # TTS Synthesis
    "SynthesisPipeline",
    "synthesize",
    # Voice Conversion
    "ConversionPipeline",
    "convert",
    # Song Covers
    "SongCoverPipeline",
    "CoverResult",
    "create_cover",
]