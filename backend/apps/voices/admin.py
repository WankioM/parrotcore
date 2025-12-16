"""Admin configuration for voice models."""
from django.contrib import admin
from .models import VoiceProfile, VoiceSample, VoiceEnrollmentJob


class VoiceSampleInline(admin.TabularInline):
    model = VoiceSample
    extra = 0
    readonly_fields = ["id", "uploaded_at", "duration_seconds"]


class VoiceEnrollmentJobInline(admin.TabularInline):
    model = VoiceEnrollmentJob
    extra = 0
    readonly_fields = ["id", "status", "created_at", "completed_at"]


@admin.register(VoiceProfile)
class VoiceProfileAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "status", "sample_count", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["name", "user__username", "user__email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [VoiceSampleInline, VoiceEnrollmentJobInline]


@admin.register(VoiceSample)
class VoiceSampleAdmin(admin.ModelAdmin):
    list_display = ["original_filename", "voice_profile", "duration_seconds", "uploaded_at"]
    list_filter = ["uploaded_at"]
    search_fields = ["original_filename", "voice_profile__name"]
    readonly_fields = ["id", "uploaded_at"]


@admin.register(VoiceEnrollmentJob)
class VoiceEnrollmentJobAdmin(admin.ModelAdmin):
    list_display = ["id", "voice_profile", "status", "progress_percent", "created_at"]
    list_filter = ["status", "created_at"]
    readonly_fields = ["id", "created_at", "started_at", "completed_at"]