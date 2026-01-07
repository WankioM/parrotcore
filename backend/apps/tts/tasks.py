"""Celery tasks for TTS and cover jobs."""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def run_tts_job(self, job_id: str):
    """
    Celery task to run text-to-speech synthesis.
    
    Args:
        job_id: UUID of the TTSJob
    """
    from uuid import UUID
    from pathlib import Path
    import tempfile
    
    from .models import TTSJob, JobStatus
    from .services import TTSJobService
    from apps.common.storage import storage
    
    logger.info(f"Starting TTS job {job_id}")
    
    try:
        job = TTSJob.objects.select_related("voice_profile").get(id=UUID(job_id))
    except TTSJob.DoesNotExist:
        logger.error(f"TTS job {job_id} not found")
        return
    
    # Mark as processing
    job.status = JobStatus.PROCESSING
    job.started_at = timezone.now()
    job.save(update_fields=["status", "started_at"])
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Download embedding
            embedding_local = temp_path / "embedding.pt"
            storage.download_file(job.voice_profile.embedding_path, embedding_local)
            
            job.progress_percent = 20
            job.save(update_fields=["progress_percent"])
            
            # Run synthesis
            from tts_engine import synthesize
            
            output_local = temp_path / "output.wav"
            result = synthesize(
                text=job.input_text,
                embedding_path=embedding_local,
                output_path=output_local,
                device="cpu",
            )
            
            if not result.success:
                 raise Exception(result.error_message or "Synthesis failed")
            
            job.progress_percent = 80
            job.save(update_fields=["progress_percent"])
            
            # Upload to storage
            audio_key = f"audio/tts/{job.user_id}/{job.id}/output.wav"
            storage.upload_file(output_local, audio_key)
            
            file_size = output_local.stat().st_size
            
            # Mark complete
            TTSJobService.mark_job_complete(
                job=job,
                audio_path=audio_key,
                duration_seconds=result.duration_seconds,
                file_size_bytes=file_size,
                sample_rate=result.sample_rate,
            )
            
    except Exception as e:
        logger.exception(f"TTS job {job_id} failed")
        TTSJobService.mark_job_failed(job, str(e))
        
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))


@shared_task(bind=True, max_retries=2)
def run_cover_job(self, job_id: str):
    """
    Celery task to create an AI song cover.
    
    Pipeline:
    1. Download source song and embedding
    2. Separate vocals from instrumentals (Demucs)
    3. Convert vocals to target voice (RVC)
    4. Mix converted vocals with instrumentals
    5. Upload final cover
    """
    from uuid import UUID
    from pathlib import Path
    import tempfile
    
    from .models import CoverJob, JobStatus
    from .services import CoverJobService
    from apps.common.storage import storage
    
    logger.info(f"Starting cover job {job_id}")
    
    try:
        job = CoverJob.objects.select_related("voice_profile").get(id=UUID(job_id))
    except CoverJob.DoesNotExist:
        logger.error(f"Cover job {job_id} not found")
        return
    
    # Mark as processing
    job.status = JobStatus.PROCESSING
    job.started_at = timezone.now()
    job.current_step = "downloading"
    job.save(update_fields=["status", "started_at", "current_step"])
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Download source song and embedding
            song_local = temp_path / "source_song.wav"
            embedding_local = temp_path / "embedding.pt"
            
            storage.download_file(job.source_song_path, song_local)
            storage.download_file(job.voice_profile.embedding_path, embedding_local)
            
            job.progress_percent = 10
            job.save(update_fields=["progress_percent"])
            
            # Run the cover pipeline
            from tts_engine import create_cover
            
            output_local = temp_path / "cover.wav"
            result = create_cover(
                song_path=song_local,
                embedding_path=embedding_local,
                output_path=output_local,
                pitch_shift=job.pitch_shift,
                vocal_volume=job.vocal_volume,
                instrumental_volume=job.instrumental_volume,
                device="cpu",
            )
            
            if not result.success:
                raise Exception(result.error_message or "Cover creation failed")
            
            job.progress_percent = 90
            job.save(update_fields=["progress_percent"])
            
            # Upload to storage
            audio_key = f"audio/covers/{job.user_id}/{job.id}/cover.wav"
            storage.upload_file(output_local, audio_key)
            
            file_size = output_local.stat().st_size
            
            # Mark complete
            CoverJobService.mark_job_complete(
                job=job,
                audio_path=audio_key,
                duration_seconds=result.duration_seconds,
                file_size_bytes=file_size,
                sample_rate=result.sample_rate,
            )
            
    except Exception as e:
        logger.exception(f"Cover job {job_id} failed")
        CoverJobService.mark_job_failed(job, str(e))
        
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=120 * (self.request.retries + 1))