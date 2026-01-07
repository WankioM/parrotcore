"""TTS and Cover job models."""
import uuid
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class JobStatus(models.TextChoices):
    """Status for async jobs."""
    PENDING = "pending", "Pending"
    QUEUED = "queued", "Queued"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"
    CANCELLED = "cancelled", "Cancelled"


class TTSJob(models.Model):
    """
    Text-to-speech synthesis job.
    
    Takes text input and generates speech using a voice profile.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tts_jobs",
    )
    voice_profile = models.ForeignKey(
        "voices.VoiceProfile",
        on_delete=models.SET_NULL,
        null=True,
        related_name="tts_jobs",
    )
    
    # Input
    input_text = models.TextField()
    
    # Job tracking
    status = models.CharField(
        max_length=20,
        choices=JobStatus.choices,
        default=JobStatus.PENDING,
    )
    celery_task_id = models.CharField(max_length=255, blank=True)
    progress_percent = models.PositiveSmallIntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "TTS Job"
        verbose_name_plural = "TTS Jobs"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["created_at"]),
        ]
    
    def __str__(self):
        text_preview = self.input_text[:50] + "..." if len(self.input_text) > 50 else self.input_text
        return f"TTS: {text_preview}"
    
    @property
    def duration_seconds(self) -> float | None:
        """How long the job took to complete."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


class CoverJob(models.Model):
    """
    AI song cover job.
    
    Takes a source song and creates a cover using the user's voice.
    Pipeline: Separate vocals → Convert with RVC → Mix back
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cover_jobs",
    )
    voice_profile = models.ForeignKey(
        "voices.VoiceProfile",
        on_delete=models.SET_NULL,
        null=True,
        related_name="cover_jobs",
    )
    
    # Input
    source_song_path = models.CharField(max_length=500)
    original_filename = models.CharField(max_length=255)
    
    # Processing options
    pitch_shift = models.SmallIntegerField(default=0)  # Semitones (-12 to +12)
    vocal_volume = models.FloatField(default=1.0)
    instrumental_volume = models.FloatField(default=1.0)
    
    # Job tracking
    status = models.CharField(
        max_length=20,
        choices=JobStatus.choices,
        default=JobStatus.PENDING,
    )
    celery_task_id = models.CharField(max_length=255, blank=True)
    progress_percent = models.PositiveSmallIntegerField(default=0)
    current_step = models.CharField(max_length=50, blank=True)  # e.g., "separating", "converting", "mixing"
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Cover Job"
        verbose_name_plural = "Cover Jobs"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["created_at"]),
        ]
    
    def __str__(self):
        return f"Cover: {self.original_filename}"
    
    @property
    def duration_seconds(self) -> float | None:
        """How long the job took to complete."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


class AudioFormat(models.TextChoices):
    """Supported audio output formats."""
    WAV = "wav", "WAV"
    MP3 = "mp3", "MP3"
    FLAC = "flac", "FLAC"
    OGG = "ogg", "OGG"


class GeneratedAudio(models.Model):
    """
    Generated audio output from TTS or Cover jobs.
    
    Uses a generic foreign key to link to either TTSJob or CoverJob.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Generic relation to job (TTSJob or CoverJob)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    job = GenericForeignKey("content_type", "object_id")
    
    # File info
    file_path = models.CharField(max_length=500)
    file_size_bytes = models.PositiveIntegerField(default=0)
    format = models.CharField(
        max_length=10,
        choices=AudioFormat.choices,
        default=AudioFormat.WAV,
    )
    
    # Audio metadata
    duration_seconds = models.FloatField()
    sample_rate = models.PositiveIntegerField(default=44100)
    channels = models.PositiveSmallIntegerField(default=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
    
    def __str__(self):
        return f"Audio: {self.file_path} ({self.duration_seconds:.1f}s)"


class SeparatedTracks(models.Model):
    """
    Intermediate separated tracks from a cover job.
    
    Stored temporarily during processing, can be kept for debugging
    or deleted after the final cover is generated.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cover_job = models.OneToOneField(
        CoverJob,
        on_delete=models.CASCADE,
        related_name="separated_tracks",
    )
    
    # Separated audio paths
    vocals_path = models.CharField(max_length=500)
    instrumentals_path = models.CharField(max_length=500)
    
    # Converted vocals (after RVC)
    converted_vocals_path = models.CharField(max_length=500, blank=True)
    
    # Metadata
    sample_rate = models.PositiveIntegerField(default=44100)
    duration_seconds = models.FloatField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Separated Tracks"
        verbose_name_plural = "Separated Tracks"
    
    def __str__(self):
        return f"Tracks for {self.cover_job}"