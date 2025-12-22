import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
import { voicesService } from '@/lib/services/voices';
import { coversService } from '@/lib/services/covers';
import { VoiceProfile } from '@/lib/types/api';

export default function NewCover() {
  const router = useRouter();
  
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [songFile, setSongFile] = useState<File | null>(null);
  const [pitchShift, setPitchShift] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load ready voice profiles
  useEffect(() => {
    const loadVoices = async () => {
      try {
        setIsLoading(true);
        const allVoices = await voicesService.getVoiceProfiles();
        const readyVoices = allVoices.filter(v => v.status === 'ready');
        setVoices(readyVoices);
        
        // Auto-select first voice if available
        if (readyVoices.length > 0) {
          setSelectedVoiceId(readyVoices[0].id);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSongFile(files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVoiceId) {
      setError('Please select a voice profile');
      return;
    }
    
    if (!songFile) {
      setError('Please upload a song file');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      console.log('🎵 Creating cover job...');
      const job = await coversService.createCoverJob(
        {
          voice_profile_id: selectedVoiceId,
          pitch_shift: pitchShift,
        },
        songFile,
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );
      
      console.log('✅ Cover job created:', job.id);
      
      // Redirect to job status page
      router.push(`/covers/${job.id}`);
    } catch (err: any) {
      console.error('Failed to create cover job:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create cover job');
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

  if (voices.length === 0) {
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
              No Voice Profiles Ready
            </h2>
            <p className={css({ color: 'yellow.800', mb: 6 })}>
              You need to create and train a voice profile before you can create AI covers.
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
            🎵 Create AI Cover
          </h1>
          <p className={css({ 
            fontSize: 'lg',
            color: 'gray.600'
          })}>
            Upload a song and convert the vocals to your trained voice
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
            <p className={css({ color: 'red.800', fontSize: 'sm', fontWeight: 'medium' })}>
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
              <label 
                htmlFor="voice-select"
                className={css({ 
                  display: 'block',
                  fontWeight: 'bold',
                  color: 'gray.900',
                  mb: 3,
                  fontSize: 'lg'
                })}
              >
                Select Voice
              </label>
              <select
                id="voice-select"
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                disabled={isSubmitting}
                className={css({ 
                  w: 'full',
                  px: 4,
                  py: 3,
                  border: '2px solid',
                  borderColor: 'gray.300',
                  rounded: 'lg',
                  fontSize: 'base',
                  _focus: { 
                    outline: 'none',
                    borderColor: 'cayenne'
                  },
                  _disabled: { 
                    bg: 'gray.100',
                    cursor: 'not-allowed'
                  }
                })}
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Song File Upload */}
            <div className={css({ mb: 8 })}>
              <label 
                htmlFor="song-upload"
                className={css({ 
                  display: 'block',
                  fontWeight: 'bold',
                  color: 'gray.900',
                  mb: 3,
                  fontSize: 'lg'
                })}
              >
                Upload Song
              </label>
              
              <div className={css({ 
                border: '2px dashed',
                borderColor: songFile ? 'green.300' : 'gray.300',
                rounded: 'xl',
                p: 8,
                textAlign: 'center',
                cursor: 'pointer',
                bg: songFile ? 'green.50' : 'white',
                _hover: { borderColor: 'cayenne' },
                transition: 'colors'
              })}>
                <input
                  type="file"
                  id="song-upload"
                  accept="audio/wav,audio/mp3,audio/mpeg,audio/flac"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className={css({ display: 'none' })}
                />
                <label htmlFor="song-upload" className={css({ cursor: 'pointer' })}>
                  {songFile ? (
                    <>
                      <div className={css({ fontSize: '4xl', mb: 3 })}>✅</div>
                      <p className={css({ fontWeight: 'semibold', color: 'green.900', mb: 1 })}>
                        {songFile.name}
                      </p>
                      <p className={css({ fontSize: 'sm', color: 'green.700' })}>
                        {(songFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <div className={css({ fontSize: '5xl', mb: 4 })}>🎵</div>
                      <p className={css({ fontWeight: 'semibold', color: 'gray.900', mb: 2 })}>
                        Click to upload song
                      </p>
                      <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                        WAV, MP3, or FLAC (max 100MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Pitch Shift Slider */}
            <div className={css({ mb: 8 })}>
              <label 
                htmlFor="pitch-shift"
                className={css({ 
                  display: 'block',
                  fontWeight: 'bold',
                  color: 'gray.900',
                  mb: 3,
                  fontSize: 'lg'
                })}
              >
                Pitch Shift: {pitchShift > 0 ? '+' : ''}{pitchShift} semitones
              </label>
              <input
                type="range"
                id="pitch-shift"
                min="-12"
                max="12"
                step="1"
                value={pitchShift}
                onChange={(e) => setPitchShift(parseInt(e.target.value))}
                disabled={isSubmitting}
                className={css({ 
                  w: 'full',
                  h: 2,
                  bg: 'gray.200',
                  rounded: 'lg',
                  cursor: 'pointer',
                  _disabled: { 
                    cursor: 'not-allowed',
                    opacity: 0.5
                  }
                })}
              />
              <div className={flex({ justifyContent: 'space-between', mt: 2 })}>
                <span className={css({ fontSize: 'xs', color: 'gray.500' })}>-12 (Lower)</span>
                <span className={css({ fontSize: 'xs', color: 'gray.500' })}>0 (Original)</span>
                <span className={css({ fontSize: 'xs', color: 'gray.500' })}>+12 (Higher)</span>
              </div>
            </div>

            {/* Upload Progress */}
            {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className={css({ mb: 8 })}>
                <div className={flex({ 
                  justifyContent: 'space-between',
                  fontSize: 'sm',
                  color: 'gray.600',
                  mb: 2
                })}>
                  <span>Uploading song...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className={css({ 
                  w: 'full',
                  bg: 'gray.200',
                  rounded: 'full',
                  h: 2,
                  overflow: 'hidden'
                })}>
                  <div 
                    className={css({ 
                      bg: 'cayenne',
                      h: 'full',
                      transition: 'all 0.3s'
                    })}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !songFile}
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
              {isSubmitting ? 
                uploadProgress < 100 ? 'Uploading...' : 'Processing...' 
                : 'Create AI Cover'}
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
            <li>Use songs with clear, prominent vocals</li>
            <li>Adjust pitch shift if the original singer's range differs from your voice</li>
            <li>Processing takes 2-5 minutes depending on song length</li>
            <li>Best results with studio-quality recordings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}