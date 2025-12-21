"""API views."""
import logging
from uuid import UUID

from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken

from apps.voices.models import VoiceProfile, VoiceProfileStatus
from apps.voices.services import (
    VoiceProfileService,
    create_voice_profile,
    enroll_voice_profile,
)
from apps.voices.selectors import (
    get_user_voice_profiles,
    get_voice_profile,
    get_ready_voice_profiles,
)
from apps.tts.models import TTSJob, CoverJob
from apps.tts.services import create_tts_job, create_cover_job
from apps.tts.selectors import (
    get_user_tts_jobs,
    get_user_cover_jobs,
    get_tts_job,
    get_cover_job,
)
from apps.common.storage import storage

from .serializers import (
    VoiceProfileSerializer,
    VoiceProfileCreateSerializer,
    VoiceSampleUploadSerializer,
    VoiceSampleSerializer,
    VoiceEnrollmentJobSerializer,
    TTSJobSerializer,
    TTSJobCreateSerializer,
    CoverJobSerializer,
    CoverJobCreateSerializer,
)

logger = logging.getLogger(__name__)


# =============================================================================
# HEALTH CHECK
# =============================================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint."""
    return JsonResponse({
        "status": "healthy",
        "service": "parrotcore-api",
    })


# =============================================================================
# AUTHENTICATION
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    """User registration endpoint."""
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    
    if not username or not email or not password:
        return Response(
            {"error": "Username, email, and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Check if user exists
    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
        }
    }, status=status.HTTP_201_CREATED)


# =============================================================================
# VOICE PROFILES
# =============================================================================

