import { apiClient } from '../api';
import {
  CoverJob,
  CreateCoverJobRequest,
  OnUploadProgress,
  FILE_CONSTRAINTS,
} from '../types/api';

export const coversService = {
  // Get all cover jobs
  async getCoverJobs(): Promise<CoverJob[]> {
    const response = await apiClient.get('/covers/');
    return response.data;
  },

  // Get single cover job
  async getCoverJob(id: string): Promise<CoverJob> {
    const response = await apiClient.get(`/covers/${id}/`);
    return response.data;
  },

  // Create new cover job with song file upload
  async createCoverJob(
    data: CreateCoverJobRequest,
    songFile: File,
    onProgress?: OnUploadProgress
  ): Promise<CoverJob> {
    // Validate file
    this.validateSongFile(songFile);

    const formData = new FormData();
    formData.append('voice_profile_id', data.voice_profile_id);
    formData.append('file', songFile);
    
    if (data.pitch_shift !== undefined) {
      formData.append('pitch_shift', data.pitch_shift.toString());
    }
    if (data.vocal_volume !== undefined) {
      formData.append('vocal_volume', data.vocal_volume.toString());
    }
    if (data.instrumental_volume !== undefined) {
      formData.append('instrumental_volume', data.instrumental_volume.toString());
    }

    const response = await apiClient.post('/covers/', formData, {
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

  // Poll job status with step updates
  async pollJobStatus(
    jobId: string,
    onProgress?: (job: CoverJob) => void,
    pollInterval: number = 3000
  ): Promise<CoverJob> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const job = await this.getCoverJob(jobId);
          
          if (onProgress) {
            onProgress(job);
          }

          if (job.status === 'completed') {
            resolve(job);
          } else if (job.status === 'failed') {
            reject(new Error(job.error_message || 'Job failed'));
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

  // Validate song file
  validateSongFile(file: File): void {
    const { MAX_SIZE, ALLOWED_TYPES, ALLOWED_EXTENSIONS } = FILE_CONSTRAINTS.SONG;

    // Check file size
    if (file.size > MAX_SIZE) {
      throw new Error(`File size must be less than ${MAX_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    const fileType = file.type as typeof ALLOWED_TYPES[number];
    if (!ALLOWED_TYPES.includes(fileType)) {
      throw new Error(`File type must be one of: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Check file extension as fallback
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}` as typeof ALLOWED_EXTENSIONS[number];
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(`File extension must be one of: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }
  },

  // Get step description for UI display
  getStepDescription(step: CoverJob['current_step']): string {
    const descriptions: Record<CoverJob['current_step'], string> = {
      downloading: 'Downloading source song...',
      separating: 'Separating vocals from instrumentals...',
      converting: 'Converting vocals to your voice...',
      mixing: 'Mixing final cover...',
      complete: 'Cover generation complete!',
    };
    return descriptions[step];
  },
};