// components/voices/VoiceReadyBanner.tsx
import React from 'react';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
import { VoiceProfile } from '@/lib/types/api';
import { canUseTTS, canUseCovers } from '@/lib/utils/voiceHelpers';

interface VoiceReadyBannerProps {
  profile: VoiceProfile;
}

export default function VoiceReadyBanner({ profile }: VoiceReadyBannerProps) {
  const ttsReady = canUseTTS(profile);
  const coversReady = canUseCovers(profile);

  if (!ttsReady && !coversReady) {
    return null;
  }

  return (
    <div className={css({ 
      bg: 'green.50',
      border: '2px solid',
      borderColor: 'green.300',
      rounded: 'xl',
      p: 6,
      mb: 8
    })}>
      <h3 className={css({ 
        fontWeight: 'bold',
        color: 'green.900',
        mb: 2,
        fontSize: 'lg'
      })}>
        ✅ {ttsReady && coversReady ? 'Both Voices Ready!' : 
            ttsReady ? 'Speaking Voice Ready!' : 
            'Singing Voice Ready!'}
      </h3>
      <p className={css({ color: 'green.800', mb: 4 })}>
        {ttsReady && coversReady 
          ? 'Your voices have been successfully trained. You can now create text-to-speech and AI covers!'
          : ttsReady 
          ? 'Your speaking voice is ready for text-to-speech generation.'
          : 'Your singing voice is ready for creating AI covers.'
        }
      </p>
      <div className={flex({ gap: 3, flexWrap: 'wrap' })}>
        {ttsReady && (
          <Link 
            href="/tts/new"
            className={css({ 
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
            🎤 Try Text-to-Speech →
          </Link>
        )}
        {coversReady && (
          <Link 
            href="/covers/new"
            className={css({ 
              px: 5,
              py: 2,
              border: '2px solid',
              borderColor: 'green.600',
              color: 'green.700',
              fontWeight: 'semibold',
              rounded: 'lg',
              fontSize: 'sm',
              _hover: { bg: 'green.50' },
              transition: 'all'
            })}
          >
            🎵 Create AI Cover →
          </Link>
        )}
      </div>
    </div>
  );
}