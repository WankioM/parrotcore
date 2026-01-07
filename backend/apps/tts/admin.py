"""Admin configuration for TTS models."""
from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from .models import TTSJob, CoverJob, GeneratedAudio, SeparatedTracks


class GeneratedAudioInline(GenericTabularInline):
    model = GeneratedAudio
    extra = 0
    readonly_fields = ["id", "file_path", "duration_seconds", "created_at"]


@admin.register(TTSJob)
class TTSJobAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "voice_profile", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["user__username", "input_text"]
    readonly_fields = ["id", "created_at", "started_at", "completed_at"]
    inlines = [GeneratedAudioInline]


class SeparatedTracksInline(admin.StackedInline):
    model = SeparatedTracks
    extra = 0
    readonly_fields = ["id", "created_at"]


@admin.register(CoverJob)
class CoverJobAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "voice_profile", "original_filename", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["user__username", "original_filename"]
    readonly_fields = ["id", "created_at", "started_at", "completed_at"]
    inlines = [SeparatedTracksInline, GeneratedAudioInline]


@admin.register(GeneratedAudio)
class GeneratedAudioAdmin(admin.ModelAdmin):
    list_display = ["id", "file_path", "format", "duration_seconds", "created_at"]
    list_filter = ["format", "created_at"]
    readonly_fields = ["id", "created_at"]