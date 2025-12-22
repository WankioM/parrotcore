import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
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
      const profile = await voicesService.createVoiceProfile({
        name: voiceName,
        description: description || undefined,
      });
      router.push(`/voices/${profile.id}`);
    } catch (err: any) {
      console.error('Error creating voice profile:', err);
      setError(err.response?.data?.error || 'Failed to create voice profile. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className={css({ minH: 'screen', display: 'flex' })}>
   
      <div className={flex({ 
        w: { base: 'full', lg: '1/2' },
        bg: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        p: { base: 8, lg: 12 }
      })}>
        <div className={css({ w: 'full', maxW: '560px' })}>
          <Link href="/" className={css({ 
            display: 'inline-block',
            color: 'gray.600',
            fontSize: 'sm',
            mb: 12,
            _hover: { color: 'cayenne' },
            transition: 'colors'
          })}>
            ← Back
          </Link>

          <div className={css({ mb: 10 })}>
            <h1 className={css({ 
              fontSize: '5xl',
              fontWeight: 'extrabold',
              color: 'gray.900',
              lineHeight: 'tight',
              mb: 4
            })}>
              Create Voice Profile
            </h1>
            <p className={css({ fontSize: 'lg', color: 'gray.600' })}>
              Upload voice samples to create your unique AI voice clone
            </p>
          </div>

          {error && (
            <div className={css({ 
              bg: 'red.50',
              borderLeft: '4px solid',
              borderColor: 'red.500',
              p: 4,
              mb: 6,
              rounded: 'md'
            })}>
              <div className={flex({ alignItems: 'flex-start', gap: 3 })}>
                <span className={css({ color: 'red.500', fontSize: 'xl' })}>⚠️</span>
                <p className={css({ color: 'red.800', fontSize: 'sm', fontWeight: 'medium' })}>
                  {error}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={css({ display: 'flex', flexDir: 'column', gap: 6 })}>
            <div>
              <label htmlFor="voiceName" className={css({ 
                display: 'block',
                fontSize: 'sm',
                fontWeight: 'semibold',
                color: 'gray.900',
                mb: 2
              })}>
                Voice Name *
              </label>
              <input
                type="text"
                id="voiceName"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="e.g., My Professional Voice"
                className={css({
                  w: 'full',
                  px: 4,
                  py: 3,
                  border: '2px solid',
                  borderColor: 'gray.200',
                  rounded: 'lg',
                  fontSize: 'base',
                  color: 'gray.900',
                  _focus: { borderColor: 'cayenne', outline: 'none' },
                  transition: 'colors'
                })}
                required
                disabled={isCreating}
              />
            </div>

            <div>
              <label htmlFor="description" className={css({ 
                display: 'block',
                fontSize: 'sm',
                fontWeight: 'semibold',
                color: 'gray.900',
                mb: 2
              })}>
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this voice profile..."
                rows={4}
                className={css({
                  w: 'full',
                  px: 4,
                  py: 3,
                  border: '2px solid',
                  borderColor: 'gray.200',
                  rounded: 'lg',
                  fontSize: 'base',
                  color: 'gray.900',
                  resize: 'none',
                  _focus: { borderColor: 'cayenne', outline: 'none' },
                  transition: 'colors'
                })}
                disabled={isCreating}
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className={css({
                w: 'full',
                py: 4,
                bg: 'cayenne',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 'base',
                rounded: 'lg',
                mt: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                opacity: isCreating ? 0.5 : 0.95,
                _hover: { opacity: 0.9 },
                _disabled: { cursor: 'not-allowed' },
                transition: 'all'
              })}
            >
              {isCreating ? (
                <>
                  <div className={css({ 
                    animation: 'spin',
                    w: 5,
                    h: 5,
                    border: '2px solid',
                    borderColor: 'white/30',
                    borderTopColor: 'white',
                    rounded: 'full'
                  })} />
                  Creating Profile...
                </>
              ) : (
                'Create Profile & Upload Samples'
              )}
            </button>
          </form>

          <div className={css({ 
            mt: 8,
            bg: 'gray.50',
            border: '1px solid',
            borderColor: 'gray.200',
            rounded: 'lg',
            p: 6
          })}>
            <h3 className={flex({ 
              fontWeight: 'bold',
              color: 'gray.900',
              mb: 4,
              alignItems: 'center',
              gap: 2,
              fontSize: 'base'
            })}>
              💡 Tips for Best Results
            </h3>
            <ul className={css({ display: 'flex', flexDir: 'column', gap: 2, fontSize: 'sm', color: 'gray.600' })}>
              <li className={flex({ alignItems: 'flex-start', gap: 2 })}>
                <span className={css({ color: 'cayenne', mt: 1 })}>•</span>
                <span>Upload at least 3-5 voice samples for better quality</span>
              </li>
              <li className={flex({ alignItems: 'flex-start', gap: 2 })}>
                <span className={css({ color: 'cayenne', mt: 1 })}>•</span>
                <span>Each sample should be 10-30 seconds long</span>
              </li>
              <li className={flex({ alignItems: 'flex-start', gap: 2 })}>
                <span className={css({ color: 'cayenne', mt: 1 })}>•</span>
                <span>Use clear audio with minimal background noise</span>
              </li>
              <li className={flex({ alignItems: 'flex-start', gap: 2 })}>
                <span className={css({ color: 'cayenne', mt: 1 })}>•</span>
                <span>Supported formats: WAV, MP3, FLAC (Max 50MB per file)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      
    </div>
  );
}