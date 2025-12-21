"""Voice profile business logic."""
import logging
from typing import Optional, TYPE_CHECKING
from pathlib import Path
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import (
    VoiceProfile,
    VoiceSample,
    VoiceEnrollmentJob,
    VoiceProfileStatus,
    EnrollmentJobStatus,
)

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractUser

logger = logging.getLogger(__name__)
User = get_user_model()


class VoiceProfileService:
    """Service for managing voice profiles."""
    
    @staticmethod
    @transaction.atomic
    def create_voice_profile(
        user: "AbstractUser",
        name: str,
        description: str = "",
    ) -> VoiceProfile:
        """
        Create a new voice profile.
        
        Args:
            user: The owner of the profile
            name: Display name for the voice
            description: Optional description
            
        Returns:
            Created VoiceProfile
        """
        profile = VoiceProfile.objects.create(
            user=user,
            name=name,
            description=description,
            status=VoiceProfileStatus.PENDING,
        )
        logger.info(f"Created voice profile {profile.id} for user {user.id}")
        return profile
    
    @staticmethod
    @transaction.atomic
    def add_sample(
        voice_profile: VoiceProfile,
        file_path: str,
        original_filename: str,
        duration_seconds: float,
        file_size_bytes: int = 0,
        sample_rate: Optional[int] = None,
        channels: Optional[int] = None,
    ) -> VoiceSample:
        """
        Add an audio sample to a voice profile.
        
        Args:
            voice_profile: The profile to add the sample to
            file_path: Storage path (S3/MinIO key)
            original_filename: Original uploaded filename
            duration_seconds: Duration of the audio
            file_size_bytes: Size in bytes
            sample_rate: Audio sample rate (Hz)
            channels: Number of audio channels
            
        Returns:
            Created VoiceSample
        """
        sample = VoiceSample.objects.create(
            voice_profile=voice_profile,
            file_path=file_path,
            original_filename=original_filename,
            duration_seconds=duration_seconds,
            file_size_bytes=file_size_bytes,
            sample_rate=sample_rate,
            channels=channels,
        )
        logger.info(f"Added sample {sample.id} to profile {voice_profile.id}")
        return sample
    
    @staticmethod
    @transaction.atomic
    def enroll_voice_profile(voice_profile: VoiceProfile) -> VoiceEnrollmentJob:
        """
        Start the enrollment process for a voice profile.
        
        Creates an enrollment job and queues the Celery task.
        
        Args:
            voice_profile: The profile to enroll
            
        Returns:
            Created VoiceEnrollmentJob
            
        Raises:
            ValueError: If profile has no samples or is already enrolling
        """
        # Validate
        if voice_profile.sample_count == 0:
            raise ValueError("Cannot enroll profile with no samples")
        
        if voice_profile.status == VoiceProfileStatus.ENROLLING:
            raise ValueError("Profile is already being enrolled")
        
        # Create job
        job = VoiceEnrollmentJob.objects.create(
            voice_profile=voice_profile,
            status=EnrollmentJobStatus.PENDING,
        )
        
        # Update profile status
        voice_profile.status = VoiceProfileStatus.ENROLLING
        voice_profile.save(update_fields=["status", "updated_at"])
        
        # Queue Celery task using explicit task name
        from parrotcore.celery import app as celery_app
        task = celery_app.send_task(
            'apps.voices.tasks.run_voice_enrollment',
            args=[str(job.id)]
        )
        
        # Store task ID
        job.celery_task_id = task.id
        job.status = EnrollmentJobStatus.QUEUED
        job.save(update_fields=["celery_task_id", "status"])

        logger.info(f"Queued enrollment job {job.id} for profile {voice_profile.id}")
        return job
    
    @staticmethod
    @transaction.atomic
    def mark_enrollment_complete(
        job: VoiceEnrollmentJob,
        embedding_path: str,
    ) -> None:
        """
        Mark an enrollment job as complete.
        
        Called by Celery task on success.
        """
        from django.utils import timezone
        
        job.status = EnrollmentJobStatus.COMPLETED
        job.progress_percent = 100
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "progress_percent", "completed_at"])
        
        profile = job.voice_profile
        profile.status = VoiceProfileStatus.READY
        profile.embedding_path = embedding_path
        profile.save(update_fields=["status", "embedding_path", "updated_at"])
        
        logger.info(f"Enrollment {job.id} completed for profile {profile.id}")
    
    @staticmethod
    @transaction.atomic
    def mark_enrollment_failed(
        job: VoiceEnrollmentJob,
        error_message: str,
    ) -> None:
        """
        Mark an enrollment job as failed.
        
        Called by Celery task on failure.
        """
        from django.utils import timezone
        
        job.status = EnrollmentJobStatus.FAILED
        job.error_message = error_message
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "error_message", "completed_at"])
        
        profile = job.voice_profile
        profile.status = VoiceProfileStatus.FAILED
        profile.save(update_fields=["status", "updated_at"])
        
        logger.error(f"Enrollment {job.id} failed: {error_message}")
    
    @staticmethod
    @transaction.atomic
    def delete_voice_profile(voice_profile: VoiceProfile) -> None:
        """
        Delete a voice profile and all associated data.
        
        This includes samples, embedding, and generated audio.
        Called for privacy/GDPR compliance.
        """
        from apps.common.storage import storage
        
        # Delete samples from storage
        for sample in voice_profile.samples.all():
            try:
                storage.delete_file(sample.file_path)
            except Exception as e:
                logger.warning(f"Failed to delete sample file: {e}")
        
        # Delete embedding from storage
        if voice_profile.embedding_path:
            try:
                storage.delete_file(voice_profile.embedding_path)
            except Exception as e:
                logger.warning(f"Failed to delete embedding: {e}")
        
        # Delete the profile (cascades to samples and jobs)
        profile_id = voice_profile.id
        voice_profile.delete()
        
        logger.info(f"Deleted voice profile {profile_id} and all associated data")


# Convenience functions
def create_voice_profile(user: "AbstractUser", name: str, description: str = "") -> VoiceProfile:
    """Create a new voice profile."""
    return VoiceProfileService.create_voice_profile(user, name, description)


def enroll_voice_profile(voice_profile: VoiceProfile) -> VoiceEnrollmentJob:
    """Start enrollment for a voice profile."""
    return VoiceProfileService.enroll_voice_profile(voice_profile)