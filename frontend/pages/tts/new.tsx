import React, { useState } from 'react';
import Link from 'next/link';

interface VoiceProfile {
  id: string;
  name: string;
  emoji: string;
  status: 'ready' | 'training' | 'pending';
}

export default function NewTTS() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile | null>(null);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock voice profiles
  const voiceProfiles: VoiceProfile[] = [
    { id: '1', name: 'My Voice', emoji: '🎤', status: 'ready' },
    { id: '2', name: 'Professional Voice', emoji: '💼', status: 'ready' },
    { id: '3', name: 'Casual Voice', emoji: '😊', status: 'training' },
  ];

  const steps = [
    { number: 1, title: 'Choose your voice', description: 'Select from your voice profiles' },
    { number: 2, title: 'Enter your text', description: 'Type or paste the text you want to convert' },
    { number: 3, title: 'Generate speech', description: 'Create your audio file' },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    // TODO: API call to generate TTS
    setTimeout(() => {
      setIsGenerating(false);
      // Navigate to result page
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-coffee via-twilight/20 to-coffee py-12">
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
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {voiceProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      if (profile.status === 'ready') {
                        setSelectedVoice(profile);
                      }
                    }}
                    disabled={profile.status !== 'ready'}
                    className={`p-6 rounded-xl border-2 text-left transition-all
                      ${selectedVoice?.id === profile.id
                        ? 'bg-cayenne/20 border-cayenne'
                        : 'bg-twilight/50 border-white/10 hover:border-cayenne/50'
                      }
                      ${profile.status !== 'ready' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-5xl">{profile.emoji}</div>
                      <div>
                        <h3 className="font-bold text-xl text-white">{profile.name}</h3>
                        <span className={`text-sm ${
                          profile.status === 'ready' ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {profile.status === 'ready' ? '✓ Ready' : '⏳ Training'}
                        </span>
                      </div>
                    </div>
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
                  <span>Using: {selectedVoice?.name} {selectedVoice?.emoji}</span>
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
                        {selectedVoice?.emoji} {selectedVoice?.name}
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
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={isGenerating}
                  className="px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-lg
                           hover:border-white/40 transition-all disabled:opacity-50"
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