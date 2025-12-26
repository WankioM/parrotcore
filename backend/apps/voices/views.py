# backend/apps/voices/views.py
"""Voice profile API views."""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from .models import VoiceProfile, VoiceSample, VoiceEnrollmentJob, SampleType
from .services import (
    VoiceProfileService,
    enroll_speaking_voice,
    enroll_singing_voice,
)
from .selectors import (
    get_user_voice_profiles,
    get_voice_profile,
    get_latest_enrollment_job,
)
from .serializers import (
    VoiceProfileSerializer,
    VoiceProfileDetailSerializer,
    VoiceSampleSerializer,
    VoiceEnrollmentJobSerializer,
    CreateVoiceProfileSerializer,
    UploadSampleSerializer,
)
from apps.common.storage import storage
from ..utils.audio import get_audio_info

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def voice_profile_list_create(request):
    """
    GET: List all voice profiles for current user
    POST: Create a new voice profile
    """
    if request.method == 'GET':
        profiles = get_user_voice_profiles(request.user)
        serializer = VoiceProfileSerializer(profiles, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CreateVoiceProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        profile = VoiceProfileService.create_voice_profile(
            user=request.user,
            name=serializer.validated_data['name'],
            description=serializer.validated_data.get('description', ''),
        )
        
        return Response(
            VoiceProfileDetailSerializer(profile).data,
            status=status.HTTP_201_CREATED
        )


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def voice_profile_detail(request, profile_id):
    """
    GET: Get voice profile details
    DELETE: Delete voice profile
    """
    profile = get_object_or_404(VoiceProfile, id=profile_id, user=request.user)
    
    if request.method == 'GET':
        serializer = VoiceProfileDetailSerializer(profile)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        VoiceProfileService.delete_voice_profile(profile)
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_speaking_sample(request, profile_id):
    """Upload a speaking voice sample."""
    return _upload_sample(request, profile_id, SampleType.SPEAKING)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_singing_sample(request, profile_id):
    """Upload a singing voice sample."""
    return _upload_sample(request, profile_id, SampleType.SINGING)


def _upload_sample(request, profile_id, sample_type: str):
    """Internal helper for uploading samples."""
    profile = get_object_or_404(VoiceProfile, id=profile_id, user=request.user)
    
    serializer = UploadSampleSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    audio_file = serializer.validated_data['file']
    
    # Validate file size (50MB max)
    max_size = 50 * 1024 * 1024
    if audio_file.size > max_size:
        return Response(
            {'error': 'File size must be less than 50MB'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file type
    allowed_types = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/x-wav']
    if audio_file.content_type not in allowed_types:
        return Response(
            {'error': f'Invalid file type. Allowed: {", ".join(allowed_types)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Save to temporary location to get audio info
        import tempfile
        from pathlib import Path
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio_file.name).suffix) as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = Path(tmp.name)
        
        try:
            # Get audio metadata
            audio_info = get_audio_info(tmp_path)
            duration = audio_info['duration']
            sample_rate = audio_info['sample_rate']
            channels = audio_info['channels']
            
            # Validate duration (0.5s to 5 minutes)
            if duration < 0.5:
                return Response(
                    {'error': 'Audio must be at least 0.5 seconds long'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if duration > 300:
                return Response(
                    {'error': 'Audio must be less than 5 minutes long'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Upload to storage
            storage_key = f"samples/{request.user.id}/{profile.id}/{sample_type}/{audio_file.name}"
            storage.upload_file(tmp_path, storage_key)
            
            # Create sample record
            sample = VoiceProfileService.add_sample(
                voice_profile=profile,
                file_path=storage_key,
                original_filename=audio_file.name,
                duration_seconds=duration,
                sample_type=sample_type,
                file_size_bytes=audio_file.size,
                sample_rate=sample_rate,
                channels=channels,
            )
            
            logger.info(
                f"Uploaded {sample_type} sample {sample.id} for profile {profile.id}"
            )
            
            return Response(
                VoiceSampleSerializer(sample).data,
                status=status.HTTP_201_CREATED
            )
            
        finally:
            tmp_path.unlink(missing_ok=True)
            
    except Exception as e:
        logger.exception("Failed to upload sample")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_speaking(request, profile_id):
    """Start speaking voice enrollment (Chatterbox TTS)."""
    profile = get_object_or_404(VoiceProfile, id=profile_id, user=request.user)
    
    try:
        job = enroll_speaking_voice(profile)
        return Response(
            VoiceEnrollmentJobSerializer(job).data,
            status=status.HTTP_201_CREATED
        )
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_singing(request, profile_id):
    """Start singing voice enrollment (RVC training)."""
    profile = get_object_or_404(VoiceProfile, id=profile_id, user=request.user)
    
    try:
        job = enroll_singing_voice(profile)
        return Response(
            VoiceEnrollmentJobSerializer(job).data,
            status=status.HTTP_201_CREATED
        )
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_enrollment_job(request, profile_id, job_type):
    """Get the latest enrollment job for a profile."""
    profile = get_object_or_404(VoiceProfile, id=profile_id, user=request.user)
    
    if job_type not in ['speaking', 'singing']:
        return Response(
            {'error': 'job_type must be "speaking" or "singing"'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    job = get_latest_enrollment_job(profile, job_type)
    
    if not job:
        return Response(
            {'error': f'No {job_type} enrollment job found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response(VoiceEnrollmentJobSerializer(job).data)
        