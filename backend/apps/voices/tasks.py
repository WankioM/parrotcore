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
            
            # Validate sample count (RVC needs at least 3)
            if total_samples < 3:
                raise ValueError(
                    f"RVC training requires at least 3 singing samples, got {total_samples}"
                )
            
            for idx, sample in enumerate(singing_samples, 1):
                local_path = temp_path / sample.original_filename
                storage.download_file(sample.file_path, local_path)
                sample_paths.append(local_path)
                
                # Update progress (0-10%)
                job.progress_percent = int((idx / total_samples) * 10)
                job.save(update_fields=["progress_percent"])
            
            # Train RVC model
            job.current_step = "Starting RVC training (this will take 2-4 hours)"
            job.progress_percent = 10
            job.save(update_fields=["current_step", "progress_percent"])
            
            from tts_engine.models.rvc_trainer import RVCTrainer, TrainingConfig
            
            # Configure for 6GB VRAM
            config = TrainingConfig(
            sample_rate=40000,
            total_epochs=300,
            batch_size=4,
            save_frequency=50,
            cache_data=False,
            f0_method="rmvpe"  
        )
                    
            trainer = RVCTrainer(
    rvc_root=Path("/app/rvc_webui"),
    device="cuda"
)
            
            model_local_path = temp_path / "voice_model.pth"
            
            # Progress callback for training steps
            def progress_callback(description: str, percent: int):
                # Map training progress to 10-95% range
                mapped_percent = 10 + int(percent * 0.85)
                job.current_step = description
                job.progress_percent = mapped_percent
                job.save(update_fields=["current_step", "progress_percent"])
                logger.info(f"RVC training progress: {description} ({percent}%)")
            
            result = trainer.train_model(
    samples=sample_paths,
    output_path=model_local_path,
    config=config,  # ✅ PASS CONFIG HERE
    progress_callback=progress_callback,
)
            
            if not result.success:
                raise Exception(result.error_message or "RVC training failed")
            
            # Upload model
            job.progress_percent = 95
            job.current_step = "Uploading trained model"
            job.save(update_fields=["progress_percent", "current_step"])
            
            model_key = f"models/{profile.user_id}/{profile.id}/rvc_model.pth"
            storage.upload_file(str(result.model_path), model_key)
            
            # Upload index if available
            if result.index_path and result.index_path.exists():
                index_key = f"models/{profile.user_id}/{profile.id}/rvc_model.index"
                storage.upload_file(str(result.index_path), index_key)
                logger.info(f"Uploaded RVC index: {index_key}")
            
            # Mark complete
            VoiceProfileService.mark_enrollment_complete(job, model_key)
            
            logger.info(f"✅ Singing enrollment completed for job {job_id}")
            
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