"""Voice profile queries."""
from typing import Optional
from uuid import UUID
from django.db.models import QuerySet, Sum, Count
from django.contrib.auth import get_user_model

from .models import (
    VoiceProfile,
    VoiceSample,
    VoiceEnrollmentJob,
    VoiceProfileStatus,
)

User = get_user_model()


def get_user_voice_profiles(
    user: User,
    status: Optional[VoiceProfileStatus] = None,
) -> QuerySet[VoiceProfile]:
    """
    Get all voice profiles for a user.
    
    Args:
        user: The user to get profiles for
        status: Optional status filter
        
    Returns:
        QuerySet of VoiceProfiles
    """
    qs = VoiceProfile.objects.filter(user=user)
    if status:
        qs = qs.filter(status=status)
    return qs.prefetch_related("samples")


def get_voice_profile(
    profile_id: UUID,
    user: Optional[User] = None,
) -> Optional[VoiceProfile]:
    """
    Get a voice profile by ID.
    
    Args:
        profile_id: The profile UUID
        user: Optional user to filter by (for security)
        
    Returns:
        VoiceProfile or None
    """
    qs = VoiceProfile.objects.prefetch_related("samples", "enrollment_jobs")
    if user:
        qs = qs.filter(user=user)
    return qs.filter(id=profile_id).first()


def get_ready_voice_profiles(user: User) -> QuerySet[VoiceProfile]:
    """Get all ready-to-use voice profiles for a user."""
    return get_user_voice_profiles(user, status=VoiceProfileStatus.READY)


def get_voice_profile_samples(voice_profile: VoiceProfile) -> QuerySet[VoiceSample]:
    """Get all samples for a voice profile."""
    return voice_profile.samples.all()


def get_voice_profile_stats(voice_profile: VoiceProfile) -> dict:
    """
    Get statistics for a voice profile.
    
    Returns:
        Dict with sample_count, total_duration, etc.
    """
    stats = voice_profile.samples.aggregate(
        sample_count=Count("id"),
        total_duration=Sum("duration_seconds"),
        total_size=Sum("file_size_bytes"),
    )
    return {
        "sample_count": stats["sample_count"] or 0,
        "total_duration_seconds": stats["total_duration"] or 0.0,
        "total_size_bytes": stats["total_size"] or 0,
        "status": voice_profile.status,
        "is_ready": voice_profile.is_ready,
    }


def get_latest_enrollment_job(
    voice_profile: VoiceProfile,
) -> Optional[VoiceEnrollmentJob]:
    """Get the most recent enrollment job for a profile."""
    return voice_profile.enrollment_jobs.order_by("-created_at").first()


def get_enrollment_job(job_id: UUID) -> Optional[VoiceEnrollmentJob]:
    """Get an enrollment job by ID."""
    return VoiceEnrollmentJob.objects.select_related(
        "voice_profile"
    ).filter(id=job_id).first()