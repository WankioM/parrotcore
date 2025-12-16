"""Voice profile and sample models."""
import uuid
from django.db import models
from django.conf import settings


class VoiceProfileStatus(models.TextChoices):
    """Status of a voice profile."""
    PENDING = "pending", "Pending Samples"
    ENROLLING = "enrolling", "Enrolling"
    READY = "ready", "Ready"
    FAILED = "failed", "Failed"


class VoiceProfile(models.Model):
    """
    A user's cloned voice profile.
    
    Contains the voice embedding created from audio samples,
    which can be used for TTS synthesis or song covers.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="voice_profiles",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=VoiceProfileStatus.choices,
        default=VoiceProfileStatus.PENDING,
    )
    embedding_path = models.CharField(max_length=500, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["created_at"]),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"
    
    @property
    def is_ready(self) -> bool:
        return self.status == VoiceProfileStatus.READY
    
    @property
    def sample_count(self) -> int:
        return self.samples.count()
    
    @property
    def total_duration(self) -> float:
        return self.samples.aggregate(
            total=models.Sum("duration_seconds")
        )["total"] or 0.0


class VoiceSample(models.Model):
    """
    An audio sample used to create a voice profile.
    
    Users upload multiple samples which are combined
    to create the voice embedding.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voice_profile = models.ForeignKey(
        VoiceProfile,
        on_delete=models.CASCADE,
        related_name="samples",
    )
    file_path = models.CharField(max_length=500)
    original_filename = models.CharField(max_length=255)
    duration_seconds = models.FloatField()
    file_size_bytes = models.PositiveIntegerField(default=0)
    
    # Audio metadata
    sample_rate = models.PositiveIntegerField(null=True, blank=True)
    channels = models.PositiveSmallIntegerField(null=True, blank=True)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["uploaded_at"]
    
    def __str__(self):
        return f"{self.original_filename} ({self.duration_seconds:.1f}s)"


class EnrollmentJobStatus(models.TextChoices):
    """Status of an enrollment job."""
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class VoiceEnrollmentJob(models.Model):
    """
    Tracks async voice enrollment tasks.
    
    Created when a user triggers enrollment, updated by Celery worker.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voice_profile = models.ForeignKey(
        VoiceProfile,
        on_delete=models.CASCADE,
        related_name="enrollment_jobs",
    )
    status = models.CharField(
        max_length=20,
        choices=EnrollmentJobStatus.choices,
        default=EnrollmentJobStatus.PENDING,
    )
    
    # Celery task tracking
    celery_task_id = models.CharField(max_length=255, blank=True)
    
    # Progress & results
    progress_percent = models.PositiveSmallIntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        get_latest_by = "created_at"
    
    def __str__(self):
        return f"Enrollment {self.id} - {self.status}"
    
    @property
    def duration_seconds(self) -> float | None:
        """How long the job took to complete."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None