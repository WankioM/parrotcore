// ============================================================================
// Common Types
// ============================================================================

export type JobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
export type VoiceProfileStatus = 'pending' | 'enrolling' | 'ready' | 'failed';
export type CoverStep = 'downloading' | 'separating' | 'converting' | 'mixing' | 'complete';

export interface ErrorResponse {
  error: string;
  detail?: string;
}

export interface AudioFile {
  id: string;
  format: 'wav' | 'mp3' | 'flac';
  duration_seconds: number;
  sample_rate: number;
  file_size_bytes: number;
  created_at: string;
  download_url: string;
}

// ============================================================================
// Voice Profile Types
// ============================================================================

export interface VoiceSample {
  id: string;
  original_filename: string;
  duration_seconds: number;
  file_size_bytes: number;
  sample_rate: number;
  channels: number;
  uploaded_at: string;
  download_url: string;
}

export interface EnrollmentJob {
  id: string;
  status: JobStatus;
  progress_percent: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description?: string;
  status: VoiceProfileStatus;
  sample_count: number;
  total_duration: number;
  created_at: string;
  updated_at: string;
  samples: VoiceSample[];
  latest_enrollment: EnrollmentJob | null;
}

export interface CreateVoiceProfileRequest {
  name: string;
  description?: string;
}

export interface UploadVoiceSampleResponse extends VoiceSample {}

// ============================================================================
// TTS Types
// ============================================================================

export interface TTSJob {
  id: string;
  voice_profile: string; // UUID
  voice_profile_name: string;
  input_text: string;
  status: JobStatus;
  progress_percent: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  audio: AudioFile | null;
}

export interface CreateTTSJobRequest {
  voice_profile_id: string;  
  text: string;             
}

// ============================================================================
// Cover Types
// ============================================================================

export interface CoverJob {
  id: string;
  voice_profile: string; // UUID
  voice_profile_name: string;
  original_filename: string;
  pitch_shift: number;
  vocal_volume: number;
  instrumental_volume: number;
  status: JobStatus;
  progress_percent: number;
  current_step: CoverStep;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  audio: AudioFile | null;
}

export interface CreateCoverJobRequest {
  voice_profile_id: string;
  pitch_shift?: number;
  vocal_volume?: number;
  instrumental_volume?: number;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface SignupRequest {
  username: string;  
  email: string;
  password: string;
}

export interface SigninRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type OnUploadProgress = (progress: FileUploadProgress) => void;

// File validation constants
export const FILE_CONSTRAINTS = {
  VOICE_SAMPLE: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/flac'],
    ALLOWED_EXTENSIONS: ['.wav', '.mp3', '.flac'],
  },
  SONG: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_TYPES: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/flac'],
    ALLOWED_EXTENSIONS: ['.wav', '.mp3', '.flac'],
  },
} as const;

export * from './api';