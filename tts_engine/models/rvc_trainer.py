# tts_engine/models/rvc_trainer.py
"""
RVC Training Wrapper - Optimized for 6GB VRAM.
Wraps the official RVC-WebUI training pipeline.
"""
import logging
import subprocess
import sys
import shutil
from pathlib import Path
from typing import List, Optional, Callable
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class TrainingConfig:
    """Configuration for RVC training - optimized for RTX 3050."""
    sample_rate: int = 40000  # 40k (lower memory than 48k)
    f0_method: str = "rmvpe"  # Best quality
    model_version: str = "v2"
    save_frequency: int = 50  # Save every 50 epochs
    total_epochs: int = 300  # Minimum for decent quality
    batch_size: int = 4  # Small batch for 6GB VRAM
    
    # Memory optimization flags
    cache_data: bool = False  # Don't cache in memory (saves RAM)
    save_only_latest: bool = True  # Don't keep old checkpoints


@dataclass
class TrainingResult:
    """Result from RVC training."""
    model_path: Optional[Path]
    index_path: Optional[Path]
    success: bool
    error_message: Optional[str] = None


class RVCTrainer:
    """
    Wrapper for RVC-WebUI training pipeline.
    
    Training steps:
    1. Preprocess audio (resample, slice)
    2. Extract pitch (F0) 
    3. Extract features (HuBERT embeddings)
    4. Train model (generator + discriminator)
    5. Build feature index (for retrieval)
    """
    
    def __init__(
        self,
        model_name: str,
        config: Optional[TrainingConfig] = None,
    ):
        self.model_name = model_name
        self.config = config or TrainingConfig()
        
        # Paths
        self.rvc_root = Path("/app/rvc_webui")
        self.assets_dir = Path("/app/assets")
        self.logs_dir = self.rvc_root / "logs" / model_name
        self.dataset_dir = self.rvc_root / "datasets" / model_name
        
        # Ensure directories exist
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self.dataset_dir.mkdir(parents=True, exist_ok=True)
    
    def _run_script(
        self,
        script_name: str,
        args: List[str],
        description: str,
        progress_callback: Optional[Callable[[str, int], None]] = None
    ) -> bool:
        """Run an RVC training script."""
        script_path = self.rvc_root / script_name
        
        if not script_path.exists():
            logger.error(f"Script not found: {script_path}")
            return False
        
        logger.info(f"{description}...")
        if progress_callback:
            progress_callback(description, 0)
        
        try:
            cmd = [sys.executable, str(script_path)] + args
            logger.info(f"Running: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                cwd=str(self.rvc_root),
                capture_output=True,
                text=True,
                check=True
            )
            
            logger.info(f"{description} completed")
            if result.stdout:
                logger.debug(f"Output: {result.stdout}")
            
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"{description} failed: {e}")
            if e.stdout:
                logger.error(f"stdout: {e.stdout}")
            if e.stderr:
                logger.error(f"stderr: {e.stderr}")
            return False
    
    def _prepare_dataset(self, samples: List[Path]) -> bool:
        """Copy samples to dataset directory."""
        logger.info(f"Preparing dataset with {len(samples)} samples...")
        
        try:
            # Clear existing dataset
            if self.dataset_dir.exists():
                shutil.rmtree(self.dataset_dir)
            self.dataset_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy samples
            for i, sample in enumerate(samples):
                dest = self.dataset_dir / f"sample_{i:03d}{sample.suffix}"
                shutil.copy2(sample, dest)
                logger.info(f"Copied: {sample.name} -> {dest.name}")
            
            return True
            
        except Exception as e:
            logger.exception(f"Failed to prepare dataset: {e}")
            return False
    
    def train_model(
        self,
        samples: List[Path],
        output_path: Path,
        progress_callback: Optional[Callable[[str, int], None]] = None
    ) -> TrainingResult:
        """
        Train RVC model using the official RVC-WebUI pipeline.
        
        Args:
            samples: List of audio file paths for training
            output_path: Where to save the final .pth model
            progress_callback: Optional callback(description, percent)
        
        Returns:
            TrainingResult with model and index paths
        """
        try:
            # Step 0: Prepare dataset
            if progress_callback:
                progress_callback("Preparing training data", 0)
            
            if not self._prepare_dataset(samples):
                return TrainingResult(
                    model_path=None,
                    index_path=None,
                    success=False,
                    error_message="Failed to prepare dataset"
                )
            
            # Step 1: Preprocess audio
            if not self._run_script(
                "trainset_preprocess_pipeline_print.py",
                [
                    str(self.dataset_dir),
                    str(self.config.sample_rate),
                    "1",  # CPU threads
                ],
                "Step 1/5: Preprocessing audio",
                progress_callback
            ):
                return TrainingResult(
                    model_path=None,
                    index_path=None,
                    success=False,
                    error_message="Audio preprocessing failed"
                )
            
            if progress_callback:
                progress_callback("Audio preprocessing complete", 15)
            
            # Step 2: Extract pitch (F0)
            if not self._run_script(
                "extract_f0_print.py",
                [
                    str(self.logs_dir),
                    "1",  # CPU threads
                    self.config.f0_method,
                ],
                "Step 2/5: Extracting pitch (F0)",
                progress_callback
            ):
                return TrainingResult(
                    model_path=None,
                    index_path=None,
                    success=False,
                    error_message="F0 extraction failed"
                )
            
            if progress_callback:
                progress_callback("Pitch extraction complete", 30)
            
            # Step 3: Extract features (HuBERT)
            hubert_model = self.assets_dir / "hubert" / "hubert_base.pt"
            if not hubert_model.exists():
                return TrainingResult(
                    model_path=None,
                    index_path=None,
                    success=False,
                    error_message=f"HuBERT model not found: {hubert_model}"
                )
            
            if not self._run_script(
                "extract_feature_print.py",
                [
                    "cuda:0",  # Use GPU
                    "1",  # Version
                    str(self.logs_dir),
                    self.config.model_version,
                ],
                "Step 3/5: Extracting HuBERT features",
                progress_callback
            ):
                return TrainingResult(
                    model_path=None,
                    index_path=None,
                    success=False,
                    error_message="Feature extraction failed"
                )
            
            if progress_callback:
                progress_callback("Feature extraction complete", 45)
            
            # Step 4: Train model
            sr_k = self.config.sample_rate // 1000  # 40k -> 40
            pretrain_g = self.assets_dir / "pretrained_v2" / f"f0G{sr_k}k.pth"
            pretrain_d = self.assets_dir / "pretrained_v2" / f"f0D{sr_k}k.pth"
            
            if not pretrain_g.exists() or not pretrain_d.exists():
                return TrainingResult(
                    model_path=None,
                    index_path=None,
                    success=False,
                    error_message=f"Pretrained models not found: {pretrain_g}, {pretrain_d}"
                )
            
            if not self._run_script(
                "train_nsf_sim_cache_sid_load_pretrain.py",
                [
                    "-e", self.model_name,
                    "-sr", str(self.config.sample_rate),
                    "-f0", "1",  # Use F0
                    "-bs", str(self.config.batch_size),
                    "-g", "0",  # GPU 0
                    "-te", str(self.config.total_epochs),
                    "-se", str(self.config.save_frequency),
                    "-pg", str(pretrain_g),
                    "-pd", str(pretrain_d),
                    "-l", "0",  # Don't load checkpoint
                    "-c", "1" if self.config.cache_data else "0",
                    "-sw", "1" if self.config.save_only_latest else "0",
                    "-v", self.config.model_version,
                ],
                f"Step 4/5: Training model ({self.config.total_epochs} epochs - this will take 2-4 hours)",
                progress_callback
            ):
                return TrainingResult(
                    model_path=None,
                    index_path=None,
                    success=False,
                    error_message="Model training failed"
                )
            
            if progress_callback:
                progress_callback("Model training complete", 90)
            
            # Step 5: Build index
            if not self._run_script(
                "train_index.py",
                [
                    str(self.logs_dir),
                    self.config.model_version,
                ],
                "Step 5/5: Building feature index",
                progress_callback
            ):
                logger.warning("Index building failed, continuing without index")
                # Index is optional, so we continue
            
            if progress_callback:
                progress_callback("Training pipeline complete", 95)
            
            # Find the trained model and index
            model_files = list(self.logs_dir.glob("*.pth"))
            # Filter out discriminator models (we only want generator)
            model_files = [f for f in model_files if "_G_" in f.name or "G.pth" in f.name]
            
            if not model_files:
                return TrainingResult(
                    model_path=None,
                    index_path=None,
                    success=False,
                    error_message="Trained model not found in logs directory"
                )
            
            # Get the latest model
            model_path = max(model_files, key=lambda p: p.stat().st_mtime)
            
            # Find index
            index_files = list(self.logs_dir.glob("*.index"))
            index_path = index_files[0] if index_files else None
            
            # Copy to output location
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(model_path, output_path)
            logger.info(f"Copied model: {model_path} -> {output_path}")
            
            final_index_path = None
            if index_path:
                final_index_path = output_path.parent / f"{output_path.stem}.index"
                shutil.copy2(index_path, final_index_path)
                logger.info(f"Copied index: {index_path} -> {final_index_path}")
            
            if progress_callback:
                progress_callback("Training complete!", 100)
            
            logger.info("✅ RVC training completed successfully!")
            logger.info(f"   Model: {output_path}")
            logger.info(f"   Index: {final_index_path or 'None'}")
            
            return TrainingResult(
                model_path=output_path,
                index_path=final_index_path,
                success=True
            )
            
        except Exception as e:
            logger.exception("RVC training failed with exception")
            return TrainingResult(
                model_path=None,
                index_path=None,
                success=False,
                error_message=str(e)
            )