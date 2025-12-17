import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { voicesService, ttsService } from '@/lib/services';
import { VoiceProfile } from '@/lib/types/api';

export default function NewTTS() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile | null>(null);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Real voice profiles from API
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  const steps = [
    { number: 1, title: 'Choose your voice', description: 'Select from your voice profiles' },
    { number: 2, title: 'Enter your text', description: 'Type or paste the text you want to convert' },
    { number: 3, title: 'Generate speech', description: 'Create your audio file' },
  ];

  // Load voice profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setIsLoadingProfiles(true);
        const profiles = await voicesService.getVoiceProfiles();
        // Only show ready profiles for TTS
        setVoiceProfiles(profiles.filter(p => p.status === 'ready'));
      } catch (err: any) {
        console.error('Failed to load voice profiles:', err);
        setError('Failed to load voice profiles. Please try again.');
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    loadProfiles();
  }, []);

  const handleGenerate = async () => {
    if (!selectedVoice) return;

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    try {
      // Create TTS job
      console.log('🎤 Creating TTS job...');
      const job = await ttsService.createTTSJob({
        voice_profile_id: selectedVoice.id,
        input_text: inputText,
      });

      console.log('✅ TTS job created:', job.id);

      // Poll until complete
      const completedJob = await ttsService.pollJobStatus(job.id, (progressJob) => {
        console.log(`⏳ Progress: ${progressJob.progress_percent}%`);
        setGenerationProgress(progressJob.progress_percent);
      });

      console.log('🎵 TTS generation complete!');
      
      // Redirect to result page
      router.push(`/tts/${completedJob.id}`);
    } catch (err: any) {
      console.error('❌ TTS generation failed:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to generate speech. Please try again.'
      );
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-coffee via-twilight/20 to-coffee py-12">
      <div className="editorial-section">
        {/* Hero Section */}
        <div className="mb-16">
          <Link href="/" className="text-white/60 hover:text-white transition-colors mb-6 inline-block">
            ← Back
          </Link>
          
          <h1 className="text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
            Bring your stories to life.<br/>
            Just <span className="italic text-cayenne">add sound.</span>
          </h1>
          
          <p className="text-xl text-white/70 max-w-2xl mb-8 leading-relaxed">
            Transform any text into natural-sounding speech using your cloned voice. 
            Perfect for audiobooks, podcasts, videos, and more.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-500/10 border-l-4 border-red-500 p-4 rounded-lg max-w-4xl mx-auto">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-12 bg-twilight/30 rounded-2xl p-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all
                      ${currentStep >= step.number 
                        ? 'bg-cayenne text-white' 
                        : 'bg-white/10 text-white/40'
                      }`}
                  >
                    {step.number}
                  </div>
                  <div className={currentStep >= step.number ? 'opacity-100' : 'opacity-40'}>
                    <div className="font-semibold text-white">{step.title}</div>
                    <div className="text-sm text-white/60">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`flex-1 h-0.5 mx-6 transition-all
                      ${currentStep > step.number ? 'bg-cayenne' : 'bg-white/10'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Choose Voice */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-white mb-6">Choose your voice</h2>
              
              {isLoadingProfiles ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-cayenne rounded-full" />
                </div>
              ) : voiceProfiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60 mb-6">You don't have any ready voice profiles yet.</p>
                  <Link
                    href="/voices/new"
                    className="inline-block px-8 py-4 bg-cayenne text-white font-bold rounded-lg
                             hover:bg-cayenne/90 transition-all shadow-lg shadow-cayenne/30"
                  >
                    Create Your First Voice Profile
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {voiceProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => setSelectedVoice(profile)}
                        className={`p-6 rounded-xl border-2 text-left transition-all
                          ${selectedVoice?.id === profile.id
                            ? 'bg-cayenne/20 border-cayenne'
                            : 'bg-twilight/50 border-white/10 hover:border-cayenne/50'
                          }
                        `}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-5xl">🎤</div>
                          <div>
                            <h3 className="font-bold text-xl text-white">{profile.name}</h3>
                            <span className="text-sm text-green-400">
                              ✓ Ready • {profile.sample_count} samples
                            </span>
                          </div>
                        </div>
                        {profile.description && (
                          <p className="text-sm text-white/60">{profile.description}</p>
                        )}
                      </button>
                    ))}

                    {/* Create New Voice */}
                    <Link
                      href="/voices/new"
                      className="p-6 rounded-xl border-2 border-dashed border-white/20 
                               hover:border-cayenne/50 transition-all flex items-center justify-center
                               bg-twilight/30 group"
                    >
                      <div className="text-center">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">➕</div>
                        <div className="font-semibold text-white">Create New Voice</div>
                        <div className="text-sm text-white/60">Upload voice samples</div>
                      </div>
                    </Link>
                  </div>

                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedVoice}
                    className="px-8 py-4 bg-cayenne text-white font-bold rounded-lg
                             hover:bg-cayenne/90 transition-all disabled:opacity-50 
                             disabled:cursor-not-allowed shadow-lg shadow-cayenne/30"
                  >
                    Continue →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 2: Enter Text */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-white mb-6">Enter your text</h2>
              
              <div className="bg-twilight/50 rounded-xl p-8 border-2 border-white/10 mb-6">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type or paste your text here. The AI will speak it in your chosen voice..."
                  className="w-full h-64 bg-transparent text-white text-lg resize-none
                           focus:outline-none placeholder-white/40"
                  maxLength={5000}
                />
                <div className="flex justify-between items-center mt-4 text-sm text-white/60">
                  <span>Using: {selectedVoice?.name} 🎤</span>
                  <span>{inputText.length} / 5000 characters</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-lg
                           hover:border-white/40 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={inputText.length < 10}
                  className="px-8 py-4 bg-cayenne text-white font-bold rounded-lg
                           hover:bg-cayenne/90 transition-all disabled:opacity-50 
                           disabled:cursor-not-allowed shadow-lg shadow-cayenne/30"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generate */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-white mb-6">Generate speech</h2>
              
              <div className="bg-twilight/50 rounded-xl p-8 border-2 border-white/10 mb-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-white mb-4">Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Voice:</span>
                      <span className="text-white font-medium">
                        🎤 {selectedVoice?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Text length:</span>
                      <span className="text-white font-medium">{inputText.length} characters</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Estimated duration:</span>
                      <span className="text-white font-medium">~{Math.ceil(inputText.length / 15)}s</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="bg-coffee/50 rounded-lg p-4 max-h-32 overflow-y-auto">
                    <p className="text-white/80 text-sm">{inputText}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {isGenerating && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Generating speech...</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-cayenne h-full transition-all duration-500"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={isGenerating}
                  className="px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-lg
                           hover:border-white/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 px-8 py-4 bg-cayenne text-white font-bold rounded-lg
                           hover:bg-cayenne/90 transition-all disabled:opacity-50 
                           shadow-lg shadow-cayenne/30 flex items-center justify-center gap-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>🎵</span>
                      Generate Speech
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}