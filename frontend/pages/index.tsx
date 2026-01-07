import React from 'react';
import { css } from '@/styled-system/css';
import { StudioCard } from '@/components/StudioCard';

export default function Home() {
  return (
    <div className={css({ bg: 'white' })}>
      {/* Hero Section */}
      <section className={css({ 
        maxW: '80rem',
        mx: 'auto',
        px: { base: 6, lg: 8 },
        py: 20
      })}>
        <div className={css({ textAlign: 'center', mb: 16 })}>
          <p className={css({ 
            fontSize: '2xl',
            color: 'gray.600',
            mb: 8
          })}>
            AI Voice Cloning & Text-to-Speech Studio
          </p>
        </div>

        {/* Studio Cards */}
        <div className={css({
          display: 'grid',
          gridTemplateColumns: { base: 1, md: 2, lg: 3 },
          gap: 6
        })}>
          <StudioCard 
            href="/voices/new"
            icon="🎤"
            title="Create Voice Profile"
            description="Upload voice samples to clone your unique voice signature."
          />
          
          <StudioCard 
            href="/tts/new"
            icon="💬"
            title="Text-to-Speech"
            description="Convert any text to speech using your cloned voice."
          />
          
          <StudioCard 
            href="/covers/new"
            icon="🎵"
            title="AI Song Covers"
            description="Transform songs into covers performed in your voice."
            variant="featured"
          />
        </div>
      </section>
    </div>
  );
}