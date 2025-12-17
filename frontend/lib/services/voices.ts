import { apiClient } from '../api';
import {
  VoiceProfile,
  VoiceSample,
  CreateVoiceProfileRequest,
  UploadVoiceSampleResponse,
  OnUploadProgress,
  FILE_CONSTRAINTS,
} from '../types/api';

export const voicesService = {
  // Get all voice profiles
  async getVoiceProfiles(): Promise<VoiceProfile[]> {
    const response = await apiClient.get('/voices/');
    return response.data;
  },


  async pollEnrollmentStatus(
  profileId: string,
  onProgress?: (profile: VoiceProfile) => void,
  pollInterval: number = 3000
): Promise<VoiceProfile> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const profile = await this.getVoiceProfile(profileId);
        
        if (onProgress) {
          onProgress(profile);
        }

        if (profile.status === 'ready') {
          resolve(profile);
        } else if (profile.status === 'failed') {
          reject(new Error('Enrollment failed'));
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
  // Get single voice profile with samples and enrollment status
  async getVoiceProfile(id: string): Promise<VoiceProfile> {
    const response = await apiClient.get(`/voices/${id}/`);
    return response.data;
  },

  // Create new voice profile
  async createVoiceProfile(data: CreateVoiceProfileRequest): Promise<VoiceProfile> {
    const response = await apiClient.post('/voices/', data);
    return response.data;
  },

  // Upload voice sample with progress tracking
  async uploadVoiceSample(
    voiceId: string,
    file: File,
    onProgress?: OnUploadProgress
  ): Promise<UploadVoiceSampleResponse> {
    // Validate file
    this.validateVoiceSample(file);

    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/voices/${voiceId}/samples/`, formData, {
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

  // Start enrollment process
  async enrollVoice(voiceId: string): Promise<{ job_id: string }> {
    const response = await apiClient.post(`/voices/${voiceId}/enroll/`);
    return response.data;
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
};