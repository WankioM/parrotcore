import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { VoiceProfileStatus } from '@/lib/types/api';

export default function VoiceDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Mock data - will be replaced with API
  const mockVoice = {
    id: id as string,
    name: 'My Voice',
    status: 'pending' as VoiceProfileStatus, // <-- Fix here
    sample_count: 0,
    samples: [],
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    // TODO: API integration with voicesService.uploadVoiceSample
    
    // Simulate upload
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }
    
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleEnroll = async () => {
    // TODO: API integration with voicesService.enrollVoice
    console.log('Starting enrollment for voice:', id);
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="editorial-section">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-gray-600 hover:text-cayenne transition-colors mb-6 inline-block">
            ← Back to Home
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-extrabold text-gray-900 mb-2">
                {mockVoice.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  mockVoice.status === 'ready' ? 'bg-green-100 text-green-800' :
                  mockVoice.status === 'enrolling' ? 'bg-yellow-100 text-yellow-800' :
                  mockVoice.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {mockVoice.status === 'ready' ? '✓ Ready' :
                   mockVoice.status === 'enrolling' ? '⏳ Training' :
                   mockVoice.status === 'failed' ? '✗ Failed' :
                   '📝 Pending'}
                </span>
                <span className="text-gray-600">
                  {mockVoice.sample_count} samples uploaded
                </span>
              </div>
            </div>

            {mockVoice.sample_count >= 3 && mockVoice.status === 'pending' && (
              <button
                onClick={handleEnroll}
                className="px-6 py-3 bg-cayenne text-white font-bold rounded-lg
                         hover:bg-cayenne transition-all shadow-lg"
                style={{ opacity: 0.95 }}
              >
                Start Training
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🎤 Upload Voice Samples
            </h2>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6
                          hover:border-cayenne transition-colors cursor-pointer">
              <input
                type="file"
                accept="audio/wav,audio/mp3,audio/mpeg,audio/flac"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-5xl mb-4">📁</div>
                <p className="font-semibold text-gray-900 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-600">
                  WAV, MP3, or FLAC (max 50MB per file)
                </p>
              </label>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-cayenne h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Record Audio Option */}
            <button
              className="w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg
                       hover:border-cayenne hover:text-cayenne transition-all"
              disabled={isUploading}
            >
              🎙️ Record Audio
            </button>
          </div>

          {/* Samples List */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📋 Uploaded Samples
            </h2>

            {mockVoice.samples.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🎵</div>
                <p className="text-gray-600">No samples uploaded yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Upload at least 3 samples to start training
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Sample items will go here */}
              </div>
            )}
          </div>
        </div>

        {/* Requirements Card */}
        {mockVoice.sample_count < 3 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
              ⚠️ Action Required
            </h3>
            <p className="text-yellow-800">
              You need at least {3 - mockVoice.sample_count} more voice sample(s) before you can start training.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}