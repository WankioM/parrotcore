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
    Celery task to run singing voice training via RunPod GPU.
    
    This task:
    1. Generates presigned URLs for voice samples
    2. Submits training job to RunPod serverless GPU
    3. RunPod downloads samples, trains RVC model, uploads result to MinIO
    4. Updates job status based on RunPod progress
    
    Args:
        job_id: UUID of the VoiceEnrollmentJob
    """
    from uuid import UUID
    
    from .models import VoiceEnrollmentJob, EnrollmentJobStatus, SampleType
    from .services import VoiceProfileService
    from apps.common.storage import storage
    from apps.common.runpod_service import get_runpod_service
    
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
    job.current_step = "Preparing samples for RunPod GPU"
    job.progress_percent = 0
    job.save(update_fields=["status", "started_at", "current_step", "progress_percent"])
    
    profile = job.voice_profile
    
    try:
        # Get SINGING samples (no need to download - RunPod will download directly)
        singing_samples = profile.samples.filter(sample_type=SampleType.SINGING)
        total_samples = singing_samples.count()
        
        # Validate sample count (RVC needs at least 3)
        if total_samples < 3:
            raise ValueError(
                f"RVC training requires at least 3 singing samples, got {total_samples}"
            )
        
        logger.info(f"Found {total_samples} singing samples for RunPod training")
        
        # Update progress
        job.current_step = f"Generating presigned URLs for {total_samples} samples"
        job.progress_percent = 5
        job.save(update_fields=["current_step", "progress_percent"])
        
        # Generate presigned GET URLs for samples (RunPod will download these)
        sample_urls = []
        for sample in singing_samples:
            url = storage.get_presigned_url(
                sample.file_path,
                expires=7200,  # 2 hours - plenty of time for cold start + training
                method='get_object'
            )
            sample_urls.append(url)
            logger.debug(f"Generated URL for sample: {sample.original_filename}")
        
        logger.info(f"Generated {len(sample_urls)} presigned download URLs")
        
        # Generate presigned PUT URL for model upload (RunPod will upload trained model here)
        model_key = f"models/{profile.user_id}/{profile.id}/rvc_model.pth"
        upload_url = storage.get_presigned_url(
            model_key,
            expires=7200,  # 2 hours
            method='put_object'
        )
        
        logger.info(f"Trained model will be uploaded to: {model_key}")
        
        # Update progress
        job.current_step = "Submitting job to RunPod GPU (cold start may take 30-60s)"
        job.progress_percent = 10
        job.save(update_fields=["current_step", "progress_percent"])
        
        # Progress callback for RunPod status updates
        def progress_callback(message: str):
            """Update job progress from RunPod status changes"""
            try:
                job.refresh_from_db()
                
                # Update current step with RunPod message
                job.current_step = f"RunPod: {message}"
                
                # Map RunPod status to progress percentage
                message_lower = message.lower()
                if "submitted" in message_lower or "queued" in message_lower:
                    job.progress_percent = 15
                elif "gpu" in message_lower and "allocated" in message_lower:
                    job.progress_percent = 20
                elif "training" in message_lower or "progress" in message_lower:
                    # Training is 20-90% of the process
                    job.progress_percent = min(job.progress_percent + 5, 90)
                elif "complete" in message_lower:
                    job.progress_percent = 95
                
                job.save(update_fields=["current_step", "progress_percent"])
                logger.info(f"RunPod update: {message} ({job.progress_percent}%)")
                
            except Exception as e:
                logger.warning(f"Failed to update job progress: {e}")
        
        # Call RunPod service for GPU training
        logger.info("Calling RunPod for RVC training...")
        logger.info(f"  Samples: {len(sample_urls)}")
        logger.info(f"  Epochs: 300, Batch size: 4")
        
        runpod = get_runpod_service()
        
        result = runpod.train_rvc_model(
            sample_urls=sample_urls,
            upload_url=upload_url,
            epochs=300,      # Full training for quality
            batch_size=4,    # Conservative batch size for stability
            progress_callback=progress_callback
        )
        
        # Check result from RunPod
        if not result.get('success'):
            error_msg = result.get('error', 'Unknown error from RunPod')
            logger.error(f"RunPod training failed: {error_msg}")
            raise Exception(f"RunPod training failed: {error_msg}")
        
        logger.info(f"✅ RunPod training completed successfully!")
        logger.info(f"   Model size: {result.get('model_size_mb', 0):.2f} MB")
        logger.info(f"   Uploaded to: {model_key}")
        
        # Update final progress
        job.progress_percent = 100
        job.current_step = "Training complete! Model ready for use."
        job.save(update_fields=["progress_percent", "current_step"])
        
        # Mark enrollment as complete (model already uploaded by RunPod)
        VoiceProfileService.mark_enrollment_complete(job, model_key)
        
        logger.info(f"✅ Singing enrollment completed for job {job_id}")
        logger.info(f"   Profile {profile.id} ready for AI covers")
        
    except Exception as e:
        logger.exception(f"Singing enrollment failed for job {job_id}: {e}")
        
        # Update job with error details
        error_message = str(e)
        if len(error_message) > 500:
            error_message = error_message[:497] + "..."
        
        VoiceProfileService.mark_enrollment_failed(job, error_message)
        
        # Retry on transient errors (network issues, temporary RunPod unavailability)
        if self.request.retries < self.max_retries:
            retry_count = self.request.retries + 1
            countdown = 60 * retry_count  # 60s, 120s, 180s
            logger.info(f"Retrying job {job_id} in {countdown}s (attempt {retry_count}/{self.max_retries})")
            raise self.retry(exc=e, countdown=countdown)
        else:
            logger.error(f"Job {job_id} failed after {self.max_retries} retries")

# LEGACY: Keep for backward compatibility
@shared_task(bind=True, max_retries=3)
def run_voice_enrollment(self, job_id: str):
    """
    Legacy task that delegates to speaking enrollment.
    
    Kept for backward compatibility with existing code.
    """
    logger.info(f"Legacy enrollment task called, delegating to speaking enrollment")
    return run_speaking_enrollment(self, job_id)