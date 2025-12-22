import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
import { coversService } from '@/lib/services/covers';
import { CoverJob } from '@/lib/types/api';

export default function CoverJobStatus() {
  const router = useRouter();
  const { id } = router.query;
  
  const [job, setJob] = useState<CoverJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load and poll job status
  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const loadJob = async () => {
      try {
        setIsLoading(true);
        const data = await coversService.getCoverJob(id);
        setJob(data);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load cover job:', err);
        setError('Failed to load cover job');
        setIsLoading(false);
      }
    };

    loadJob();
  }, [id]);

  // Poll for job completion
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const updated = await coversService.getCoverJob(job.id);
        setJob(updated);
        
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Failed to poll job status:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [job?.status, job?.id]);

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

  if (error || !job) {
    return (
      <div className={flex({ 
        minH: 'screen',
        alignItems: 'center',
        justifyContent: 'center',
        flexDir: 'column',
        gap: 4
      })}>
        <p className={css({ color: 'gray.600' })}>
          {error || 'Cover job not found'}
        </p>
        <Link href="/covers/new" className={css({ 
          color: 'cayenne',
          _hover: { textDecoration: 'underline' }
        })}>
          ← Create New Cover
        </Link>
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
        <Link href="/covers/new" className={css({ 
          display: 'inline-block',
          color: 'gray.600',
          mb: 8,
          fontSize: 'sm',
          _hover: { color: 'cayenne' },
          transition: 'colors'
        })}>
          ← Create New Cover
        </Link>

        {/* Header */}
        <div className={css({ mb: 8 })}>
          <h1 className={css({ 
            fontSize: { base: '4xl', lg: '5xl' },
            fontWeight: 'extrabold',
            color: 'gray.900',
            mb: 4
          })}>
            🎵 AI Cover Job
          </h1>
          <div className={flex({ alignItems: 'center', gap: 3, flexWrap: 'wrap' })}>
            <span className={css({
              px: 3,
              py: 1,
              rounded: 'full',
              fontSize: 'sm',
              fontWeight: 'semibold',
              bg: job.status === 'completed' ? 'green.100' :
                  job.status === 'processing' ? 'blue.100' :
                  job.status === 'failed' ? 'red.100' : 'yellow.100',
              color: job.status === 'completed' ? 'green.800' :
                     job.status === 'processing' ? 'blue.800' :
                     job.status === 'failed' ? 'red.800' : 'yellow.800'
            })}>
              {job.status === 'completed' ? '✓ Completed' :
               job.status === 'processing' ? '⚙️ Processing' :
               job.status === 'failed' ? '✗ Failed' :
               '⏳ Queued'}
            </span>
            {job.original_filename && (
              <span className={css({ fontSize: 'sm', color: 'gray.600' })}>
                {job.original_filename}
              </span>
            )}
          </div>
        </div>

        {/* Processing Status with Steps */}
        {(job.status === 'pending' || job.status === 'queued' || job.status === 'processing') && (
          <div className={css({ 
            bg: 'blue.50',
            px: 6,
            py: 5,
            rounded: 'xl',
            border: '2px solid',
            borderColor: 'blue.300',
            mb: 8
          })}>
            <div className={flex({ alignItems: 'center', gap: 3, mb: 4 })}>
              <div className={css({ 
                animation: 'spin',
                w: 6,
                h: 6,
                border: '3px solid',
                borderColor: 'blue.300',
                borderTopColor: 'blue.600',
                rounded: 'full'
              })} />
              <p className={css({ 
                fontSize: 'lg',
                fontWeight: 'bold',
                color: 'blue.900'
              })}>
                {coversService.getStepDescription(job.current_step)}
              </p>
            </div>

            {/* Progress Bar */}
            <div className={css({ mb: 3 })}>
              <div className={flex({ 
                justifyContent: 'space-between',
                fontSize: 'sm',
                color: 'blue.800',
                mb: 2,
                fontWeight: 'medium'
              })}>
                <span>Progress</span>
                <span className={css({ fontWeight: 'bold' })}>
                  {job.progress_percent}%
                </span>
              </div>
              <div className={css({ 
                w: 'full',
                bg: 'blue.100',
                rounded: 'full',
                h: 4,
                overflow: 'hidden'
              })}>
                <div 
                  className={css({ 
                    bg: 'blue.500',
                    h: 'full',
                    transition: 'all 0.5s'
                  })}
                  style={{ width: `${job.progress_percent}%` }}
                />
              </div>
            </div>

            {/* Step Indicators */}
            <div className={css({ mt: 4 })}>
              <div className={flex({ gap: 2, flexWrap: 'wrap' })}>
                {(['downloading', 'separating', 'converting', 'mixing', 'complete'] as const).map((step) => {
                  const isComplete = job.current_step === 'complete' || 
                    (['downloading', 'separating', 'converting', 'mixing'].indexOf(step) < 
                     ['downloading', 'separating', 'converting', 'mixing'].indexOf(job.current_step));
                  const isCurrent = job.current_step === step;
                  
                  return (
                    <span
                      key={step}
                      className={css({
                        px: 2,
                        py: 1,
                        rounded: 'md',
                        fontSize: 'xs',
                        fontWeight: 'medium',
                        bg: isComplete ? 'green.200' : isCurrent ? 'blue.200' : 'gray.200',
                        color: isComplete ? 'green.900' : isCurrent ? 'blue.900' : 'gray.600'
                      })}
                    >
                      {isComplete ? '✓' : isCurrent ? '▶' : '○'} {step}
                    </span>
                  );
                })}
              </div>
            </div>

            <p className={css({ fontSize: 'sm', color: 'blue.700', mt: 4 })}>
              ⏱️ This usually takes 2-5 minutes. The page will update automatically.
            </p>
          </div>
        )}

        {/* Failed Status */}
        {job.status === 'failed' && (
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
              ✗ Cover Generation Failed
            </h3>
            <p className={css({ color: 'red.800', mb: 4 })}>
              {job.error_message || 'Something went wrong. Please try again.'}
            </p>
            <Link
              href="/covers/new"
              className={css({ 
                display: 'inline-block',
                px: 5,
                py: 2,
                bg: 'red.600',
                color: 'white',
                fontWeight: 'semibold',
                rounded: 'lg',
                fontSize: 'sm',
                _hover: { bg: 'red.700' },
                transition: 'all'
              })}
            >
              Try Again
            </Link>
          </div>
        )}

        {/* Song Info Card */}
        <div className={css({ 
          bg: 'white',
          border: '2px solid',
          borderColor: 'gray.200',
          rounded: 'xl',
          p: 8,
          mb: 8
        })}>
          <h2 className={css({ 
            fontSize: 'xl',
            fontWeight: 'bold',
            color: 'gray.900',
            mb: 4
          })}>
            📝 Cover Settings
          </h2>
          <div className={css({ 
            display: 'grid',
            gap: 3,
            fontSize: 'sm',
            color: 'gray.700'
          })}>
            <div className={flex({ justifyContent: 'space-between' })}>
              <span className={css({ fontWeight: 'medium' })}>Voice Profile:</span>
              <span>{job.voice_profile_name}</span>
            </div>
            <div className={flex({ justifyContent: 'space-between' })}>
              <span className={css({ fontWeight: 'medium' })}>Pitch Shift:</span>
              <span>{job.pitch_shift > 0 ? '+' : ''}{job.pitch_shift} semitones</span>
            </div>
            <div className={flex({ justifyContent: 'space-between' })}>
              <span className={css({ fontWeight: 'medium' })}>Original Song:</span>
              <span>{job.original_filename}</span>
            </div>
          </div>
        </div>

        {/* Audio Player - Only show when completed */}
        {job.status === 'completed' && job.audio && (
          <div className={css({ 
            bg: 'green.50',
            border: '2px solid',
            borderColor: 'green.300',
            rounded: 'xl',
            p: 8
          })}>
            <h2 className={css({ 
              fontSize: 'xl',
              fontWeight: 'bold',
              color: 'green.900',
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            })}>
              <span>🎵</span>
              <span>Your AI Cover</span>
            </h2>
            
            {/* Audio Player */}
            <audio 
              ref={audioRef}
              controls 
              className={css({ 
                w: 'full',
                mb: 4,
                rounded: 'lg'
              })}
            >
              <source src={job.audio.download_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>

            {/* Download Button */}
            <a
              href={job.audio.download_url}
              download={`cover-${job.id}.mp3`}
              className={css({ 
                display: 'inline-block',
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
              ⬇️ Download Cover
            </a>
          </div>
        )}

        {/* Job Details */}
        <div className={css({ 
          mt: 8,
          bg: 'gray.50',
          border: '2px solid',
          borderColor: 'gray.200',
          rounded: 'xl',
          p: 6
        })}>
          <h3 className={css({ 
            fontWeight: 'bold',
            color: 'gray.900',
            mb: 3,
            fontSize: 'base'
          })}>
            Job Details
          </h3>
          <div className={css({ 
            display: 'grid',
            gap: 2,
            fontSize: 'sm',
            color: 'gray.700'
          })}>
            <div className={flex({ justifyContent: 'space-between' })}>
              <span className={css({ fontWeight: 'medium' })}>Job ID:</span>
              <span className={css({ fontFamily: 'mono', fontSize: 'xs' })}>
                {job.id}
              </span>
            </div>
            <div className={flex({ justifyContent: 'space-between' })}>
              <span className={css({ fontWeight: 'medium' })}>Created:</span>
              <span>{new Date(job.created_at).toLocaleString()}</span>
            </div>
            {job.started_at && (
              <div className={flex({ justifyContent: 'space-between' })}>
                <span className={css({ fontWeight: 'medium' })}>Started:</span>
                <span>{new Date(job.started_at).toLocaleString()}</span>
              </div>
            )}
            {job.completed_at && (
              <div className={flex({ justifyContent: 'space-between' })}>
                <span className={css({ fontWeight: 'medium' })}>Completed:</span>
                <span>{new Date(job.completed_at).toLocaleString()}</span>
              </div>
            )}
            {job.audio?.duration_seconds && (
              <div className={flex({ justifyContent: 'space-between' })}>
                <span className={css({ fontWeight: 'medium' })}>Duration:</span>
                <span>{job.audio.duration_seconds.toFixed(1)}s</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}