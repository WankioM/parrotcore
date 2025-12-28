import runpod

def handler(job):
    print(f"Job received on RunPod GPU: {job}")
    return {
        'success': True,
        'message': 'Hello from your custom Docker image!'
    }

if __name__ == "__main__":
    print("Starting handler...")
    runpod.serverless.start({"handler": handler})