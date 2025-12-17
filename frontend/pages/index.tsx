import React from 'react';
import { StudioCard } from '@/components/StudioCard';
import { AudioVisualizer } from '../components/AudioVisualizer';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="editorial-section py-20">
        <div className="text-center mb-16">
          
          <p className="text-2xl text-gray-600 mb-8">
            AI Voice Cloning & Text-to-Speech Studio
          </p>
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