class VoiceProfileViewSet(viewsets.ViewSet):
    """
    API endpoints for voice profiles.
    
    POST   /voices/              - Create new profile
    GET    /voices/              - List user's profiles
    GET    /voices/{id}/         - Get profile details
    DELETE /voices/{id}/         - Delete profile
    POST   /voices/{id}/samples/ - Upload sample
    POST   /voices/{id}/enroll/  - Start enrollment
    """
    permission_classes = [IsAuthenticated]
    # Don't set parser_classes at class level - let DRF use defaults (JSON)
    
    def list(self, request):
        """List all voice profiles for the current user."""
        profiles = get_user_voice_profiles(request.user)
        serializer = VoiceProfileSerializer(profiles, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """Create a new voice profile."""
        serializer = VoiceProfileCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        profile = create_voice_profile(
            user=request.user,
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description", ""),
        )
        
        return Response(
            VoiceProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED,
        )
    
    def retrieve(self, request, pk=None):
        """Get a voice profile by ID."""
        try:
            profile_id = UUID(pk)
        except ValueError:
            return Response(
                {"error": "Invalid profile ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        profile = get_voice_profile(profile_id, user=request.user)
        if not profile:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        return Response(VoiceProfileSerializer(profile).data)
    
    def destroy(self, request, pk=None):
        """Delete a voice profile."""
        try:
            profile_id = UUID(pk)
        except ValueError:
            return Response(
                {"error": "Invalid profile ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        profile = get_voice_profile(profile_id, user=request.user)
        if not profile:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        VoiceProfileService.delete_voice_profile(profile)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def samples(self, request, pk=None):
        """Upload a voice sample to a profile."""
        try:
            profile_id = UUID(pk)
        except ValueError:
            return Response(
                {"error": "Invalid profile ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        profile = get_voice_profile(profile_id, user=request.user)
        if not profile:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        if profile.status not in [VoiceProfileStatus.PENDING, VoiceProfileStatus.FAILED]:
            return Response(
                {"error": "Cannot add samples to a profile that is enrolling or ready"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        serializer = VoiceSampleUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uploaded_file = serializer.validated_data["file"]
        
        # Upload to storage
        storage_key = f"samples/{request.user.id}/{profile.id}/{uploaded_file.name}"
        storage.upload_fileobj(uploaded_file.file, storage_key, content_type=uploaded_file.content_type)
        
        # Get audio duration (simplified - in production use proper audio analysis)
        # For now, estimate based on file size (very rough)
        estimated_duration = uploaded_file.size / (44100 * 2 * 2)  # Assume 44.1kHz, 16-bit, stereo
        
        # Create sample record
        sample = VoiceProfileService.add_sample(
            voice_profile=profile,
            file_path=storage_key,
            original_filename=uploaded_file.name,
            duration_seconds=estimated_duration,
            file_size_bytes=uploaded_file.size,
        )
        
        return Response(
            VoiceSampleSerializer(sample).data,
            status=status.HTTP_201_CREATED,
        )
    
    @action(detail=True, methods=["post"])
    def enroll(self, request, pk=None):
        """Start voice enrollment for a profile."""
        try:
            profile_id = UUID(pk)
        except ValueError:
            return Response(
                {"error": "Invalid profile ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        profile = get_voice_profile(profile_id, user=request.user)
        if not profile:
            return Response(
                {"error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        try:
            job = enroll_voice_profile(profile)
            return Response(
                VoiceEnrollmentJobSerializer(job).data,
                status=status.HTTP_202_ACCEPTED,
            )
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


# =============================================================================
# TTS JOBS
# =============================================================================

class TTSJobViewSet(viewsets.ViewSet):
    """
    API endpoints for TTS jobs.
    
    POST /tts/      - Create new TTS job
    GET  /tts/      - List user's TTS jobs
    GET  /tts/{id}/ - Get job details
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """List all TTS jobs for the current user."""
        jobs = get_user_tts_jobs(request.user, limit=50)
        serializer = TTSJobSerializer(jobs, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """Create a new TTS job."""
        serializer = TTSJobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get voice profile
        profile = get_voice_profile(
            serializer.validated_data["voice_profile_id"],
            user=request.user,
        )
        if not profile:
            return Response(
                {"error": "Voice profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        try:
            job = create_tts_job(
                user=request.user,
                voice_profile=profile,
                input_text=serializer.validated_data["text"],
            )
            return Response(
                TTSJobSerializer(job).data,
                status=status.HTTP_202_ACCEPTED,
            )
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
    
    def retrieve(self, request, pk=None):
        """Get a TTS job by ID."""
        try:
            job_id = UUID(pk)
        except ValueError:
            return Response(
                {"error": "Invalid job ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        job = get_tts_job(job_id, user=request.user)
        if not job:
            return Response(
                {"error": "Job not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        return Response(TTSJobSerializer(job).data)


# =============================================================================
# COVER JOBS
# =============================================================================

class CoverJobViewSet(viewsets.ViewSet):
    """
    API endpoints for cover jobs.
    
    POST /covers/      - Create new cover job
    GET  /covers/      - List user's cover jobs
    GET  /covers/{id}/ - Get job details
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def list(self, request):
        """List all cover jobs for the current user."""
        jobs = get_user_cover_jobs(request.user, limit=50)
        serializer = CoverJobSerializer(jobs, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """Create a new cover job."""
        serializer = CoverJobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get voice profile
        profile = get_voice_profile(
            serializer.validated_data["voice_profile_id"],
            user=request.user,
        )
        if not profile:
            return Response(
                {"error": "Voice profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        uploaded_file = serializer.validated_data["file"]
        
        # Upload song to storage
        storage_key = f"songs/{request.user.id}/{uploaded_file.name}"
        storage.upload_fileobj(uploaded_file.file, storage_key, content_type=uploaded_file.content_type)
        
        try:
            job = create_cover_job(
                user=request.user,
                voice_profile=profile,
                source_song_path=storage_key,
                original_filename=uploaded_file.name,
                pitch_shift=serializer.validated_data.get("pitch_shift", 0),
                vocal_volume=serializer.validated_data.get("vocal_volume", 1.0),
                instrumental_volume=serializer.validated_data.get("instrumental_volume", 1.0),
            )
            return Response(
                CoverJobSerializer(job).data,
                status=status.HTTP_202_ACCEPTED,
            )
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
    
    def retrieve(self, request, pk=None):
        """Get a cover job by ID."""
        try:
            job_id = UUID(pk)
        except ValueError:
            return Response(
                {"error": "Invalid job ID"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        job = get_cover_job(job_id, user=request.user)
        if not job:
            return Response(
                {"error": "Job not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        return Response(CoverJobSerializer(job).data)