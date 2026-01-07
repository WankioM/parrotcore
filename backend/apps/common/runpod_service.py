# ============================================
# File: backend/apps/common/runpod_service.py
# (Updated with better error handling)
# ============================================
"""
RunPod serverless integration for RVC training.
"""
import runpod
from django.conf import settings
from pathlib import Path
from typing import List, Optional, Callable
import logging
import time

logger = logging.getLogger(__name__)


class RunPodService:
    """Service for interacting with RunPod serverless endpoints"""
    
    def __init__(self):
        self.api_key = settings.RUNPOD_API_KEY
        self.endpoint_id = settings.RUNPOD_ENDPOINT_ID
        self.timeout = settings.RUNPOD_TIMEOUT
        
        if not self.api_key:
            raise ValueError("RUNPOD_API_KEY not configured")
        if not self.endpoint_id:
            raise ValueError("RUNPOD_ENDPOINT_ID not configured")
        
        runpod.api_key = self.api_key
        self.endpoint = runpod.Endpoint(self.endpoint_id)
        
        logger.info(f"RunPod service initialized with endpoint {self.endpoint_id}")
    
    def train_rvc_model(
        self,
        sample_urls: List[str],
        upload_url: str,
        epochs: int = 100,
        batch_size: int = 32,
        progress_callback: Optional[Callable[[str], None]] = None
    ) -> dict:
        """
        Train RVC model on RunPod GPU.
        
        Args:
            sample_urls: List of presigned GET URLs to download voice samples
            upload_url: Presigned PUT URL to upload trained model
            epochs: Number of training epochs
            batch_size: Training batch size
            progress_callback: Optional callback for progress updates
        
        Returns:
            dict with success status and model info
        
        Raises:
            RuntimeError: If training fails
            TimeoutError: If training exceeds timeout
        """
        logger.info(f"Submitting RVC training job to RunPod")
        logger.info(f"  Samples: {len(sample_urls)}")
        logger.info(f"  Epochs: {epochs}, Batch size: {batch_size}")
        
        try:
            # Submit job to RunPod
            run_request = self.endpoint.run({
                "sample_urls": sample_urls,
                "upload_url": upload_url,
                "epochs": epochs,
                "batch_size": batch_size
            })
            
            job_id = run_request.job_id
            logger.info(f"RunPod job submitted: {job_id}")
            
            if progress_callback:
                progress_callback("Job submitted to RunPod GPU (cold start ~30-60s)")
            
            # Poll for completion
            start_time = time.time()
            last_status = None
            poll_count = 0
            
            while True:
                poll_count += 1
                status = run_request.status()
                
                # Log status changes
                if status != last_status:
                    elapsed = time.time() - start_time
                    logger.info(f"RunPod job status: {status} (elapsed: {elapsed:.0f}s)")
                    
                    if progress_callback:
                        if status == "IN_QUEUE":
                            progress_callback("Job queued, waiting for GPU...")
                        elif status == "IN_PROGRESS":
                            progress_callback("GPU allocated, training in progress...")
                        else:
                            progress_callback(f"Status: {status}")
                    
                    last_status = status
                
                # Check if completed
                if status == "COMPLETED":
                    output = run_request.output()
                    elapsed = time.time() - start_time
                    
                    if output.get('success'):
                        logger.info(f"✓ RVC training completed in {elapsed:.0f}s")
                        logger.info(f"  Model size: {output.get('model_size_mb', 0):.2f} MB")
                        
                        if progress_callback:
                            progress_callback(f"Training complete! ({elapsed/60:.1f} minutes)")
                        
                        return output
                    else:
                        error = output.get('error', 'Unknown error')
                        logger.error(f"RVC training failed: {error}")
                        raise RuntimeError(f"Training failed: {error}")
                
                elif status == "FAILED":
                    error_output = run_request.output()
                    error = error_output.get('error', 'Unknown error')
                    logger.error(f"RunPod job failed: {error}")
                    raise RuntimeError(f"RunPod job failed: {error}")
                
                # Check timeout
                elapsed = time.time() - start_time
                if elapsed > self.timeout:
                    logger.error(f"RunPod job timeout after {elapsed:.0f}s")
                    raise TimeoutError(f"Training exceeded {self.timeout}s timeout")
                
                # Adaptive polling interval
                if poll_count < 10:
                    wait_time = 2  # Poll every 2s for first 20s
                elif poll_count < 30:
                    wait_time = 5  # Then every 5s
                else:
                    wait_time = 10  # Then every 10s
                
                time.sleep(wait_time)
        
        except Exception as e:
            logger.exception("RunPod training error")
            raise
    
    def check_endpoint_status(self) -> dict:
        """Check if endpoint is available"""
        try:
            logger.info(f"Checking endpoint {self.endpoint_id}")
            return {
                "available": True,
                "endpoint_id": self.endpoint_id
            }
        except Exception as e:
            logger.error(f"Failed to check endpoint: {e}")
            return {
                "available": False,
                "error": str(e)
            }


# Singleton instance
def get_runpod_service() -> RunPodService:
    """Get RunPod service instance"""
    return RunPodService()