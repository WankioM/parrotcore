"""TTS and Cover job business logic."""
import logging
from typing import Optional, TYPE_CHECKING
from django.db import transaction
from django.contrib.contenttypes.models import ContentType

from .models import (
    TTSJob,
    CoverJob,
    GeneratedAudio,
    SeparatedTracks,
    JobStatus,
    AudioFormat,
)
from apps.voices.models import VoiceProfile, VoiceProfileStatus

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractUser

logger = logging.getLogger(__name__)


class TTSJobService:
    """Service for managing TTS jobs."""
    
    @staticmethod
    @transaction.atomic
    def create_tts_job(
        user: "AbstractUser",
        voice_profile: VoiceProfile,
        input_text: str,
    ) -> TTSJob:
        """
        Create a new TTS job and queue it for processing.
        
        Args:
            user: The user creating the job
            voice_profile: The voice to use for synthesis
            input_text: Text to convert to speech
            
        Returns:
            Created TTSJob
            
        Raises:
            ValueError: If voice profile is not ready
        """
        if voice_profile.status != VoiceProfileStatus.READY:
            raise ValueError("Voice profile is not ready for synthesis")
        
        if not input_text.strip():
            raise ValueError("Input text cannot be empty")
        
        job = TTSJob.objects.create(
            user=user,
            voice_profile=voice_profile,
            input_text=input_text.strip(),
            status=JobStatus.PENDING,
        )
        
        # Queue Celery task
        from .tasks import run_tts_job
        task = run_tts_job.delay(str(job.id))
        
        job.celery_task_id = task.id
        job.status = JobStatus.QUEUED
        job.save(update_fields=["celery_task_id", "status"])
        
        logger.info(f"Created TTS job {job.id} for user {user.id}")
        return job
    
    @staticmethod
    @transaction.atomic
    def mark_job_complete(
        job: TTSJob,
        audio_path: str,
        duration_seconds: float,
        file_size_bytes: int,
        sample_rate: int = 44100,
        audio_format: AudioFormat = AudioFormat.WAV,
    ) -> GeneratedAudio:
        """Mark a TTS job as complete and create the audio record."""
        from django.utils import timezone
        
        job.status = JobStatus.COMPLETED
        job.progress_percent = 100
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "progress_percent", "completed_at"])
        
        # Create generated audio record
        audio = GeneratedAudio.objects.create(
            content_type=ContentType.objects.get_for_model(TTSJob),
            object_id=job.id,
            file_path=audio_path,
            file_size_bytes=file_size_bytes,
            format=audio_format,
            duration_seconds=duration_seconds,
            sample_rate=sample_rate,
        )
        
        logger.info(f"TTS job {job.id} completed: {audio_path}")
        return audio
    
    @staticmethod
    @transaction.atomic
    def mark_job_failed(job: TTSJob, error_message: str) -> None:
        """Mark a TTS job as failed."""
        from django.utils import timezone
        
        job.status = JobStatus.FAILED
        job.error_message = error_message
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "error_message", "completed_at"])
        
        logger.error(f"TTS job {job.id} failed: {error_message}")


