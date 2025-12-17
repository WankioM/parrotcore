import React from 'react';
import Link from 'next/link';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="editorial-section py-6">
        <div className="flex items-center justify-between">
          {/* Brand Text Only */}
          <Link href="/" className="group">
            <span className="text-gray-900 text-sm font-semibold transition-colors">
              AI Voice Cloning & Text-to-Speech Studio
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link 
              href="/voices/new" 
              className="text-gray-700 hover:text-cayenne transition-colors font-medium text-sm"
            >
              Voices
            </Link>
            <Link 
              href="/tts/new" 
              className="text-gray-700 hover:text-cayenne transition-colors font-medium text-sm"
            >
              Text-to-Speech
            </Link>
            <Link 
              href="/covers/new" 
              className="text-gray-700 hover:text-cayenne transition-colors font-medium text-sm"
            >
              Covers
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-cayenne transition-colors font-medium text-sm"
            >
              About
            </Link>
            <Link 
              href="/auth/signin" 
              className="text-gray-700 hover:text-cayenne transition-colors font-medium text-sm"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-6 py-2 bg-cayenne text-white font-semibold rounded-lg text-sm
                       hover:bg-cayenne transition-all shadow-sm"
              style={{ opacity: 0.95 }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};