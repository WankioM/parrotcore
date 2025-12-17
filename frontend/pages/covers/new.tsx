import React from 'react';
import Link from 'next/link';
import { colors } from '../../lib/theme';

export default function NewCover() {
  return (
    <div className="min-h-screen bg-coffee py-12">
      <div className="editorial-section">
        <h1 className="studio-heading text-5xl mb-8">
          🎵 Create AI Song Cover
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Option 1: Browse Recommendations */}
          <Link 
            href="/songs/recommended"
            className="studio-card group"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🎵</div>
              <h2 className="studio-heading text-3xl mb-3">
                Browse Song Library
              </h2>
              <p className="text-white/70 text-lg">
                Choose from our curated collection of popular songs
              </p>
            </div>
          </Link>

          {/* Option 2: Upload Your Own */}
          <div className="studio-card group opacity-60">
            <div className="text-center">
              <div className="text-6xl mb-4">📤</div>
              <h2 className="studio-heading text-3xl mb-3">
                Upload Your Song
              </h2>
              <p className="text-white/70 text-lg">
                Coming soon: Upload any song file
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}