class CoverJobService:
    """Service for managing cover jobs."""
    
    @staticmethod
    @transaction.atomic
    def create_cover_job(
        user: "AbstractUser",
        voice_profile: VoiceProfile,
        source_song_path: str,
        original_filename: str,
        pitch_shift: int = 0,
        vocal_volume: float = 1.0,
        instrumental_volume: float = 1.0,
    ) -> CoverJob:
        """
        Create a new cover job and queue it for processing.
        
        Args:
            user: The user creating the job
            voice_profile: The voice to use for the cover
            source_song_path: Storage path to the uploaded song
            original_filename: Original filename of the song
            pitch_shift: Semitones to shift vocals (-12 to +12)
            vocal_volume: Volume multiplier for vocals
            instrumental_volume: Volume multiplier for instrumentals
            
        Returns:
            Created CoverJob
            
        Raises:
            ValueError: If voice profile is not ready or invalid options
        """
        if voice_profile.status != VoiceProfileStatus.READY:
            raise ValueError("Voice profile is not ready for synthesis")
        
        if not -12 <= pitch_shift <= 12:
            raise ValueError("Pitch shift must be between -12 and +12 semitones")
        
        job = CoverJob.objects.create(
            user=user,
            voice_profile=voice_profile,
            source_song_path=source_song_path,
            original_filename=original_filename,
            pitch_shift=pitch_shift,
            vocal_volume=vocal_volume,
            instrumental_volume=instrumental_volume,
            status=JobStatus.PENDING,
        )
        
        # Queue Celery task
        from .tasks import run_cover_job
        task = run_cover_job.delay(str(job.id))
        
        job.celery_task_id = task.id
        job.status = JobStatus.QUEUED
        job.save(update_fields=["celery_task_id", "status"])
        
        logger.info(f"Created cover job {job.id} for user {user.id}")
        return job
    
    @staticmethod
    @transaction.atomic
    def save_separated_tracks(
        job: CoverJob,
        vocals_path: str,
        instrumentals_path: str,
        duration_seconds: float,
        sample_rate: int = 44100,
    ) -> SeparatedTracks:
        """Save the separated tracks from a cover job."""
        tracks = SeparatedTracks.objects.create(
            cover_job=job,
            vocals_path=vocals_path,
            instrumentals_path=instrumentals_path,
            duration_seconds=duration_seconds,
            sample_rate=sample_rate,
        )
        
        job.current_step = "separated"
        job.progress_percent = 33
        job.save(update_fields=["current_step", "progress_percent"])
        
        return tracks
    
    @staticmethod
    @transaction.atomic
    def save_converted_vocals(
        job: CoverJob,
        converted_vocals_path: str,
    ) -> None:
        """Save the converted vocals path."""
        tracks = job.separated_tracks
        tracks.converted_vocals_path = converted_vocals_path
        tracks.save(update_fields=["converted_vocals_path"])
        
        job.current_step = "converted"
        job.progress_percent = 66
        job.save(update_fields=["current_step", "progress_percent"])
    
    @staticmethod
    @transaction.atomic
    def mark_job_complete(
        job: CoverJob,
        audio_path: str,
        duration_seconds: float,
        file_size_bytes: int,
        sample_rate: int = 44100,
        audio_format: AudioFormat = AudioFormat.WAV,
    ) -> GeneratedAudio:
        """Mark a cover job as complete and create the audio record."""
        from django.utils import timezone
        
        job.status = JobStatus.COMPLETED
        job.progress_percent = 100
        job.current_step = "complete"
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "progress_percent", "current_step", "completed_at"])
        
        # Create generated audio record
        audio = GeneratedAudio.objects.create(
            content_type=ContentType.objects.get_for_model(CoverJob),
            object_id=job.id,
            file_path=audio_path,
            file_size_bytes=file_size_bytes,
            format=audio_format,
            duration_seconds=duration_seconds,
            sample_rate=sample_rate,
        )
        
        logger.info(f"Cover job {job.id} completed: {audio_path}")
        return audio
    
    @staticmethod
    @transaction.atomic
    def mark_job_failed(job: CoverJob, error_message: str) -> None:
        """Mark a cover job as failed."""
        from django.utils import timezone
        
        job.status = JobStatus.FAILED
        job.error_message = error_message
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "error_message", "completed_at"])
        
        logger.error(f"Cover job {job.id} failed: {error_message}")


# Convenience functions
def create_tts_job(
    user: "AbstractUser",
    voice_profile: VoiceProfile,
    input_text: str,
) -> TTSJob:
    """Create a new TTS job."""
    return TTSJobService.create_tts_job(user, voice_profile, input_text)


def create_cover_job(
    user: "AbstractUser",
    voice_profile: VoiceProfile,
    source_song_path: str,
    original_filename: str,
    **options,
) -> CoverJob:
    """Create a new cover job."""
    return CoverJobService.create_cover_job(
        user, voice_profile, source_song_path, original_filename, **options
    )