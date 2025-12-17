import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { voicesService } from '@/lib/services/voices';

export default function NewVoice() {
  const router = useRouter();
  const [voiceName, setVoiceName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      // Create voice profile via API
      const profile = await voicesService.createVoiceProfile({
        name: voiceName,
        description: description || undefined,
      });

      // Navigate to the voice detail page
      router.push(`/voices/${profile.id}`);
    } catch (err: any) {
      console.error('Error creating voice profile:', err);
      setError(err.response?.data?.error || 'Failed to create voice profile. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="editorial-section">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-gray-600 hover:text-cayenne transition-colors mb-6 inline-block">
            ← Back
          </Link>
          
          <h1 className="text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
            Create Voice Profile
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Upload voice samples to create your unique AI voice clone
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Info */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📝 Voice Profile Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Voice Name */}
              <div>
                <label htmlFor="voiceName" className="block text-gray-700 font-semibold mb-2">
                  Voice Name *
                </label>
                <input
                  type="text"
                  id="voiceName"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="e.g., My Professional Voice"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                           focus:border-cayenne focus:outline-none transition-colors
                           text-gray-900"
                  required
                  disabled={isCreating}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this voice profile..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                           focus:border-cayenne focus:outline-none transition-colors
                           text-gray-900 resize-none"
                  disabled={isCreating}
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-4 bg-cayenne text-white font-bold text-lg rounded-lg
                         hover:bg-cayenne transition-all shadow-lg disabled:opacity-50
                         disabled:cursor-not-allowed flex items-center justify-center gap-3"
                style={{ opacity: isCreating ? 0.5 : 0.95 }}
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                    Creating Profile...
                  </>
                ) : (
                  'Create Profile & Upload Samples'
                )}
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              💡 Tips for Best Results
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-cayenne mt-1">•</span>
                <span>Upload at least 3-5 voice samples for better quality</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cayenne mt-1">•</span>
                <span>Each sample should be 10-30 seconds long</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cayenne mt-1">•</span>
                <span>Use clear audio with minimal background noise</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cayenne mt-1">•</span>
                <span>Supported formats: WAV, MP3, FLAC (Max 50MB per file)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}