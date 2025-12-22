import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex, grid } from '@/styled-system/patterns';
import { voicesService } from '@/lib/services/voices';
import { VoiceProfile } from '@/lib/types/api';

export default function VoiceDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Load voice profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setIsLoading(true);
        const data = await voicesService.getVoiceProfile(id);
        setProfile(data);
      } catch (err: any) {
        console.error('Failed to load voice profile:', err);
        setError('Failed to load voice profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  // Poll for enrollment status
  useEffect(() => {
    if (!profile || profile.status !== 'enrolling') return;

    const interval = setInterval(async () => {
      try {
        const updated = await voicesService.getVoiceProfile(profile.id);
        setProfile(updated);
        
        if (updated.status !== 'enrolling') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Failed to poll enrollment status:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [profile?.status, profile?.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !profile) return;

    setError(null);
    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        console.log(`📤 Uploading ${file.name}...`);
        
        await voicesService.uploadVoiceSample(
          profile.id,
          file,
          (progress) => {
            setUploadProgress(progress.percentage);
          }
        );

        console.log(`✅ Uploaded ${file.name}`);
      }

      const updated = await voicesService.getVoiceProfile(profile.id);
      setProfile(updated);
      setUploadProgress(0);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload samples');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEnroll = async () => {
    if (!profile) return;

    setError(null);
    setIsEnrolling(true);

    try {
      console.log('🎓 Starting enrollment...');
      await voicesService.enrollVoice(profile.id);
      
      const updated = await voicesService.getVoiceProfile(profile.id);
      setProfile(updated);
      
      console.log('✅ Enrollment started!');
    } catch (err: any) {
      console.error('Enrollment failed:', err);
      setError('Failed to start enrollment');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    if (!profile) return;

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this sample?')) {
      return;
    }

    try {
      console.log(`🗑️ Deleting sample ${sampleId}...`);
      await voicesService.deleteVoiceSample(profile.id, sampleId);
      
      console.log('✅ Sample deleted, refreshing profile...');
      const updated = await voicesService.getVoiceProfile(profile.id);
      setProfile(updated);
      
      console.log('✅ Profile updated!');
    } catch (err: any) {
      console.error('❌ Failed to delete sample:', err);
      setError(err.response?.data?.detail || 'Failed to delete sample');
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

  if (!profile) {
    return (
      <div className={flex({ 
        minH: 'screen',
        alignItems: 'center',
        justifyContent: 'center',
        flexDir: 'column',
        gap: 4
      })}>
        <p className={css({ color: 'gray.600' })}>Voice profile not found</p>
        <Link href="/" className={css({ 
          color: 'cayenne',
          _hover: { textDecoration: 'underline' }
        })}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className={css({ minH: 'screen', bg: 'white', py: 12 })}>
      <div className={css({ 
        maxW: '80rem',
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

        {/* Title & Status */}
        <div className={css({ mb: 8 })}>
          <h1 className={css({ 
            fontSize: { base: '4xl', lg: '5xl' },
            fontWeight: 'extrabold',
            color: 'gray.900',
            mb: 4,
            wordBreak: 'break-word'
          })}>
            {profile.name}
          </h1>
          <div className={flex({ 
            alignItems: 'center', 
            gap: 3,
            flexWrap: 'wrap'
          })}>
            <span className={css({
              px: 3,
              py: 1,
              rounded: 'full',
              fontSize: 'sm',
              fontWeight: 'semibold',
              bg: profile.status === 'ready' ? 'green.100' :
                  profile.status === 'enrolling' ? 'yellow.100' :
                  profile.status === 'failed' ? 'red.100' : 'gray.100',
              color: profile.status === 'ready' ? 'green.800' :
                     profile.status === 'enrolling' ? 'yellow.800' :
                     profile.status === 'failed' ? 'red.800' : 'gray.800'
            })}>
              {profile.status === 'ready' ? '✓ Ready' :
               profile.status === 'enrolling' ? '⏳ Training' :
               profile.status === 'failed' ? '✗ Failed' :
               '📝 Pending'}
            </span>
            <span className={css({ color: 'gray.600', fontSize: 'sm' })}>
              {profile.sample_count} samples uploaded
            </span>
          </div>
        </div>

        {/* Action Button / Status Card */}
        {profile.sample_count >= 3 && profile.status === 'pending' && (
          <div className={css({ mb: 8 })}>
            <button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className={css({
                px: 6,
                py: 3,
                bg: 'cayenne',
                color: 'white',
                fontWeight: 'bold',
                rounded: 'lg',
                fontSize: 'base',
                opacity: isEnrolling ? 0.5 : 0.95,
                _hover: { opacity: 0.9 },
                _disabled: { cursor: 'not-allowed' },
                transition: 'all',
                shadow: 'lg'
              })}
            >
              {isEnrolling ? 'Starting Training...' : 'Start Training'}
            </button>
          </div>
        )}

        {profile.status === 'enrolling' && (
          <div className={css({ 
            bg: 'yellow.50',
            px: 6,
            py: 5,
            rounded: 'xl',
            border: '2px solid',
            borderColor: 'yellow.300',
            mb: 8
          })}>
            <div className={flex({ alignItems: 'center', gap: 3, mb: 4 })}>
              <div className={css({ 
                animation: 'spin',
                w: 6,
                h: 6,
                border: '3px solid',
                borderColor: 'yellow.300',
                borderTopColor: 'yellow.600',
                rounded: 'full'
              })} />
              <p className={css({ 
                fontSize: 'lg',
                fontWeight: 'bold',
                color: 'yellow.900'
              })}>
                Training in progress...
              </p>
            </div>
            {profile.latest_enrollment && (
              <>
                <div className={css({ mb: 3 })}>
                  <div className={flex({ 
                    justifyContent: 'space-between',
                    fontSize: 'sm',
                    color: 'yellow.800',
                    mb: 2,
                    fontWeight: 'medium'
                  })}>
                    <span>Progress</span>
                    <span className={css({ fontWeight: 'bold' })}>
                      {profile.latest_enrollment.progress_percent}%
                    </span>
                  </div>
                  <div className={css({ 
                    w: 'full',
                    bg: 'yellow.100',
                    rounded: 'full',
                    h: 4,
                    overflow: 'hidden'
                  })}>
                    <div 
                      className={css({ 
                        bg: 'yellow.500',
                        h: 'full',
                        transition: 'all 0.5s'
                      })}
                      style={{ width: `${profile.latest_enrollment.progress_percent}%` }}
                    />
                  </div>
                </div>
                <p className={css({ fontSize: 'sm', color: 'yellow.700' })}>
                  ⏱️ This usually takes 2-5 minutes. You can leave and come back later.
                </p>
              </>
            )}
          </div>
        )}

        {profile.status === 'failed' && (
          <div className={css({ 
            bg: 'red.50',
            px: 6,
            py: 5,
            rounded: 'xl',
            border: '2px solid',
            borderColor: 'red.300',
            mb: 8
          })}>
            <h3 className={css({ 
              fontWeight: 'bold',
              color: 'red.900',
              mb: 2,
              fontSize: 'lg'
            })}>
              ✗ Training Failed
            </h3>
            <p className={css({ color: 'red.800', mb: 4 })}>
              {profile.latest_enrollment?.error_message || 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className={css({ 
                px: 5,
                py: 2,
                bg: 'red.600',
                color: 'white',
                fontWeight: 'semibold',
                rounded: 'lg',
                fontSize: 'sm',
                _hover: { bg: 'red.700' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
                transition: 'all'
              })}
            >
              {isEnrolling ? 'Retrying...' : 'Retry Training'}
            </button>
          </div>
        )}

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

        {/* Upload & Samples Grid */}
        <div className={grid({ columns: { base: 1, lg: 2 }, gap: 8 })}>
          {/* Upload Section */}
          <div className={css({ 
            bg: 'white',
            border: '2px solid',
            borderColor: 'gray.200',
            rounded: 'xl',
            p: 8
          })}>
            <h2 className={css({ 
              fontSize: '2xl',
              fontWeight: 'bold',
              color: 'gray.900',
              mb: 6
            })}>
              🎤 Upload Voice Samples
            </h2>

            <div className={css({ 
              border: '2px dashed',
              borderColor: 'gray.300',
              rounded: 'xl',
              p: 8,
              textAlign: 'center',
              mb: 6,
              cursor: 'pointer',
              _hover: { borderColor: 'cayenne' },
              transition: 'colors'
            })}>
              <input
                type="file"
                accept="audio/wav,audio/mp3,audio/mpeg,audio/flac"
                multiple
                onChange={handleFileUpload}
                className={css({ display: 'none' })}
                id="file-upload"
                disabled={isUploading || profile.status === 'enrolling'}
              />
              <label htmlFor="file-upload" className={css({ cursor: 'pointer' })}>
                <div className={css({ fontSize: '5xl', mb: 4 })}>📁</div>
                <p className={css({ fontWeight: 'semibold', color: 'gray.900', mb: 2 })}>
                  Click to upload or drag and drop
                </p>
                <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                  WAV, MP3, or FLAC (max 50MB per file)
                </p>
              </label>
            </div>

            {isUploading && (
              <div className={css({ mb: 6 })}>
                <div className={flex({ 
                  justifyContent: 'space-between',
                  fontSize: 'sm',
                  color: 'gray.600',
                  mb: 2
                })}>
                  <span>Uploading...</span>
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
          </div>

          {/* Samples List */}
          <div className={css({ 
            bg: 'white',
            border: '2px solid',
            borderColor: 'gray.200',
            rounded: 'xl',
            p: 8
          })}>
            <h2 className={css({ 
              fontSize: '2xl',
              fontWeight: 'bold',
              color: 'gray.900',
              mb: 6
            })}>
              📋 Uploaded Samples
            </h2>

            {profile.samples.length === 0 ? (
              <div className={css({ textAlign: 'center', py: 12 })}>
                <div className={css({ fontSize: '5xl', mb: 4 })}>🎵</div>
                <p className={css({ color: 'gray.600' })}>No samples uploaded yet</p>
                <p className={css({ fontSize: 'sm', color: 'gray.500', mt: 2 })}>
                  Upload at least 3 samples to start training
                </p>
              </div>
            ) : (
              <div className={css({ display: 'flex', flexDir: 'column', gap: 3 })}>
                {profile.samples.map((sample) => (
                  <div 
                    key={sample.id}
                    className={flex({ 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 4,
                      bg: 'gray.50',
                      rounded: 'lg',
                      border: '1px solid',
                      borderColor: 'gray.200'
                    })}
                  >
                    <div className={flex({ alignItems: 'center', gap: 3 })}>
                      <span className={css({ fontSize: '2xl' })}>🎵</span>
                      <div>
                        <p className={css({ 
                          fontWeight: 'medium',
                          color: 'gray.900',
                          fontSize: 'sm'
                        })}>
                          {sample.original_filename}
                        </p>
                        <p className={css({ fontSize: 'xs', color: 'gray.500' })}>
                          {sample.duration_seconds.toFixed(1)}s
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSample(sample.id)}
                      className={css({ 
                        color: 'red.600',
                        fontSize: 'sm',
                        fontWeight: 'medium',
                        _hover: { color: 'red.800' }
                      })}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Requirements Warning */}
        {profile.sample_count < 3 && profile.status === 'pending' && (
          <div className={css({ 
            mt: 8,
            bg: 'yellow.50',
            border: '2px solid',
            borderColor: 'yellow.300',
            rounded: 'xl',
            p: 6
          })}>
            <h3 className={css({ 
              fontWeight: 'bold',
              color: 'yellow.900',
              mb: 2,
              fontSize: 'base'
            })}>
              ⚠️ Action Required
            </h3>
            <p className={css({ color: 'yellow.800' })}>
              You need at least {3 - profile.sample_count} more voice sample(s) before you can start training.
            </p>
          </div>
        )}

        {/* Success Card */}
        {profile.status === 'ready' && (
          <div className={css({ 
            mt: 8,
            bg: 'green.50',
            border: '2px solid',
            borderColor: 'green.300',
            rounded: 'xl',
            p: 6
          })}>
            <h3 className={css({ 
              fontWeight: 'bold',
              color: 'green.900',
              mb: 2,
              fontSize: 'lg'
            })}>
              ✅ Voice Model Ready!
            </h3>
            <p className={css({ color: 'green.800', mb: 4 })}>
              Your voice has been successfully trained. Ready to create amazing content!
            </p>
            <div className={flex({ gap: 3, flexWrap: 'wrap' })}>
              <Link 
                href="/tts/new"
                className={css({ 
                  px: 5,
                  py: 2,
                  bg: 'green.600',
                  color: 'white',
                  fontWeight: 'semibold',
                  rounded: 'lg',
                  fontSize: 'sm',
                  _hover: { bg: 'green.700' },
                  transition: 'all'
                })}
              >
                Try Text-to-Speech →
              </Link>
              <Link 
                href="/covers/new"
                className={css({ 
                  px: 5,
                  py: 2,
                  border: '2px solid',
                  borderColor: 'green.600',
                  color: 'green.700',
                  fontWeight: 'semibold',
                  rounded: 'lg',
                  fontSize: 'sm',
                  _hover: { bg: 'green.50' },
                  transition: 'all'
                })}
              >
                Create AI Cover →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}