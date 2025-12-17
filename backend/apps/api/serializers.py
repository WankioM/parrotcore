"""API serializers."""
from rest_framework import serializers
from apps.voices.models import VoiceProfile, VoiceSample, VoiceEnrollmentJob
from apps.tts.models import TTSJob, CoverJob, GeneratedAudio


# =============================================================================
# VOICE SERIALIZERS
# =============================================================================

class VoiceSampleSerializer(serializers.ModelSerializer):
    """Serializer for voice samples."""
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = VoiceSample
        fields = [
            "id",
            "original_filename",
            "duration_seconds",
            "file_size_bytes",
            "sample_rate",
            "channels",
            "uploaded_at",
            "download_url",
        ]
        read_only_fields = fields
    
    def get_download_url(self, obj) -> str | None:
        from apps.common.storage import storage
        try:
            return storage.get_presigned_url(obj.file_path, expires=3600)
        except Exception:
            return None


class VoiceEnrollmentJobSerializer(serializers.ModelSerializer):
    """Serializer for enrollment jobs."""
    
    class Meta:
        model = VoiceEnrollmentJob
        fields = [
            "id",
            "status",
            "progress_percent",
            "error_message",
            "created_at",
            "started_at",
            "completed_at",
        ]
        read_only_fields = fields


class VoiceProfileSerializer(serializers.ModelSerializer):
    """Serializer for voice profiles."""
    samples = VoiceSampleSerializer(many=True, read_only=True)
    sample_count = serializers.IntegerField(read_only=True)
    total_duration = serializers.FloatField(read_only=True)
    latest_enrollment = serializers.SerializerMethodField()
    
    class Meta:
        model = VoiceProfile
        fields = [
            "id",
            "name",
            "description",
            "status",
            "sample_count",
            "total_duration",
            "created_at",
            "updated_at",
            "samples",
            "latest_enrollment",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]
    
    def get_latest_enrollment(self, obj) -> dict | None:
        from apps.voices.selectors import get_latest_enrollment_job
        job = get_latest_enrollment_job(obj)
        if job:
            return VoiceEnrollmentJobSerializer(job).data
        return None


class VoiceProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating voice profiles."""
    
    class Meta:
        model = VoiceProfile
        fields = ["name", "description"]


class VoiceSampleUploadSerializer(serializers.Serializer):
    """Serializer for uploading voice samples."""
    file = serializers.FileField()
    
    def validate_file(self, value):
        # Check file size (max 50MB)
        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("File too large. Maximum size is 50MB.")
        
        # Check file type
        allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-wav", "audio/wave"]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Invalid file type: {value.content_type}. Allowed: WAV, MP3"
            )
        
        return value


# =============================================================================
# TTS SERIALIZERS
# =============================================================================

class GeneratedAudioSerializer(serializers.ModelSerializer):
    """Serializer for generated audio."""
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneratedAudio
        fields = [
            "id",
            "format",
            "duration_seconds",
            "sample_rate",
            "file_size_bytes",
            "created_at",
            "download_url",
        ]
        read_only_fields = fields
    
    def get_download_url(self, obj) -> str | None:
        from apps.common.storage import storage
        try:
            return storage.get_presigned_url(obj.file_path, expires=3600)
        except Exception:
            return None


class TTSJobSerializer(serializers.ModelSerializer):
    """Serializer for TTS jobs."""
    voice_profile_name = serializers.CharField(source="voice_profile.name", read_only=True)
    audio = serializers.SerializerMethodField()
    
    class Meta:
        model = TTSJob
        fields = [
            "id",
            "voice_profile",
            "voice_profile_name",
            "input_text",
            "status",
            "progress_percent",
            "error_message",
            "created_at",
            "started_at",
            "completed_at",
            "audio",
        ]
        read_only_fields = [
            "id", "status", "progress_percent", "error_message",
            "created_at", "started_at", "completed_at",
        ]
    
    def get_audio(self, obj) -> dict | None:
        from apps.tts.selectors import get_job_audio
        audio = get_job_audio(obj)
        if audio:
            return GeneratedAudioSerializer(audio).data
        return None


class TTSJobCreateSerializer(serializers.Serializer):
    """Serializer for creating TTS jobs."""
    voice_profile_id = serializers.UUIDField()
    text = serializers.CharField(max_length=5000)
    
    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Text cannot be empty.")
        return value.strip()


class CoverJobSerializer(serializers.ModelSerializer):
    """Serializer for cover jobs."""
    voice_profile_name = serializers.CharField(source="voice_profile.name", read_only=True)
    audio = serializers.SerializerMethodField()
    
    class Meta:
        model = CoverJob
        fields = [
            "id",
            "voice_profile",
            "voice_profile_name",
            "original_filename",
            "pitch_shift",
            "vocal_volume",
            "instrumental_volume",
            "status",
            "progress_percent",
            "current_step",
            "error_message",
            "created_at",
            "started_at",
            "completed_at",
            "audio",
        ]
        read_only_fields = [
            "id", "status", "progress_percent", "current_step",
            "error_message", "created_at", "started_at", "completed_at",
        ]
    
    def get_audio(self, obj) -> dict | None:
        from apps.tts.selectors import get_job_audio
        audio = get_job_audio(obj)
        if audio:
            return GeneratedAudioSerializer(audio).data
        return None


class CoverJobCreateSerializer(serializers.Serializer):
    """Serializer for creating cover jobs."""
    voice_profile_id = serializers.UUIDField()
    file = serializers.FileField()
    pitch_shift = serializers.IntegerField(default=0, min_value=-12, max_value=12)
    vocal_volume = serializers.FloatField(default=1.0, min_value=0.0, max_value=2.0)
    instrumental_volume = serializers.FloatField(default=1.0, min_value=0.0, max_value=2.0)
    
    def validate_file(self, value):
        # Check file size (max 100MB for songs)
        if value.size > 100 * 1024 * 1024:
            raise serializers.ValidationError("File too large. Maximum size is 100MB.")
        
        # Check file type
        allowed_types = [
            "audio/wav", "audio/mpeg", "audio/mp3", 
            "audio/x-wav", "audio/wave", "audio/flac"
        ]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Invalid file type: {value.content_type}. Allowed: WAV, MP3, FLAC"
            )
        
        return value