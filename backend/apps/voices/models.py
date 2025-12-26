# apps/voices/models.py
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


class EnrollmentJobStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    QUEUED = "queued", "Queued"  
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class SampleType(models.TextChoices):
    """Type of voice sample."""
    SPEAKING = "speaking", "Speaking"
    SINGING = "singing", "Singing"


class VoiceProfile(models.Model):
    """
    A user's cloned voice profile.
    
    Can contain both speaking (TTS) and singing (RVC) voice models.
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
    

    speaking_status = models.CharField(
        max_length=20,
        choices=VoiceProfileStatus.choices,
        default=VoiceProfileStatus.PENDING,
    )
    singing_status = models.CharField(
        max_length=20,
        choices=VoiceProfileStatus.choices,
        default=VoiceProfileStatus.PENDING,
    )
    
  
    embedding_path = models.CharField(max_length=500, blank=True)
    

    chatterbox_embedding_path = models.CharField(max_length=500, blank=True)
    rvc_model_path = models.CharField(max_length=500, blank=True)
    

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["user", "speaking_status"]),
            models.Index(fields=["user", "singing_status"]),
            models.Index(fields=["created_at"]),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"
    
    def save(self, *args, **kwargs):
        """Sync legacy fields with new fields for backward compatibility."""
        # Sync status: if speaking_status changes, update legacy status
        if self.speaking_status and not self.pk:  # New instance
            self.status = self.speaking_status
        
        # Sync embedding_path: if chatterbox_embedding_path changes, update legacy
        if self.chatterbox_embedding_path:
            self.embedding_path = self.chatterbox_embedding_path
            
        super().save(*args, **kwargs)
    
    @property
    def is_ready(self) -> bool:
        """Legacy property - checks if speaking voice is ready."""
        return self.speaking_status == VoiceProfileStatus.READY
    
    @property
    def is_speaking_ready(self) -> bool:
        """Check if speaking voice (TTS) is ready."""
        return self.speaking_status == VoiceProfileStatus.READY
    
    @property
    def is_singing_ready(self) -> bool:
        """Check if singing voice (RVC) is ready."""
        return self.singing_status == VoiceProfileStatus.READY
    
    @property
    def sample_count(self) -> int:
        """Total sample count (legacy - both types)."""
        return self.samples.count()
    
    @property
    def speaking_sample_count(self) -> int:
        """Count of speaking samples."""
        return self.samples.filter(sample_type=SampleType.SPEAKING).count()
    
    @property
    def singing_sample_count(self) -> int:
        """Count of singing samples."""
        return self.samples.filter(sample_type=SampleType.SINGING).count()
    
    @property
    def total_duration(self) -> float:
        """Total duration of all samples."""
        return self.samples.aggregate(
            total=models.Sum("duration_seconds")
        )["total"] or 0.0


class VoiceSample(models.Model):
    """
    An audio sample used to create a voice profile.
    
    Can be either speaking (for TTS) or singing (for RVC).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voice_profile = models.ForeignKey(
        VoiceProfile,
        on_delete=models.CASCADE,
        related_name="samples",
    )
    
    # NEW: Sample type
    sample_type = models.CharField(
        max_length=20,
        choices=SampleType.choices,
        default=SampleType.SPEAKING,  # Default to speaking for backward compatibility
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
        indexes = [
            models.Index(fields=["voice_profile", "sample_type"]),
        ]
    
    def __str__(self):
        return f"{self.original_filename} ({self.sample_type}, {self.duration_seconds:.1f}s)"


class VoiceEnrollmentJob(models.Model):
    """
    Tracks async voice enrollment tasks.
    
    Can be either speaking (Chatterbox) or singing (RVC) enrollment.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voice_profile = models.ForeignKey(
        VoiceProfile,
        on_delete=models.CASCADE,
        related_name="enrollment_jobs",
    )
    
    # NEW: Job type
    job_type = models.CharField(
        max_length=20,
        choices=SampleType.choices,
        default=SampleType.SPEAKING,  # Default to speaking for backward compatibility
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
    current_step = models.CharField(max_length=100, blank=True)  # NEW: for detailed progress
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        get_latest_by = "created_at"
        indexes = [
            models.Index(fields=["voice_profile", "job_type", "status"]),
        ]
    
    def __str__(self):
        return f"Enrollment {self.id} ({self.job_type}) - {self.status}"
    
    @property
    def duration_seconds(self) -> float | None:
        """How long the job took to complete."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None
    
    @property
    def is_speaking_job(self) -> bool:
        """Check if this is a speaking enrollment job."""
        return self.job_type == SampleType.SPEAKING
    
    @property
    def is_singing_job(self) -> bool:
        """Check if this is a singing enrollment job."""
        return self.job_type == SampleType.SINGING