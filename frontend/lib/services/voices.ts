import { apiClient } from '../api';
import {
  VoiceProfile,
  VoiceSample,
  CreateVoiceProfileRequest,
  UploadVoiceSampleResponse,
  EnrollmentJob,
  OnUploadProgress,
  FILE_CONSTRAINTS,
  VoiceSampleType,
  EnrollmentJobType,
  VoiceCapabilities,
} from '../types/api';

const API_PREFIX = '/api/v1';

export const voicesService = {
  // Get all voice profiles
  async getVoiceProfiles(): Promise<VoiceProfile[]> {
   const response = await apiClient.get(`/voices/`); 
    return response.data;
  },

  // Get single voice profile with samples and enrollment status
  async getVoiceProfile(id: string): Promise<VoiceProfile> {
    const response = await apiClient.get(`/voices/${id}/`);
    console.log('🔍 Voice Profile Response:', response.data);
    return response.data;
  },

  // Create new voice profile
  async createVoiceProfile(data: CreateVoiceProfileRequest): Promise<VoiceProfile> {
    const response = await apiClient.post(`/voices/`, data);
    return response.data;
  },

  // Upload voice sample - NEW: separate endpoints for speaking/singing
  async uploadVoiceSample(
    voiceId: string,
    file: File,
    sampleType: VoiceSampleType,
    onProgress?: OnUploadProgress
  ): Promise<UploadVoiceSampleResponse> {
    // Validate file
    this.validateVoiceSample(file);

    const formData = new FormData();
    formData.append('file', file);

    // Use different endpoint based on sample type
    const endpoint = `/voices/${voiceId}/samples/${sampleType}/`;

    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          });
        }
      },
    });

    return response.data;
  },

  // Start enrollment process - NEW: separate endpoints for speaking/singing
  async enrollVoice(
    voiceId: string,
    jobType: EnrollmentJobType
  ): Promise<EnrollmentJob> {
    const endpoint = `/voices/${voiceId}/enroll/${jobType}/`;
    const response = await apiClient.post(endpoint);
    return response.data;
  },

  // Get enrollment job status - NEW
  async getEnrollmentJob(
    voiceId: string,
    jobType: EnrollmentJobType
  ): Promise<EnrollmentJob> {
    const endpoint = `/voices/${voiceId}/jobs/${jobType}/`;
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  // Poll enrollment status - UPDATED: separate polling for speaking/singing
  async pollEnrollmentStatus(
    voiceId: string,
    jobType: EnrollmentJobType,
    onProgress?: (job: EnrollmentJob) => void,
    pollInterval: number = 3000
  ): Promise<EnrollmentJob> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const job = await this.getEnrollmentJob(voiceId, jobType);
          
          if (onProgress) {
            onProgress(job);
          }

          if (job.status === 'completed') {
            resolve(job);
          } else if (job.status === 'failed') {
            reject(new Error(job.error_message || 'Enrollment failed'));
          } else {
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  },

  // Delete voice profile
  async deleteVoiceProfile(id: string): Promise<void> {
    await apiClient.delete(`/voices/${id}/`);
  },

  // Delete specific voice sample
  async deleteVoiceSample(voiceId: string, sampleId: string): Promise<void> {
    await apiClient.delete(`/voices/${voiceId}/samples/${sampleId}/`);
  },

  // Validate voice sample file
  validateVoiceSample(file: File): void {
    const { MAX_SIZE, ALLOWED_TYPES, ALLOWED_EXTENSIONS } = FILE_CONSTRAINTS.VOICE_SAMPLE;

    // Check file size
    if (file.size > MAX_SIZE) {
      throw new Error(`File size must be less than ${MAX_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type with proper type casting
    const fileType = file.type as typeof ALLOWED_TYPES[number];
    if (!ALLOWED_TYPES.includes(fileType)) {
      throw new Error(`File type must be one of: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Check file extension as fallback with proper type casting
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}` as typeof ALLOWED_EXTENSIONS[number];
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(`File extension must be one of: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }
  },

  // NEW: Helper to check voice capabilities
  getVoiceCapabilities(profile: VoiceProfile): VoiceCapabilities {
    return {
      canUseTTS: profile.speaking_status === 'ready',
      canUseCovers: profile.singing_status === 'ready',
      speakingReady: profile.speaking_status === 'ready',
      singingReady: profile.singing_status === 'ready',
      speakingInProgress: profile.speaking_status === 'enrolling',
      singingInProgress: profile.singing_status === 'enrolling',
    };
  },

  // NEW: Get samples by type
  getSamplesByType(profile: VoiceProfile, type: VoiceSampleType): VoiceSample[] {
    return profile.samples?.filter(sample => sample.sample_type === type) || [];
  },

  // NEW: Get status badge info for UI
  getStatusBadgeInfo(status: VoiceProfile['speaking_status']): {
    label: string;
    emoji: string;
    colorClass: string;
  } {
    switch (status) {
      case 'ready':
        return { label: 'Ready', emoji: '✓', colorClass: 'green' };
      case 'enrolling':
        return { label: 'Training', emoji: '⚙️', colorClass: 'blue' };
      case 'failed':
        return { label: 'Failed', emoji: '✗', colorClass: 'red' };
      default:
        return { label: 'Pending', emoji: '⏳', colorClass: 'gray' };
    }
  },

  // NEW: Get enrollment requirements met
  getEnrollmentRequirements(profile: VoiceProfile, type: VoiceSampleType): {
    met: boolean;
    current: number;
    required: number;
    message: string;
  } {
    const sampleCount = type === 'speaking' 
      ? profile.speaking_sample_count 
      : profile.singing_sample_count;
    
    const required = type === 'speaking' ? 3 : 5; // Speaking needs 3, singing needs 5
    const met = sampleCount >= required;

    return {
      met,
      current: sampleCount,
      required,
      message: met 
        ? `✓ ${sampleCount} samples uploaded (minimum ${required})` 
        : `Upload ${required - sampleCount} more ${type} sample(s) (${sampleCount}/${required})`,
    };
  },
};