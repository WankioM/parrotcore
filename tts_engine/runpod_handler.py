# ============================================
# File: tts_engine/runpod_handler.py
# Full RVC training handler for RunPod GPU
# ============================================
"""
RunPod serverless handler for RVC training.
This runs ON RunPod GPUs when training is triggered.
"""
import runpod
import torch
import os
import tempfile
import requests
from pathlib import Path
from typing import List, Dict
import traceback
import json


def download_file(url: str, destination: Path) -> None:
    """Download a file from presigned URL"""
    print(f"📥 Downloading {destination.name}...")
    response = requests.get(url, stream=True, timeout=300)
    response.raise_for_status()
    
    with open(destination, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    size_mb = destination.stat().st_size / 1024 / 1024
    print(f"✓ Downloaded {destination.name} ({size_mb:.1f} MB)")


def upload_to_presigned_url(file_path: Path, presigned_url: str) -> None:
    """Upload file to S3/MinIO via presigned PUT URL"""
    print(f"☁️  Uploading {file_path.name}...")
    
    with open(file_path, 'rb') as f:
        response = requests.put(
            presigned_url,
            data=f,
            headers={'Content-Type': 'application/octet-stream'},
            timeout=600
        )
        response.raise_for_status()
    
    size_mb = file_path.stat().st_size / 1024 / 1024
    print(f"✓ Uploaded {file_path.name} ({size_mb:.1f} MB)")


def train_rvc_model(job_input: Dict) -> Dict:
    """
    Train RVC model from audio samples.
    
    Input format:
    {
        "sample_urls": ["https://...", ...],  # Presigned GET URLs
        "upload_url": "https://...",          # Presigned PUT URL
        "epochs": 100,
        "batch_size": 32
    }
    """
    try:
        print("\n" + "="*60)
        print("🚀 Starting RVC Training on RunPod GPU")
        print("="*60)
        
        # Check GPU
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            print(f"✓ GPU: {gpu_name}")
            print(f"✓ VRAM: {gpu_memory:.1f} GB")
            device = "cuda"
        else:
            print("⚠️  Warning: No GPU detected, using CPU")
            device = "cpu"
        
        # Parse input
        sample_urls = job_input.get('sample_urls', [])
        upload_url = job_input.get('upload_url')
        epochs = job_input.get('epochs', 100)
        batch_size = job_input.get('batch_size', 32)
        
        if not sample_urls:
            raise ValueError("No sample URLs provided")
        if not upload_url:
            raise ValueError("No upload URL provided")
        
        print(f"\n📊 Training Configuration:")
        print(f"   Samples: {len(sample_urls)}")
        print(f"   Epochs: {epochs}")
        print(f"   Batch Size: {batch_size}")
        print(f"   Device: {device}")
        
        # Create temp directory
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            samples_dir = tmpdir / "samples"
            samples_dir.mkdir()
            
            # Download voice samples
            print(f"\n📥 Downloading {len(sample_urls)} voice samples...")
            sample_paths = []
            for i, url in enumerate(sample_urls, 1):
                sample_path = samples_dir / f"sample_{i}.wav"
                download_file(url, sample_path)
                sample_paths.append(sample_path)
            
            print(f"✓ All samples downloaded")
            
            # Import RVC (after samples are downloaded, to save cold start time)
            print("\n🎤 Initializing RVC...")
            try:
                import sys
                sys.path.insert(0, '/app')  # Add to path
                
                from rvc_trainer import RVCTrainer, TrainingConfig
                
                # Configure RVC training
                config = TrainingConfig(
                    sample_rate=40000,
                    total_epochs=epochs,
                    batch_size=batch_size,
                    save_frequency=50,
                    cache_data=False,
                    f0_method="rmvpe"
                )
                
                trainer = RVCTrainer(
                    rvc_root=Path("/app/rvc_webui"),
                    device=device
                )
                
                print("✅ RVC trainer initialized")
                
                # Progress callback
                def progress_callback(description: str, percent: int):
                    print(f"📊 Progress: {description} ({percent}%)")
                
                # Train the actual RVC model
                print(f"\n🔥 Training RVC model ({epochs} epochs)...")
                model_path = tmpdir / "rvc_model.pth"
                
                result = trainer.train_model(
                    samples=sample_paths,
                    output_path=model_path,
                    config=config,
                    progress_callback=progress_callback
                )
                
                if not result.success:
                    raise Exception(result.error_message or "RVC training failed")
                
                # Use the actual trained model path
                model_path = result.model_path
                
                print(f"✅ Training complete: {model_path}")
                
            except ImportError as e:
                raise RuntimeError(f"RVC dependencies not installed: {e}")
            except Exception as e:
                raise RuntimeError(f"RVC training failed: {e}")
            
            # Check model size
            model_size_mb = model_path.stat().st_size / 1024 / 1024
            print(f"\n✅ Training Complete!")
            print(f"   Model size: {model_size_mb:.2f} MB")
            
            # Upload model to storage
            print(f"\n☁️  Uploading model to storage...")
            upload_to_presigned_url(model_path, upload_url)
            
            print("\n" + "="*60)
            print("🎉 RVC Training Successful!")
            print("="*60 + "\n")
            
            return {
                "success": True,
                "model_size_mb": round(model_size_mb, 2),
                "samples_processed": len(sample_paths),
                "epochs": epochs,
                "batch_size": batch_size,
                "device": device,
                "gpu_name": gpu_name if device == "cuda" else "CPU",
                "message": "RVC model trained successfully"
            }
    
    except Exception as e:
        print(f"\n❌ Training Failed!")
        print(f"Error: {str(e)}")
        print(f"\nTraceback:")
        print(traceback.format_exc())
        
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


# RunPod serverless entry point
if __name__ == "__main__":
    print("="*60)
    print("RunPod RVC Training Handler")
    print("="*60)
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"CUDA device: {torch.cuda.get_device_name(0)}")
    print("="*60)
    
    runpod.serverless.start({"handler": train_rvc_model})


