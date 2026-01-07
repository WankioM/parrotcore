// pages/voices/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex, grid } from '@/styled-system/patterns';
import { voicesService } from '@/lib/services/voices';
import { VoiceProfile, VoiceSampleType, EnrollmentJob } from '@/lib/types/api';
import VoiceTypeSection from '@/components/voices/VoiceTypeSection';
import VoiceReadyBanner from '@/components/voices/VoiceReadyBanner';

export default function VoiceDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Separate upload states for speaking and singing
  const [uploadingSpeaking, setUploadingSpeaking] = useState(false);
  const [uploadingSinging, setUploadingSinging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string>('');

  // Separate enrollment job tracking
  const [speakingJob, setSpeakingJob] = useState<EnrollmentJob | null>(null);
  const [singingJob, setSingingJob] = useState<EnrollmentJob | null>(null);

  // Load voice profile
  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    loadProfile();
  }, [id]);

  // Poll enrollment jobs
  useEffect(() => {
    if (!profile) return;

    const pollInterval = setInterval(async () => {
      try {
        let shouldRefresh = false;

        // Poll speaking job if in progress
        if (profile.speaking_status === 'enrolling') {
          const job = await voicesService.getEnrollmentJob(profile.id, 'speaking');
          setSpeakingJob(job);
          
          if (job.status === 'completed' || job.status === 'failed') {
            shouldRefresh = true;
          }
        }

        // Poll singing job if in progress
        if (profile.singing_status === 'enrolling') {
          const job = await voicesService.getEnrollmentJob(profile.id, 'singing');
          setSingingJob(job);
          
          if (job.status === 'completed' || job.status === 'failed') {
            shouldRefresh = true;
          }
        }

        // Refresh profile if any job completed/failed
        if (shouldRefresh) {
          await loadProfile();
        }
      } catch (err) {
        console.error('Failed to poll enrollment status:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [profile?.speaking_status, profile?.singing_status, profile?.id]);

  async function loadProfile() {
    try {
      setIsLoading(true);
      const data = await voicesService.getVoiceProfile(id as string);
      setProfile(data);
      
      // Load latest jobs
      if (data.latest_speaking_job) {
        setSpeakingJob(data.latest_speaking_job);
      }
      if (data.latest_singing_job) {
        setSingingJob(data.latest_singing_job);
      }
    } catch (err: any) {
      console.error('Failed to load voice profile:', err);
      setError(err.response?.data?.detail || 'Failed to load voice profile');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(files: FileList, type: VoiceSampleType) {
    if (!profile || files.length === 0) return;

    try {
      if (type === 'speaking') {
        setUploadingSpeaking(true);
      } else {
        setUploadingSinging(true);
      }

      setError(null);

      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileName(file.name);
        setUploadProgress(0);

        console.log(`📤 Uploading ${type} sample ${i + 1}/${files.length}: ${file.name}`);

        await voicesService.uploadVoiceSample(
          profile.id,
          file,
          type,
          (progress) => setUploadProgress(progress.percentage)
        );

        console.log(`✅ Uploaded ${file.name}`);
      }

      await loadProfile(); // Refresh to show new samples
      setUploadProgress(0);
      setCurrentFileName('');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload samples');
    } finally {
      setUploadingSpeaking(false);
      setUploadingSinging(false);
    }
  }

  async function handleStartEnrollment(type: VoiceSampleType) {
    if (!profile) return;

    try {
      setError(null);
      console.log(`🎓 Starting ${type} enrollment...`);
      
      const job = await voicesService.enrollVoice(profile.id, type);
      
      if (type === 'speaking') {
        setSpeakingJob(job);
      } else {
        setSingingJob(job);
      }

      await loadProfile(); // Refresh status
      console.log(`✅ ${type} enrollment started!`);
    } catch (err: any) {
      console.error('Enrollment failed:', err);
      setError(err.response?.data?.detail || 'Failed to start enrollment');
    }
  }

  async function handleDeleteSample(sampleId: string) {
    if (!profile) return;

    if (!window.confirm('Are you sure you want to delete this sample?')) {
      return;
    }

    try {
      console.log(`🗑️ Deleting sample ${sampleId}...`);
      await voicesService.deleteVoiceSample(profile.id, sampleId);
      
      console.log('✅ Sample deleted, refreshing profile...');
      await loadProfile();
    } catch (err: any) {
      console.error('Failed to delete sample:', err);
      setError(err.response?.data?.detail || 'Failed to delete sample');
    }
  }

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
        <p className={css({ color: 'gray.600' })}>
          {error || 'Voice profile not found'}
        </p>
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
      </div>
    );
  }

  const speakingSamples = voicesService.getSamplesByType(profile, 'speaking');
  const singingSamples = voicesService.getSamplesByType(profile, 'singing');

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

        {/* Header */}
        <div className={css({ mb: 8 })}>
          <h1 className={css({ 
            fontSize: { base: '4xl', lg: '5xl' },
            fontWeight: 'extrabold',
            color: 'gray.900',
            mb: 2,
            wordBreak: 'break-word'
          })}>
            {profile.name}
          </h1>
          {profile.description && (
            <p className={css({ fontSize: 'lg', color: 'gray.600' })}>
              {profile.description}
            </p>
          )}
        </div>

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
            <p className={css({ 
              color: 'red.800', 
              fontSize: 'sm', 
              fontWeight: 'medium' 
            })}>
              {error}
            </p>
          </div>
        )}

        {/* Success Banner - Show when voices are ready */}
        <VoiceReadyBanner profile={profile} />

        {/* Voice Types Grid */}
        <div className={grid({ 
          columns: { base: 1, lg: 2 }, 
          gap: 8,
          mb: 8
        })}>
          {/* Speaking Voice Section */}
          <VoiceTypeSection
            profile={profile}
            type="speaking"
            samples={speakingSamples}
            job={speakingJob}
            uploading={uploadingSpeaking}
            uploadProgress={uploadProgress}
            currentFileName={currentFileName}
            onFileUpload={handleFileUpload}
            onStartEnrollment={handleStartEnrollment}
            onDeleteSample={handleDeleteSample}
          />

          {/* Singing Voice Section */}
          <VoiceTypeSection
            profile={profile}
            type="singing"
            samples={singingSamples}
            job={singingJob}
            uploading={uploadingSinging}
            uploadProgress={uploadProgress}
            currentFileName={currentFileName}
            onFileUpload={handleFileUpload}
            onStartEnrollment={handleStartEnrollment}
            onDeleteSample={handleDeleteSample}
          />
        </div>

        {/* Info Card */}
        <div className={css({ 
          bg: 'blue.50',
          border: '2px solid',
          borderColor: 'blue.200',
          rounded: 'xl',
          p: 6
        })}>
          <h3 className={css({ 
            fontWeight: 'bold',
            color: 'blue.900',
            mb: 3,
            fontSize: 'base'
          })}>
            💡 About Voice Types
          </h3>
          <div className={grid({ columns: { base: 1, md: 2 }, gap: 4 })}>
            <div>
              <h4 className={css({ 
                fontWeight: 'semibold', 
                color: 'blue.900', 
                mb: 1,
                fontSize: 'sm'
              })}>
                🎤 Speaking Voice
              </h4>
              <p className={css({ fontSize: 'xs', color: 'blue.800' })}>
                Used for text-to-speech. Upload clear speech samples for best results.
              </p>
            </div>
            <div>
              <h4 className={css({ 
                fontWeight: 'semibold', 
                color: 'blue.900', 
                mb: 1,
                fontSize: 'sm'
              })}>
                🎵 Singing Voice
              </h4>
              <p className={css({ fontSize: 'xs', color: 'blue.800' })}>
                Used for AI covers. Upload singing samples with good vocal clarity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}