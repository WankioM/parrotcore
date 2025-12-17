"""TTS and Cover job queries."""
from typing import Optional, TYPE_CHECKING
from uuid import UUID
from django.db.models import QuerySet
from django.contrib.contenttypes.models import ContentType

from .models import TTSJob, CoverJob, GeneratedAudio, JobStatus

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractUser


def get_user_tts_jobs(
    user: "AbstractUser",
    status: Optional[JobStatus] = None,
    limit: Optional[int] = None,
) -> QuerySet[TTSJob]:
    """Get TTS jobs for a user."""
    qs = TTSJob.objects.filter(user=user)
    if status:
        qs = qs.filter(status=status)
    if limit:
        qs = qs[:limit]
    return qs


def get_user_cover_jobs(
    user: "AbstractUser",
    status: Optional[JobStatus] = None,
    limit: Optional[int] = None,
) -> QuerySet[CoverJob]:
    """Get cover jobs for a user."""
    qs = CoverJob.objects.filter(user=user)
    if status:
        qs = qs.filter(status=status)
    if limit:
        qs = qs[:limit]
    return qs


def get_tts_job(
    job_id: UUID,
    user: Optional["AbstractUser"] = None,
) -> Optional[TTSJob]:
    """Get a TTS job by ID."""
    qs = TTSJob.objects.select_related("voice_profile")
    if user:
        qs = qs.filter(user=user)
    return qs.filter(id=job_id).first()


def get_cover_job(
    job_id: UUID,
    user: Optional["AbstractUser"] = None,
) -> Optional[CoverJob]:
    """Get a cover job by ID."""
    qs = CoverJob.objects.select_related("voice_profile")
    if user:
        qs = qs.filter(user=user)
    return qs.filter(id=job_id).first()


def get_job_audio(job: TTSJob | CoverJob) -> Optional[GeneratedAudio]:
    """Get the generated audio for a job."""
    content_type = ContentType.objects.get_for_model(job)
    return GeneratedAudio.objects.filter(
        content_type=content_type,
        object_id=job.id,
    ).first()


def get_audio_url(job: TTSJob | CoverJob, expires: int = 3600) -> Optional[str]:
    """
    Get a presigned URL for the generated audio.
    
    Args:
        job: The TTS or Cover job
        expires: URL expiration time in seconds
        
    Returns:
        Presigned URL or None if no audio exists
    """
    audio = get_job_audio(job)
    if not audio:
        return None
    
    from apps.common.storage import storage
    return storage.get_presigned_url(audio.file_path, expires=expires)