// components/voices/VoiceTypeSection.tsx
import React from 'react';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
import { VoiceProfile, VoiceSampleType, VoiceSample, EnrollmentJob } from '@/lib/types/api';
import {
  getStatusBadgeStyles,
  getStatusEmoji,
  getStatusLabel,
  getVoiceTypeLabel,
  getVoiceTypeDescription,
  getSampleRequirementsText,
  formatDuration,
  formatFileSize,
  getEnrollmentStepDescription,
  canStartEnrollment,
  getEnrollmentButtonText,
} from '@/lib/utils/voiceHelpers';

interface VoiceTypeSectionProps {
  profile: VoiceProfile;
  type: VoiceSampleType;
  samples: VoiceSample[];
  job: EnrollmentJob | null;
  uploading: boolean;
  uploadProgress: number;
  currentFileName?: string;
  onFileUpload: (files: FileList, type: VoiceSampleType) => void;
  onStartEnrollment: (type: VoiceSampleType) => void;
  onDeleteSample: (sampleId: string) => void;
}

export default function VoiceTypeSection({
  profile,
  type,
  samples,
  job,
  uploading,
  uploadProgress,
  currentFileName,
  onFileUpload,
  onStartEnrollment,
  onDeleteSample,
}: VoiceTypeSectionProps) {
  const status = type === 'speaking' ? profile.speaking_status : profile.singing_status;
  const sampleCount = type === 'speaking' ? profile.speaking_sample_count : profile.singing_sample_count;
  const requiredSamples = type === 'speaking' ? 3 : 5;
  const enrollmentCheck = canStartEnrollment(profile, type);

  return (
    <div className={css({ 
      bg: 'white', 
      rounded: 'xl', 
      p: 8, 
      border: '2px solid', 
      borderColor: 'gray.200' 
    })}>
      {/* Header */}
      <div className={flex({ 
        justifyContent: 'space-between', 
        alignItems: 'start', 
        mb: 6,
        flexWrap: 'wrap',
        gap: 3
      })}>
        <div>
          <h2 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 1 })}>
            {getVoiceTypeLabel(type)}
          </h2>
          <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
            {getVoiceTypeDescription(type)}
          </p>
        </div>
        <span className={css(getStatusBadgeStyles(status))}>
          {getStatusEmoji(status)} {getStatusLabel(status)}
        </span>
      </div>

      {/* Requirements Banner */}
      <div className={css({ 
        mb: 6, 
        p: 4, 
        bg: sampleCount >= requiredSamples ? 'green.50' : 'blue.50',
        rounded: 'lg', 
        border: '1px solid', 
        borderColor: sampleCount >= requiredSamples ? 'green.200' : 'blue.200'
      })}>
        <p className={css({ 
          fontSize: 'sm', 
          color: sampleCount >= requiredSamples ? 'green.800' : 'blue.800',
          fontWeight: 'medium', 
          mb: 2 
        })}>
          {sampleCount >= requiredSamples 
            ? `✓ ${sampleCount} samples uploaded (minimum ${requiredSamples})` 
            : `Upload ${requiredSamples - sampleCount} more sample(s) (${sampleCount}/${requiredSamples})`
          }
        </p>
        <p className={css({ fontSize: 'xs', color: sampleCount >= requiredSamples ? 'green.700' : 'blue.700' })}>
          {getSampleRequirementsText(type)}
        </p>
      </div>

      {/* Enrollment Progress */}
      {job && (job.status === 'processing' || job.status === 'queued') && (
        <div className={css({ 
          mb: 6, 
          p: 4, 
          bg: 'blue.50', 
          rounded: 'lg', 
          border: '1px solid', 
          borderColor: 'blue.200' 
        })}>
          <div className={flex({ alignItems: 'center', gap: 3, mb: 3 })}>
            <div className={css({ 
              animation: 'spin',
              w: 5,
              h: 5,
              border: '2px solid',
              borderColor: 'blue.300',
              borderTopColor: 'blue.600',
              rounded: 'full'
            })} />
            <p className={css({ fontSize: 'sm', fontWeight: 'bold', color: 'blue.900' })}>
              {getEnrollmentStepDescription(job.current_step, type)}
            </p>
          </div>
          <div className={css({ mb: 2 })}>
            <div className={flex({ 
              justifyContent: 'space-between',
              fontSize: 'xs',
              color: 'blue.800',
              mb: 1,
              fontWeight: 'medium'
            })}>
              <span>Progress</span>
              <span>{job.progress_percent}%</span>
            </div>
            <div className={css({ 
              w: 'full',
              bg: 'blue.100',
              rounded: 'full',
              h: 2,
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
          <p className={css({ fontSize: 'xs', color: 'blue.700' })}>
            ⏱️ Usually takes 2-5 minutes
          </p>
        </div>
      )}

      {/* Sample List */}
      {samples.length > 0 && (
        <div className={css({ mb: 6 })}>
          <h3 className={css({ 
            fontSize: 'sm', 
            fontWeight: 'semibold', 
            mb: 3, 
            color: 'gray.700' 
          })}>
            Uploaded Samples ({samples.length})
          </h3>
          <div className={css({ display: 'flex', flexDir: 'column', gap: 2 })}>
            {samples.map((sample) => (
              <div
                key={sample.id}
                className={css({ 
                  p: 3, 
                  bg: 'gray.50', 
                  rounded: 'lg', 
                  border: '1px solid', 
                  borderColor: 'gray.200' 
                })}
              >
                <div className={flex({ justifyContent: 'space-between', alignItems: 'center' })}>
                  <div className={flex({ alignItems: 'center', gap: 2, flex: 1, minW: 0 })}>
                    <span className={css({ fontSize: 'xl' })}>🎵</span>
                    <div className={css({ minW: 0, flex: 1 })}>
                      <p className={css({ 
                        fontSize: 'sm', 
                        fontWeight: 'medium',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      })}>
                        {sample.original_filename}
                      </p>
                      <p className={css({ fontSize: 'xs', color: 'gray.600' })}>
                        {formatDuration(sample.duration_seconds)} • {formatFileSize(sample.file_size_bytes)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteSample(sample.id)}
                    className={css({ 
                      color: 'red.600',
                      fontSize: 'sm',
                      fontWeight: 'medium',
                      px: 2,
                      _hover: { color: 'red.800' }
                    })}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {status !== 'ready' && (
        <div className={css({ mb: 3 })}>
          <input
            type="file"
            accept="audio/wav,audio/mp3,audio/mpeg,audio/flac"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                onFileUpload(files, type);
              }
            }}
            disabled={uploading || status === 'enrolling'}
            className={css({ display: 'none' })}
            id={`upload-${type}`}
          />
          <label
            htmlFor={`upload-${type}`}
            className={css({
              display: 'block',
              w: 'full',
              py: 2.5,
              bg: uploading || status === 'enrolling' ? 'gray.300' : 'gray.800',
              color: 'white',
              fontWeight: 'semibold',
              rounded: 'lg',
              textAlign: 'center',
              fontSize: 'sm',
              cursor: uploading || status === 'enrolling' ? 'not-allowed' : 'pointer',
              _hover: uploading || status === 'enrolling' ? {} : { bg: 'gray.900' },
            })}
          >
            {uploading ? (
              currentFileName ? `Uploading ${currentFileName}... ${uploadProgress}%` : `Uploading... ${uploadProgress}%`
            ) : '📁 Upload Sample(s)'}
          </label>
        </div>
      )}

      {/* Enroll Button */}
      <button
        onClick={() => onStartEnrollment(type)}
        disabled={!enrollmentCheck.can}
        className={css({
          w: 'full',
          py: 2.5,
          bg: enrollmentCheck.can ? 'cayenne' : 'gray.300',
          color: 'white',
          fontWeight: 'semibold',
          rounded: 'lg',
          fontSize: 'sm',
          cursor: enrollmentCheck.can ? 'pointer' : 'not-allowed',
          _hover: enrollmentCheck.can ? { opacity: 0.9 } : {},
        })}
      >
        {getEnrollmentButtonText(profile, type)}
      </button>

      {!enrollmentCheck.can && enrollmentCheck.reason && (
        <p className={css({ 
          mt: 2, 
          fontSize: 'xs', 
          color: 'gray.600', 
          textAlign: 'center' 
        })}>
          {enrollmentCheck.reason}
        </p>
      )}
    </div>
  );
}