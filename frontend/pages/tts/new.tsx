// pages/tts/new.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
import { voicesService } from '@/lib/services/voices';
import { ttsService } from '@/lib/services/tts';
import { VoiceProfile } from '@/lib/types/api';
import { 
  canUseTTS, 
  getStatusBadgeStyles, 
  getStatusEmoji, 
  getStatusLabel 
} from '@/lib/utils/voiceHelpers';

export default function NewTTS() {
  const router = useRouter();
  
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load voice profiles
  useEffect(() => {
    const loadVoices = async () => {
      try {
        setIsLoading(true);
        const allVoices = await voicesService.getVoiceProfiles();
        setVoices(allVoices);
        
        // Auto-select first ready voice
        const readyVoice = allVoices.find(v => canUseTTS(v));
        if (readyVoice) {
          setSelectedVoiceId(readyVoice.id);
        }
      } catch (err: any) {
        console.error('Failed to load voices:', err);
        setError('Failed to load voice profiles');
      } finally {
        setIsLoading(false);
      }
    };

    loadVoices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVoiceId) {
      setError('Please select a voice profile');
      return;
    }
    
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    // Check if selected voice has speaking ready
    const selectedVoice = voices.find(v => v.id === selectedVoiceId);
    if (selectedVoice && !canUseTTS(selectedVoice)) {
      setError('Selected voice is not ready for text-to-speech');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      console.log('🎤 Creating TTS job...');
      const job = await ttsService.createTTSJob({
        voice_profile_id: selectedVoiceId,
        text: text.trim(),
      });
      
      console.log('✅ TTS job created:', job.id);
      router.push(`/tts/${job.id}`);
    } catch (err: any) {
      console.error('Failed to create TTS job:', err);
      setError(err.response?.data?.detail || 'Failed to create TTS job');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={flex({ 
        minH: 'screen',
        alignItems: 'center',
        justifyContent: 'center'
      })}>
        <div className={css({ 
          animation: 'spin',
          w: 12,
          h: 12,
          border: '4px solid',
          borderColor: 'gray.200',
          borderTopColor: 'cayenne',
          rounded: 'full'
        })} />
      </div>
    );
  }

  const readyVoices = voices.filter(canUseTTS);
  const notReadyVoices = voices.filter(v => !canUseTTS(v));

  if (readyVoices.length === 0) {
    return (
      <div className={css({ minH: 'screen', bg: 'white', py: 12 })}>
        <div className={css({ 
          maxW: '4xl',
          mx: 'auto',
          px: { base: 4, lg: 6 }
        })}>
          <Link href="/" className={css({ 
            display: 'inline-block',
            color: 'gray.600',
            mb: 8,
            fontSize: 'sm',
            _hover: { color: 'cayenne' },
            transition: 'colors'
          })}>
            ← Back to Home
          </Link>

          <div className={css({ 
            bg: 'yellow.50',
            border: '2px solid',
            borderColor: 'yellow.300',
            rounded: 'xl',
            p: 8,
            textAlign: 'center'
          })}>
            <div className={css({ fontSize: '5xl', mb: 4 })}>🎤</div>
            <h2 className={css({ 
              fontSize: '2xl',
              fontWeight: 'bold',
              color: 'yellow.900',
              mb: 4
            })}>
              No Speaking Voices Ready
            </h2>
            <p className={css({ color: 'yellow.800', mb: 6 })}>
              You need to create and train a speaking voice before you can use text-to-speech.
            </p>
           <Link 
            href="/voices/new"
            className={css({ 
              display: 'inline-block',
              px: 6,
              py: 3,
              bg: 'cayenne',
              color: 'white',
              fontWeight: 'semibold',
              rounded: 'lg',
              _hover: { opacity: 0.9 },
              transition: 'all'
            })}
          >
            Create Voice Profile →
          </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={css({ minH: 'screen', bg: 'white', py: 12 })}>
      <div className={css({ 
        maxW: '4xl',
        mx: 'auto',
        px: { base: 4, lg: 6 }
      })}>
        {/* Back Link */}
        <Link href="/" className={css({ 
          display: 'inline-block',
          color: 'gray.600',
          mb: 8,
          fontSize: 'sm',
          _hover: { color: 'cayenne' },
          transition: 'colors'
        })}>
          ← Back to Home
        </Link>

        {/* Header */}
        <div className={css({ mb: 8 })}>
          <h1 className={css({ 
            fontSize: { base: '4xl', lg: '5xl' },
            fontWeight: 'extrabold',
            color: 'gray.900',
            mb: 3
          })}>
            🎤 Text-to-Speech
          </h1>
          <p className={css({ 
            fontSize: 'lg',
            color: 'gray.600'
          })}>
            Convert text to speech using your trained speaking voice
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className={css({ 
            bg: 'red.50',
            borderLeft: '4px solid',
            borderColor: 'red.500',
            p: 4,
            mb: 8,
            rounded: 'md'
          })}>
            <p className={css({ 
              color: 'red.800', 
              fontSize: 'sm', 
              fontWeight: 'medium' 
            })}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className={css({ 
            bg: 'white',
            border: '2px solid',
            borderColor: 'gray.200',
            rounded: 'xl',
            p: 8,
            mb: 8
          })}>
            {/* Voice Selection */}
            <div className={css({ mb: 8 })}>
              <label className={css({ 
                display: 'block',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: 3,
                fontSize: 'lg'
              })}>
                Select Speaking Voice
              </label>

              {/* Ready Voices */}
              <div className={css({ display: 'flex', flexDir: 'column', gap: 3, mb: 4 })}>
                {readyVoices.map((voice) => (
                  <label
                    key={voice.id}
                    className={css({
                      display: 'block',
                      p: 4,
                      border: '2px solid',
                      borderColor: selectedVoiceId === voice.id ? 'cayenne' : 'gray.200',
                      rounded: 'lg',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      _hover: { borderColor: 'cayenne', bg: 'gray.50' },
                    })}
                  >
                    <div className={flex({ alignItems: 'center', gap: 3 })}>
                      <input
                        type="radio"
                        name="voice"
                        value={voice.id}
                        checked={selectedVoiceId === voice.id}
                        onChange={(e) => setSelectedVoiceId(e.target.value)}
                        className={css({ w: 4, h: 4 })}
                      />
                      <div className={flex({ flex: 1, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 })}>
                        <div>
                          <p className={css({ fontWeight: 'semibold' })}>{voice.name}</p>
                          {voice.description && (
                            <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                              {voice.description}
                            </p>
                          )}
                          <p className={css({ fontSize: 'xs', color: 'gray.500', mt: 1 })}>
                            {voice.speaking_sample_count} speaking samples
                          </p>
                        </div>
                        <span className={css(getStatusBadgeStyles(voice.speaking_status))}>
                          {getStatusEmoji(voice.speaking_status)} {getStatusLabel(voice.speaking_status)}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Not Ready Voices - Collapsible */}
              {notReadyVoices.length > 0 && (
                <details className={css({ mt: 4 })}>
                  <summary className={css({ 
                    fontSize: 'sm', 
                    color: 'gray.600', 
                    cursor: 'pointer', 
                    _hover: { color: 'gray.900' } 
                  })}>
                    Show voices not ready for TTS ({notReadyVoices.length})
                  </summary>
                  <div className={css({ display: 'flex', flexDir: 'column', gap: 3, mt: 3 })}>
                    {notReadyVoices.map((voice) => (
                      <div
                        key={voice.id}
                        className={css({ 
                          p: 4, 
                          border: '2px solid', 
                          borderColor: 'gray.200', 
                          rounded: 'lg', 
                          opacity: 0.6 
                        })}
                      >
                        <div className={flex({ justifyContent: 'space-between', alignItems: 'center', mb: 2 })}>
                          <div>
                            <p className={css({ fontWeight: 'semibold' })}>{voice.name}</p>
                            <p className={css({ fontSize: 'xs', color: 'gray.500', mt: 1 })}>
                              {voice.speaking_sample_count} speaking samples
                            </p>
                          </div>
                          <span className={css(getStatusBadgeStyles(voice.speaking_status))}>
                            {getStatusEmoji(voice.speaking_status)} {getStatusLabel(voice.speaking_status)}
                          </span>
                        </div>
                        <Link 
                            href={`/voices/${voice.id}`}
                            className={css({ 
                              fontSize: 'sm', 
                              color: 'cayenne', 
                              fontWeight: 'medium', 
                              _hover: { textDecoration: 'underline' } 
                            })}
                          >
                            Complete speaking enrollment →
                          </Link>
                                                </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Text Input */}
            <div className={css({ mb: 8 })}>
              <label 
                htmlFor="text-input"
                className={css({ 
                  display: 'block',
                  fontWeight: 'bold',
                  color: 'gray.900',
                  mb: 3,
                  fontSize: 'lg'
                })}
              >
                Text to Speak
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                disabled={isSubmitting}
                rows={8}
                className={css({ 
                  w: 'full',
                  px: 4,
                  py: 3,
                  border: '2px solid',
                  borderColor: 'gray.300',
                  rounded: 'lg',
                  fontSize: 'base',
                  resize: 'vertical',
                  _focus: { 
                    outline: 'none',
                    borderColor: 'cayenne'
                  },
                  _disabled: { 
                    bg: 'gray.100',
                    cursor: 'not-allowed'
                  }
                })}
              />
              <p className={css({ 
                fontSize: 'sm',
                color: 'gray.500',
                mt: 2
              })}>
                {text.length} characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className={css({ 
                w: 'full',
                px: 6,
                py: 4,
                bg: 'cayenne',
                color: 'white',
                fontWeight: 'bold',
                rounded: 'lg',
                fontSize: 'lg',
                _hover: { opacity: 0.9 },
                _disabled: { 
                  opacity: 0.5,
                  cursor: 'not-allowed'
                },
                transition: 'all',
                shadow: 'lg'
              })}
            >
              {isSubmitting ? 'Creating...' : 'Generate Speech'}
            </button>
          </div>
        </form>

        {/* Info Card */}
        <div className={css({ 
          bg: 'blue.50',
          border: '2px solid',
          borderColor: 'blue.200',
          rounded: 'xl',
          p: 6
        })}>
          <h3 className={css({ 
            fontWeight: 'bold',
            color: 'blue.900',
            mb: 2,
            fontSize: 'base'
          })}>
            💡 Tips for Best Results
          </h3>
          <ul className={css({ 
            color: 'blue.800',
            fontSize: 'sm',
            pl: 5,
            spaceY: 2
          })}>
            <li>Use clear, natural sentences</li>
            <li>Add punctuation for better pacing</li>
            <li>Processing typically takes 10-30 seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}