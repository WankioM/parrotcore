#!/usr/bin/env python3
"""
Test script for RVC training integration.

Usage:
    python scripts/test_rvc_training.py

This script:
1. Checks that RVC-WebUI is properly installed
2. Checks that pretrained models are available
3. Tests the RVC trainer with dummy audio
"""
import sys
from pathlib import Path

def check_rvc_installation():
    """Check if RVC-WebUI is properly installed."""
    print("=" * 60)
    print("Checking RVC-WebUI installation...")
    print("=" * 60)
    
    rvc_root = Path("/app/rvc_webui")
    
    # Check directory exists
    if not rvc_root.exists():
        print(f"❌ RVC-WebUI not found at {rvc_root}")
        return False
    
    print(f"✅ RVC-WebUI directory exists: {rvc_root}")
    
    # Check training scripts exist
    scripts = [
        "trainset_preprocess_pipeline_print.py",
        "extract_f0_print.py",
        "extract_feature_print.py",
        "train_nsf_sim_cache_sid_load_pretrain.py",
        "train_index.py",
    ]
    
    missing_scripts = []
    for script in scripts:
        script_path = rvc_root / script
        if not script_path.exists():
            print(f"❌ Missing script: {script}")
            missing_scripts.append(script)
        else:
            print(f"✅ Found script: {script}")
    
    if missing_scripts:
        print(f"\n⚠️  Missing {len(missing_scripts)} script(s)")
        return False
    
    return True


def check_pretrained_models():
    """Check if pretrained models are downloaded."""
    print("\n" + "=" * 60)
    print("Checking pretrained models...")
    print("=" * 60)
    
    assets_dir = Path("/app/assets")
    
    # Check pretrained v2 models
    pretrained_dir = assets_dir / "pretrained_v2"
    required_models = [
        "f0D40k.pth",
        "f0G40k.pth",
        "f0D48k.pth",
        "f0G48k.pth",
    ]
    
    all_found = True
    for model in required_models:
        model_path = pretrained_dir / model
        if not model_path.exists():
            print(f"❌ Missing pretrained model: {model}")
            all_found = False
        else:
            size_mb = model_path.stat().st_size / (1024 * 1024)
            print(f"✅ Found pretrained model: {model} ({size_mb:.1f} MB)")
    
    # Check HuBERT model
    hubert_model = assets_dir / "hubert" / "hubert_base.pt"
    if not hubert_model.exists():
        print(f"❌ Missing HuBERT model: {hubert_model}")
        all_found = False
    else:
        size_mb = hubert_model.stat().st_size / (1024 * 1024)
        print(f"✅ Found HuBERT model ({size_mb:.1f} MB)")
    
    return all_found


def test_rvc_trainer():
    """Test the RVC trainer with a simple example."""
    print("\n" + "=" * 60)
    print("Testing RVC Trainer...")
    print("=" * 60)
    
    try:
        from tts_engine.models.rvc_trainer import RVCTrainer, TrainingConfig
        print("✅ RVCTrainer imported successfully")
        
        # Create trainer instance
        config = TrainingConfig(
            total_epochs=10,  # Just test, don't actually train
            batch_size=2,
        )
        
        trainer = RVCTrainer(
            model_name="test_voice",
            config=config
        )
        
        print(f"✅ RVCTrainer initialized")
        print(f"   RVC root: {trainer.rvc_root}")
        print(f"   Assets dir: {trainer.assets_dir}")
        print(f"   Logs dir: {trainer.logs_dir}")
        print(f"   Dataset dir: {trainer.dataset_dir}")
        
        # Check directories were created
        if trainer.logs_dir.exists():
            print(f"✅ Logs directory created: {trainer.logs_dir}")
        else:
            print(f"❌ Logs directory not created")
            return False
        
        if trainer.dataset_dir.exists():
            print(f"✅ Dataset directory created: {trainer.dataset_dir}")
        else:
            print(f"❌ Dataset directory not created")
            return False
        
        print("\n✅ RVC Trainer test passed!")
        print("\nNote: We didn't actually train a model (that takes hours).")
        print("But all the setup and infrastructure is ready.")
        
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import RVCTrainer: {e}")
        print("\nPossible issues:")
        print("1. rvc_trainer.py not created yet")
        print("2. File has syntax errors")
        print("3. PYTHONPATH not set correctly")
        return False
    except Exception as e:
        print(f"❌ RVC Trainer test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tasks_import():
    """Test if the tasks can be imported."""
    print("\n" + "=" * 60)
    print("Testing Celery Tasks Import...")
    print("=" * 60)
    
    try:
        from apps.voices.tasks import run_speaking_enrollment, run_singing_enrollment
        print("✅ run_speaking_enrollment imported successfully")
        print("✅ run_singing_enrollment imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import tasks: {e}")
        print("\nPossible issues:")
        print("1. Django not set up correctly")
        print("2. tasks.py has syntax errors")
        return False
    except Exception as e:
        print(f"❌ Task import test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_django_setup():
    """Test Django setup."""
    print("\n" + "=" * 60)
    print("Testing Django Setup...")
    print("=" * 60)
    
    try:
        import django
        django.setup()
        print("✅ Django setup successful")
        
        from django.conf import settings
        print(f"✅ Database: {settings.DATABASES['default']['ENGINE']}")
        print(f"✅ Storage backend: {getattr(settings, 'STORAGE_BACKEND', 'minio')}")
        
        return True
    except Exception as e:
        print(f"❌ Django setup failed: {e}")
        return False


def main():
    """Run all tests."""
    print("\n🔍 Testing RVC Training Integration\n")
    
    # Set up Django
    import os
    import django
    
    # Add backend to path
    sys.path.insert(0, '/app/backend')
    sys.path.insert(0, '/app/tts_engine')
    
    # Setup Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parrotcore.settings')
    
    try:
        django.setup()
    except Exception as e:
        print(f"⚠️  Django setup warning: {e}")
    
    results = []
    
    # Test 1: RVC Installation
    results.append(("RVC Installation", check_rvc_installation()))
    
    # Test 2: Pretrained models
    results.append(("Pretrained Models", check_pretrained_models()))
    
    # Test 3: RVC Trainer
    results.append(("RVC Trainer", test_rvc_trainer()))
    
    # Test 4: Django setup
    results.append(("Django Setup", test_django_setup()))
    
    # Test 5: Tasks import
    results.append(("Celery Tasks", test_tasks_import()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    all_passed = all(passed for _, passed in results)
    
    if all_passed:
        print("\n🎉 All tests passed! RVC training is ready.")
        print("\nNext steps:")
        print("1. Upload singing samples to a voice profile")
        print("2. Call enroll_singing_voice(profile)")
        print("3. Wait 2-4 hours for training to complete")
        print("4. Use the trained model for cover generation")
        print("\nExample:")
        print("  python manage.py shell")
        print("  >>> from apps.voices.models import VoiceProfile")
        print("  >>> from apps.voices.services import enroll_singing_voice")
        print("  >>> profile = VoiceProfile.objects.first()")
        print("  >>> job = enroll_singing_voice(profile)")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        print("\nCommon fixes:")
        print("1. Missing models? Rebuild worker container:")
        print("   docker compose build worker --no-cache")
        print("")
        print("2. Import errors? Check file exists:")
        print("   ls -la /app/tts_engine/models/rvc_trainer.py")
        print("")
        print("3. Django errors? Check database connection:")
        print("   docker compose exec postgres pg_isready")
        return 1


if __name__ == "__main__":
    sys.exit(main())