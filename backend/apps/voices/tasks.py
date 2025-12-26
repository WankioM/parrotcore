# apps/voices/tasks.py
"""Celery tasks for voice enrollment."""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def run_speaking_enrollment(self, job_id: str):
    """
    Celery task to run speaking voice enrollment (Chatterbox TTS).
    
    Args:
        job_id: UUID of the VoiceEnrollmentJob
    """
    from uuid import UUID
    from pathlib import Path
    import tempfile
    
    from .models import VoiceEnrollmentJob, EnrollmentJobStatus, SampleType
    from .services import VoiceProfileService
    from apps.common.storage import storage
    
    logger.info(f"Starting speaking enrollment task for job {job_id}")
    
    # Get the job
    try:
        job = VoiceEnrollmentJob.objects.select_related(
            "voice_profile"
        ).get(id=UUID(job_id))
    except VoiceEnrollmentJob.DoesNotExist:
        logger.error(f"Enrollment job {job_id} not found")
        return
    
    # Mark as processing
    job.status = EnrollmentJobStatus.PROCESSING
    job.started_at = timezone.now()
    job.current_step = "Downloading samples"
    job.save(update_fields=["status", "started_at", "current_step"])
    
    profile = job.voice_profile
    
    try:
        # Download SPEAKING samples only
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            sample_paths = []
            
            speaking_samples = profile.samples.filter(sample_type=SampleType.SPEAKING)
            total_samples = speaking_samples.count()
            
            for idx, sample in enumerate(speaking_samples, 1):
                local_path = temp_path / sample.original_filename
                storage.download_file(sample.file_path, local_path)
                sample_paths.append(local_path)
                
                # Update progress
                job.progress_percent = int((idx / total_samples) * 40)
                job.save(update_fields=["progress_percent"])
            
            # Run Chatterbox enrollment
            job.current_step = "Training Chatterbox model"
            job.save(update_fields=["current_step"])
            
            from tts_engine import enroll
            
            embedding_local_path = temp_path / f"{profile.id}_chatterbox.pt"
            result = enroll(
                samples=sample_paths,
                output_path=embedding_local_path,
                device="cpu",  # Use CPU in container for now
            )
            
            if not result.success:
                raise Exception(result.error_message or "Chatterbox enrollment failed")
            
            job.progress_percent = 80
            job.current_step = "Uploading model"
            job.save(update_fields=["progress_percent", "current_step"])
            
            # Upload embedding to storage
            embedding_key = f"embeddings/{profile.user_id}/{profile.id}/chatterbox.pt"
            storage.upload_file(embedding_local_path, embedding_key)
            
            # Mark complete
            VoiceProfileService.mark_enrollment_complete(job, embedding_key)
            
    except Exception as e:
        logger.exception(f"Speaking enrollment failed for job {job_id}")
        VoiceProfileService.mark_enrollment_failed(job, str(e))
        
        # Retry on transient errors
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))


@shared_task(bind=True, max_retries=3)
def run_singing_enrollment(self, job_id: str):
    """
    Celery task to run singing voice training (RVC).
    
    Args:
        job_id: UUID of the VoiceEnrollmentJob
    """
    from uuid import UUID
    from pathlib import Path
    import tempfile
    
    from .models import VoiceEnrollmentJob, EnrollmentJobStatus, SampleType
    from .services import VoiceProfileService
    from apps.common.storage import storage
    
    logger.info(f"Starting singing enrollment task for job {job_id}")
    
    # Get the job
    try:
        job = VoiceEnrollmentJob.objects.select_related(
            "voice_profile"
        ).get(id=UUID(job_id))
    except VoiceEnrollmentJob.DoesNotExist:
        logger.error(f"Enrollment job {job_id} not found")
        return
    
    # Mark as processing
    job.status = EnrollmentJobStatus.PROCESSING
    job.started_at = timezone.now()
    job.current_step = "Downloading samples"
    job.save(update_fields=["status", "started_at", "current_step"])
    
    profile = job.voice_profile
    
    try:
        # Download SINGING samples only
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            sample_paths = []
            
            singing_samples = profile.samples.filter(sample_type=SampleType.SINGING)
            total_samples = singing_samples.count()
            
            for idx, sample in enumerate(singing_samples, 1):
                local_path = temp_path / sample.original_filename
                storage.download_file(sample.file_path, local_path)
                sample_paths.append(local_path)
                
                # Update progress
                job.progress_percent = int((idx / total_samples) * 20)
                job.save(update_fields=["progress_percent"])
            
            # Train RVC model
            job.current_step = "Training RVC model"
            job.progress_percent = 20
            job.save(update_fields=["current_step", "progress_percent"])
            
            from tts_engine.models.rvc_wrapper import RVCWrapper
            
            rvc = RVCWrapper(device="cpu")  # Use CPU for now
            model_local_path = temp_path / f"{profile.id}_rvc.pth"
            
            # Progress callback
            def progress_callback(current_step: str, percent: int):
                job.current_step = current_step
                job.progress_percent = 20 + int(percent * 0.7)  # 20-90%
                job.save(update_fields=["current_step", "progress_percent"])
            
            result = rvc.train_model(
                samples=sample_paths,
                output_path=model_local_path,
                progress_callback=progress_callback,
            )
            
            if not result.success:
                raise Exception(result.error_message or "RVC training failed")
            
            job.progress_percent = 90
            job.current_step = "Uploading model"
            job.save(update_fields=["progress_percent", "current_step"])
            
            # Upload model to storage
            model_key = f"models/{profile.user_id}/{profile.id}/rvc_model.pth"
            storage.upload_file(model_local_path, model_key)
            
            # Mark complete
            VoiceProfileService.mark_enrollment_complete(job, model_key)
            
    except Exception as e:
        logger.exception(f"Singing enrollment failed for job {job_id}")
        VoiceProfileService.mark_enrollment_failed(job, str(e))
        
        # Retry on transient errors
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))


# LEGACY: Keep for backward compatibility
@shared_task(bind=True, max_retries=3)
def run_voice_enrollment(self, job_id: str):
    """
    Legacy task that delegates to speaking enrollment.
    
    Kept for backward compatibility with existing code.
    """
    logger.info(f"Legacy enrollment task called, delegating to speaking enrollment")
    return run_speaking_enrollment(self, job_id)