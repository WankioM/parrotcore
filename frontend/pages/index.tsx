import React from 'react';
import { StudioCard } from '@/components/StudioCard';
import { AudioVisualizer } from '../components/AudioVisualizer';

export default function Home() {
  return (
    <div className="bg-coffee">
      {/* Hero Section */}
      <section className="editorial-section py-20">
        <div className="text-center mb-16">
          <h1 className="studio-heading text-7xl lg:text-8xl mb-4">
            Parrot Core
          </h1>
          <p className="text-2xl text-white/80 mb-8">
            AI Voice Cloning & Text-to-Speech Studio
          </p>
        </div>

        {/* Single Ripple Visualizer */}
        <div className="flex justify-center mb-20">
          <AudioVisualizer 
            variant="ripple" 
            width={400} 
            height={300} 
            className="rounded-xl overflow-hidden shadow-2xl shadow-cayenne/10" 
          />
        </div>

        {/* Studio Cards */}
        <div className="creative-grid">
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