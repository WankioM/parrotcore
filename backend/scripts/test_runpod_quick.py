"""Quick test of RunPod connection"""
import runpod
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)

# Get credentials from environment
RUNPOD_API_KEY = os.getenv('RUNPOD_API_KEY')
RUNPOD_ENDPOINT_ID = os.getenv('RUNPOD_ENDPOINT_ID')

def test_connection():
    print("🚀 Testing RunPod connection...")
    
    # Validate environment variables
    if not RUNPOD_API_KEY:
        print("❌ Error: RUNPOD_API_KEY not found in .env")
        print("   Add it to your .env file:")
        print("   RUNPOD_API_KEY=runpod_xxxxxxxxxxxxx")
        return False
    
    if not RUNPOD_ENDPOINT_ID:
        print("❌ Error: RUNPOD_ENDPOINT_ID not found in .env")
        print("   Add it to your .env file:")
        print("   RUNPOD_ENDPOINT_ID=3h90u2w2mxiw0h")
        return False
    
    print(f"   Endpoint: {RUNPOD_ENDPOINT_ID}")
    print(f"   API Key: {RUNPOD_API_KEY[:15]}..." if len(RUNPOD_API_KEY) > 15 else "   API Key: [too short]")
    
    runpod.api_key = RUNPOD_API_KEY
    endpoint = runpod.Endpoint(RUNPOD_ENDPOINT_ID)
    
    try:
        # Submit test job
        print("\n📤 Submitting test job...")
        result = endpoint.run({
            "test": "hello from parrot-core",
            "gpu_test": True
        })
        
        print(f"\n✅ Job submitted successfully!")
        print(f"   Job ID: {result.job_id}")
        print(f"   Initial Status: {result.status()}")
        
        # Wait for response (with timeout)
        print(f"\n⏳ Waiting for GPU response (cold start may take 30-60s)...")
        output = result.output(timeout=120)
        
        print(f"\n✅ Success! Response from RunPod:")
        print(f"   {output}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print(f"   Type: {type(e).__name__}")
        import traceback
        print("\nFull traceback:")
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("="*60)
    print("RunPod Connection Test")
    print("="*60)
    
    success = test_connection()
    
    print("\n" + "="*60)
    if success:
        print("✅ RunPod is working! Ready for RVC training.")
    else:
        print("❌ Connection failed. Check your .env configuration.")
    print("="*60)