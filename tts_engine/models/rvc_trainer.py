"""RVC model trainer using RVC-WebUI pipeline."""
import subprocess
import logging
from pathlib import Path
from typing import Optional, Callable, List
from dataclasses import dataclass
import shutil

logger = logging.getLogger(__name__)


@dataclass
class TrainingConfig:
    """Configuration for RVC training."""
    sample_rate: int = 40000  # 40k is good for 6GB VRAM
    total_epochs: int = 300   # Minimum for decent quality
    batch_size: int = 4       # Small batch for 6GB VRAM
    save_frequency: int = 50  # Save every 50 epochs
    cache_data: bool = False  # Don't cache in RAM (saves memory)
    f0_method: str = "rmvpe"  # Best pitch extraction method


@dataclass
class TrainingResult:
    """Result from RVC training."""
    model_path: Optional[Path] = None
    index_path: Optional[Path] = None
    success: bool = False
    error_message: Optional[str] = None


class RVCTrainer:
    """
    Trains RVC voice models using the RVC-WebUI training pipeline.
    
    This wraps the existing RVC-WebUI Python scripts rather than
    reimplementing the training logic from scratch.
    """
    
    def __init__(
        self,
        rvc_root: Path = Path("/app/rvc_webui"),
        device: str = "cuda"
    ):
        self.rvc_root = rvc_root
        self.device = device
        
        # Updated paths for new RVC structure
        self.preprocess_script = rvc_root / "infer/modules/train/preprocess.py"
        self.extract_f0_script = rvc_root / "infer/modules/train/extract/extract_f0_print.py"
        self.extract_feature_script = rvc_root / "infer/modules/train/extract_feature_print.py"
        self.train_script = rvc_root / "infer/modules/train/train.py"
        self.index_script = rvc_root / "tools/infer/train-index-v2.py"
        
        # Verify scripts exist
        for script in [self.preprocess_script, self.extract_f0_script, 
                       self.extract_feature_script, self.train_script, self.index_script]:
            if not script.exists():
                logger.warning(f"Script not found: {script}")
    
    def _prepare_dataset(
        self,
        samples: List[Path],
        model_name: str
    ) -> Path:
        """
        Copy voice samples to RVC dataset directory.
        
        RVC expects samples in: rvc_webui/datasets/{model_name}/
        """
        dataset_dir = self.rvc_root / "datasets" / model_name
        dataset_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Preparing dataset with {len(samples)} samples...")
        
        for i, sample_path in enumerate(samples):
            # Copy with sequential naming
            dest_name = f"sample_{i:03d}{sample_path.suffix}"
            dest_path = dataset_dir / dest_name
            shutil.copy2(sample_path, dest_path)
            logger.info(f"Copied: {sample_path.name} -> {dest_name}")
        
        return dataset_dir
    
    def _run_script(
        self,
        script_path: Path,
        args: List[str],
        description: str
    ) -> bool:
        """Run an RVC Python script with arguments."""
        if not script_path.exists():
            logger.error(f"Script not found: {script_path}")
            return False
        
        cmd = ["python", str(script_path)] + args
        logger.info(f"{description}: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(
                cmd,
                cwd=str(self.rvc_root),
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour timeout per step
            )
            
            if result.returncode != 0:
                logger.error(f"{description} failed:")
                logger.error(f"stdout: {result.stdout}")
                logger.error(f"stderr: {result.stderr}")
                return False
            
            logger.debug(f"{description} output: {result.stdout}")
            return True
            
        except subprocess.TimeoutExpired:
            logger.error(f"{description} timed out after 1 hour")
            return False
        except Exception as e:
            logger.error(f"{description} error: {e}")
            return False
    
    def train_model(
        self,
        samples: List[Path],
        output_path: Path,
        config: Optional[TrainingConfig] = None,
        progress_callback: Optional[Callable[[str, int], None]] = None
    ) -> TrainingResult:
        """
        Train an RVC voice model from audio samples.
        
        This follows the 5-stage RVC training pipeline:
        1. Preprocess audio (resample, slice)
        2. Extract F0 (pitch)
        3. Extract HuBERT features
        4. Train model
        5. Build feature index
        
        Args:
            samples: List of audio file paths (WAV recommended)
            output_path: Where to save the trained model
            config: Training configuration
            progress_callback: Optional callback(step_name, progress_percent)
            
        Returns:
            TrainingResult with model and index paths
        """
        if config is None:
            config = TrainingConfig()
        
        model_name = output_path.stem
        
        try:
            # Stage 1: Prepare dataset
            if progress_callback:
                progress_callback("Preparing training data", 0)
            
            dataset_dir = self._prepare_dataset(samples, model_name)
            
            # Stage 2: Preprocess audio
            if progress_callback:
                progress_callback("Preprocessing audio", 10)

                logs_dir = self.rvc_root / "logs" / model_name
                logs_dir.mkdir(parents=True, exist_ok=True)
            
            success = self._run_script(
                self.preprocess_script,
                 [
                    str(dataset_dir),
                    str(config.sample_rate),
                    "2",  # num_processes
                    str(self.rvc_root / "logs" / model_name),
                    "False",  # use_diff
                    "3.0"  # 
                ],
                "Audio preprocessing"
            )
            
            if not success:
                return TrainingResult(
                    success=False,
                    error_message="Audio preprocessing failed"
                )
            
            # Stage 3: Extract F0 (pitch)
            if progress_callback:
                progress_callback("Extracting pitch", 30)
            
            success = self._run_script(
                self.extract_f0_script,
                [
                    str(self.rvc_root / "logs" / model_name),
                    "2",  # num_processes
                    config.f0_method
                ],
                "F0 extraction"
            )
            
            if not success:
                return TrainingResult(
                    success=False,
                    error_message="F0 extraction failed"
                )
            
            # Stage 4: Extract HuBERT features
            if progress_callback:
                progress_callback("Extracting features", 50)
            
            success = self._run_script(
                self.extract_feature_script,
                [
                    self.device,
                    "1",  # n_parts
                    "0",  # i_part
                    "0",  # i_gpu
                    str(self.rvc_root / "logs" / model_name),
                    "True"  # use_diff
                ],
                "Feature extraction"
            )
            
            if not success:
                return TrainingResult(
                    success=False,
                    error_message="Feature extraction failed"
                )
            
            # Stage 5: Train model
            if progress_callback:
                progress_callback("Training model", 70)
            
            # Determine sample rate suffix
            sr_suffix = "48k" if config.sample_rate == 48000 else "40k"
            pretrained_g = self.rvc_root / f"assets/pretrained_v2/f0G{sr_suffix}.pth"
            pretrained_d = self.rvc_root / f"assets/pretrained_v2/f0D{sr_suffix}.pth"
            
            success = self._run_script(
                self.train_script,
                [
                    "-e", model_name,
                    "-sr", sr_suffix,
                    "-f0", "1",  # Use F0
                    "-bs", str(config.batch_size),
                    "-g", "0",  # GPU 0
                    "-te", str(config.total_epochs),
                    "-se", str(config.save_frequency),
                    "-pg", str(pretrained_g),
                    "-pd", str(pretrained_d),
                    "-l", "0",  # Don't only save latest
                    "-c", "1" if config.cache_data else "0"
                ],
                "Model training"
            )
            
            if not success:
                return TrainingResult(
                    success=False,
                    error_message="Model training failed"
                )
            
            # Stage 6: Build feature index
            if progress_callback:
                progress_callback("Building index", 90)
            
            success = self._run_script(
                self.index_script,
                [str(self.rvc_root / "logs" / model_name)],
                "Index building"
            )
            
            if not success:
                logger.warning("Index building failed, but model may still work")
            
            # Find the trained model
            weights_dir = self.rvc_root / "weights"
            model_path = weights_dir / f"{model_name}.pth"
            
            # Find the index file
            logs_dir = self.rvc_root / "logs" / model_name
            index_files = list(logs_dir.glob("added_*.index"))
            index_path = index_files[0] if index_files else None
            
            if not model_path.exists():
                return TrainingResult(
                    success=False,
                    error_message=f"Model file not found at {model_path}"
                )
            
            # Copy to output location
            shutil.copy2(model_path, output_path)
            
            if progress_callback:
                progress_callback("Training complete", 100)
            
            return TrainingResult(
                model_path=output_path,
                index_path=index_path,
                success=True
            )
            
        except Exception as e:
            logger.exception("Training failed with exception")
            return TrainingResult(
                success=False,
                error_message=f"Training exception: {str(e)}"
            )