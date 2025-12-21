"""Celery tasks for voice enrollment."""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def run_voice_enrollment(self, job_id: str):
    """
    Celery task to run voice enrollment.
    
    Args:
        job_id: UUID of the VoiceEnrollmentJob
    """
    from uuid import UUID
    from pathlib import Path
    import tempfile
    
    from .models import VoiceEnrollmentJob, EnrollmentJobStatus
    from .services import VoiceProfileService
    from apps.common.storage import storage
    
    logger.info(f"Starting enrollment task for job {job_id}")
    
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
    job.save(update_fields=["status", "started_at"])
    
    profile = job.voice_profile
    
    try:
        # Download samples to temp directory
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            sample_paths = []
            
            for sample in profile.samples.all():
                local_path = temp_path / sample.original_filename
                storage.download_file(sample.file_path, local_path)
                sample_paths.append(local_path)
                
                # Update progress
                job.progress_percent = int(
                    (len(sample_paths) / profile.sample_count) * 50
                )
                job.save(update_fields=["progress_percent"])
            
            # Run enrollment
            from tts_engine import enroll
            
            embedding_local_path = temp_path / f"{profile.id}_embedding.pt"
            result = enroll(
                samples=sample_paths,
                output_path=embedding_local_path,
                device="cpu",  # Use CPU in container for now
            )
            
            if not result.success:
                raise Exception(result.error_message or "Enrollment failed")
            
            job.progress_percent = 80
            job.save(update_fields=["progress_percent"])
            
            # Upload embedding to storage
            embedding_key = f"embeddings/{profile.user_id}/{profile.id}/embedding.pt"
            storage.upload_file(embedding_local_path, embedding_key)
            
            # Mark complete
            VoiceProfileService.mark_enrollment_complete(job, embedding_key)
            
    except Exception as e:
        logger.exception(f"Enrollment failed for job {job_id}")
        VoiceProfileService.mark_enrollment_failed(job, str(e))
        
        # Retry on transient errors
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))