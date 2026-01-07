# apps/voices/services.py
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
    SampleType,
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
            speaking_status=VoiceProfileStatus.PENDING,
            singing_status=VoiceProfileStatus.PENDING,
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
        sample_type: str = SampleType.SPEAKING,  # NEW: default to speaking
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
            sample_type: 'speaking' or 'singing'
            file_size_bytes: Size in bytes
            sample_rate: Audio sample rate (Hz)
            channels: Number of audio channels
            
        Returns:
            Created VoiceSample
        """
        sample = VoiceSample.objects.create(
            voice_profile=voice_profile,
            sample_type=sample_type,
            file_path=file_path,
            original_filename=original_filename,
            duration_seconds=duration_seconds,
            file_size_bytes=file_size_bytes,
            sample_rate=sample_rate,
            channels=channels,
        )
        logger.info(
            f"Added {sample_type} sample {sample.id} to profile {voice_profile.id}"
        )
        return sample
    
    @staticmethod
    @transaction.atomic
    def enroll_voice_profile(
        voice_profile: VoiceProfile,
        job_type: str = SampleType.SPEAKING,  # NEW: specify which type
    ) -> VoiceEnrollmentJob:
        """
        Start the enrollment process for a voice profile.
        
        Creates an enrollment job and queues the Celery task.
        
        Args:
            voice_profile: The profile to enroll
            job_type: 'speaking' or 'singing'
            
        Returns:
            Created VoiceEnrollmentJob
            
        Raises:
            ValueError: If profile has no samples of the requested type or is already enrolling
        """
        # Validate
        sample_count = voice_profile.samples.filter(sample_type=job_type).count()
        if sample_count == 0:
            raise ValueError(f"Cannot enroll profile with no {job_type} samples")
        
        # Check if already enrolling this type
        current_status = (
            voice_profile.speaking_status 
            if job_type == SampleType.SPEAKING 
            else voice_profile.singing_status
        )
        if current_status == VoiceProfileStatus.ENROLLING:
            raise ValueError(f"Profile is already enrolling {job_type} voice")
        
        # Create job
        job = VoiceEnrollmentJob.objects.create(
            voice_profile=voice_profile,
            job_type=job_type,
            status=EnrollmentJobStatus.PENDING,
        )
        
        # Update profile status
        if job_type == SampleType.SPEAKING:
            voice_profile.speaking_status = VoiceProfileStatus.ENROLLING
            voice_profile.status = VoiceProfileStatus.ENROLLING  # Legacy sync
        else:
            voice_profile.singing_status = VoiceProfileStatus.ENROLLING
        voice_profile.save(update_fields=["status", "speaking_status", "singing_status", "updated_at"])
        
        # Queue appropriate Celery task
        from parrotcore.celery import app as celery_app
        
        task_name = (
            'apps.voices.tasks.run_speaking_enrollment'
            if job_type == SampleType.SPEAKING
            else 'apps.voices.tasks.run_singing_enrollment'
        )
        
        task = celery_app.send_task(task_name, args=[str(job.id)])
        
        # Store task ID
        job.celery_task_id = task.id
        job.status = EnrollmentJobStatus.QUEUED
        job.save(update_fields=["celery_task_id", "status"])

        logger.info(
            f"Queued {job_type} enrollment job {job.id} for profile {voice_profile.id}"
        )
        return job
    
    @staticmethod
    @transaction.atomic
    def mark_enrollment_complete(
        job: VoiceEnrollmentJob,
        model_path: str,
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
        
        # Update appropriate fields based on job type
        if job.is_speaking_job:
            profile.speaking_status = VoiceProfileStatus.READY
            profile.chatterbox_embedding_path = model_path
            profile.embedding_path = model_path  # Legacy sync
            profile.status = VoiceProfileStatus.READY  # Legacy sync
            update_fields = [
                "speaking_status", "chatterbox_embedding_path", 
                "embedding_path", "status", "updated_at"
            ]
        else:
            profile.singing_status = VoiceProfileStatus.READY
            profile.rvc_model_path = model_path
            update_fields = ["singing_status", "rvc_model_path", "updated_at"]
        
        profile.save(update_fields=update_fields)
        
        logger.info(
            f"{job.job_type.capitalize()} enrollment {job.id} completed for profile {profile.id}"
        )
    
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
        
        # Update appropriate status based on job type
        if job.is_speaking_job:
            profile.speaking_status = VoiceProfileStatus.FAILED
            profile.status = VoiceProfileStatus.FAILED  # Legacy sync
            update_fields = ["speaking_status", "status", "updated_at"]
        else:
            profile.singing_status = VoiceProfileStatus.FAILED
            update_fields = ["singing_status", "updated_at"]
        
        profile.save(update_fields=update_fields)
        
        logger.error(
            f"{job.job_type.capitalize()} enrollment {job.id} failed: {error_message}"
        )
    
    @staticmethod
    @transaction.atomic
    def delete_voice_profile(voice_profile: VoiceProfile) -> None:
        """
        Delete a voice profile and all associated data.
        
        This includes samples, embeddings, models, and generated audio.
        Called for privacy/GDPR compliance.
        """
        from apps.common.storage import storage
        
        # Delete samples from storage
        for sample in voice_profile.samples.all():
            try:
                storage.delete_file(sample.file_path)
            except Exception as e:
                logger.warning(f"Failed to delete sample file: {e}")
        
        # Delete Chatterbox embedding from storage
        if voice_profile.chatterbox_embedding_path:
            try:
                storage.delete_file(voice_profile.chatterbox_embedding_path)
            except Exception as e:
                logger.warning(f"Failed to delete Chatterbox embedding: {e}")
        
        # Delete RVC model from storage
        if voice_profile.rvc_model_path:
            try:
                storage.delete_file(voice_profile.rvc_model_path)
            except Exception as e:
                logger.warning(f"Failed to delete RVC model: {e}")
        
        # Delete the profile (cascades to samples and jobs)
        profile_id = voice_profile.id
        voice_profile.delete()
        
        logger.info(f"Deleted voice profile {profile_id} and all associated data")


# Convenience functions (backward compatible)
def create_voice_profile(user: "AbstractUser", name: str, description: str = "") -> VoiceProfile:
    """Create a new voice profile."""
    return VoiceProfileService.create_voice_profile(user, name, description)


def enroll_voice_profile(
    voice_profile: VoiceProfile, 
    job_type: str = SampleType.SPEAKING
) -> VoiceEnrollmentJob:
    """Start enrollment for a voice profile."""
    return VoiceProfileService.enroll_voice_profile(voice_profile, job_type)


# NEW: Specific convenience functions
def enroll_speaking_voice(voice_profile: VoiceProfile) -> VoiceEnrollmentJob:
    """Start speaking voice (Chatterbox TTS) enrollment."""
    return VoiceProfileService.enroll_voice_profile(voice_profile, SampleType.SPEAKING)


def enroll_singing_voice(voice_profile: VoiceProfile) -> VoiceEnrollmentJob:
    """Start singing voice (RVC) training."""
    return VoiceProfileService.enroll_voice_profile(voice_profile, SampleType.SINGING)