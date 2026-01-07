import { apiClient } from '../api';
import { TTSJob, CreateTTSJobRequest } from '../types/api';

export const ttsService = {
  // Get all TTS jobs
  async getTTSJobs(): Promise<TTSJob[]> {
    const response = await apiClient.get('/tts/');
    return response.data;
  },

  // Get single TTS job with audio file if completed
  async getTTSJob(id: string): Promise<TTSJob> {
    const response = await apiClient.get(`/tts/${id}/`);
    return response.data;
  },

  // Create new TTS job
  async createTTSJob(data: CreateTTSJobRequest): Promise<TTSJob> {
    const response = await apiClient.post('/tts/', data);
    return response.data;
  },

  // Poll job status until complete or failed
  async pollJobStatus(
    jobId: string,
    onProgress?: (job: TTSJob) => void,
    pollInterval: number = 2000
  ): Promise<TTSJob> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const job = await this.getTTSJob(jobId);
          
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
};