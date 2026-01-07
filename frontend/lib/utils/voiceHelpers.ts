import {
  VoiceProfile,
  VoiceSampleType,
  EnrollmentJob,
  VoiceProfileStatus,
} from '../types/api';

/**
 * UI Helper utilities for voice profile management
 */

// Get human-readable step description for enrollment
export function getEnrollmentStepDescription(
  step: string,
  jobType: 'speaking' | 'singing'
): string {
  const descriptions: Record<string, string> = {
    'downloading': 'Downloading voice samples...',
    'processing': 'Processing audio files...',
    'training_chatterbox': 'Training text-to-speech model...',
    'training_rvc': 'Training singing voice model...',
    'uploading': 'Uploading model files...',
    'complete': 'Enrollment complete!',
  };

  return descriptions[step] || step;
}

// Format duration in seconds to human-readable string
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

// Format file size to human-readable string
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

// Get status badge styles for Panda CSS
export function getStatusBadgeStyles(status: VoiceProfileStatus) {
  const baseStyles = {
    px: 3,
    py: 1,
    rounded: 'full',
    fontSize: 'sm',
    fontWeight: 'semibold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
  };

  switch (status) {
    case 'ready':
      return {
        ...baseStyles,
        bg: 'green.100',
        color: 'green.800',
      };
    case 'enrolling':
      return {
        ...baseStyles,
        bg: 'blue.100',
        color: 'blue.800',
      };
    case 'failed':
      return {
        ...baseStyles,
        bg: 'red.100',
        color: 'red.800',
      };
    default:
      return {
        ...baseStyles,
        bg: 'gray.100',
        color: 'gray.800',
      };
  }
}

// Get status emoji
export function getStatusEmoji(status: VoiceProfileStatus): string {
  switch (status) {
    case 'ready':
      return '✓';
    case 'enrolling':
      return '⚙️';
    case 'failed':
      return '✗';
    default:
      return '⏳';
  }
}

// Get status label
export function getStatusLabel(status: VoiceProfileStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'enrolling':
      return 'Training';
    case 'failed':
      return 'Failed';
    default:
      return 'Pending';
  }
}

// Check if enrollment can be started
export function canStartEnrollment(
  profile: VoiceProfile,
  type: VoiceSampleType
): { can: boolean; reason?: string } {
  const status = type === 'speaking' ? profile.speaking_status : profile.singing_status;
  const sampleCount = type === 'speaking' 
    ? profile.speaking_sample_count 
    : profile.singing_sample_count;
  const requiredSamples = type === 'speaking' ? 3 : 5;

  if (status === 'enrolling') {
    return { can: false, reason: 'Enrollment already in progress' };
  }

  if (status === 'ready') {
    return { can: false, reason: 'Voice already enrolled' };
  }

  if (sampleCount < requiredSamples) {
    return {
      can: false,
      reason: `Need at least ${requiredSamples} samples (have ${sampleCount})`,
    };
  }

  return { can: true };
}

// Get enrollment button text
export function getEnrollmentButtonText(
  profile: VoiceProfile,
  type: VoiceSampleType
): string {
  const status = type === 'speaking' ? profile.speaking_status : profile.singing_status;
  
  switch (status) {
    case 'ready':
      return '✓ Enrolled';
    case 'enrolling':
      return '⚙️ Training...';
    case 'failed':
      return '↻ Retry Enrollment';
    default:
      return '🚀 Start Training';
  }
}

// Get progress bar color
export function getProgressBarColor(status: VoiceProfileStatus): string {
  switch (status) {
    case 'ready':
      return 'green.500';
    case 'failed':
      return 'red.500';
    default:
      return 'blue.500';
  }
}

// Calculate total samples duration
export function getTotalDuration(profile: VoiceProfile, type?: VoiceSampleType): number {
  if (!profile.samples) return 0;
  
  const samples = type
    ? profile.samples.filter(s => s.sample_type === type)
    : profile.samples;
  
  return samples.reduce((total, sample) => total + sample.duration_seconds, 0);
}

// Get voice type label
export function getVoiceTypeLabel(type: VoiceSampleType): string {
  return type === 'speaking' ? '🎤 Speaking Voice' : '🎵 Singing Voice';
}

// Get voice type description
export function getVoiceTypeDescription(type: VoiceSampleType): string {
  return type === 'speaking'
    ? 'For text-to-speech generation'
    : 'For AI song covers';
}


// Get sample requirements text
export function getSampleRequirementsText(type: VoiceSampleType): string {
  const count = type === 'speaking' ? '3-5' : '5-10';
  const duration = type === 'speaking' ? '30-60 seconds' : '1-2 minutes';
  const purpose = type === 'speaking' 
    ? 'Clear speech samples work best for text-to-speech'
    : 'Upload samples of yourself singing the specific song you want to cover for optimal voice conversion quality';
  
  return `Upload ${count} samples, each ${duration} long. ${purpose}.`;
}

// Check if voice can be used for TTS
export function canUseTTS(profile: VoiceProfile): boolean {
  return profile.speaking_status === 'ready';
}

// Check if voice can be used for covers
export function canUseCovers(profile: VoiceProfile): boolean {
  return profile.singing_status === 'ready';
}