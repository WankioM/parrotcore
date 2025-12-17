import React from 'react';
import Link from 'next/link';

export const Header: React.FC = () => {
  return (
    <header className="bg-coffee border-b border-cayenne/20">
      <nav className="editorial-section py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-cayenne flex items-center justify-center">
              <span className="text-2xl">🦜</span>
            </div>
            <span className="studio-heading text-3xl group-hover:text-cayenne/80 transition-colors">
              Parrot Core
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            <Link 
              href="/voices/new" 
              className="text-white/80 hover:text-cayenne transition-colors font-medium"
            >
              Voices
            </Link>
            <Link 
              href="/tts/new" 
              className="text-white/80 hover:text-cayenne transition-colors font-medium"
            >
              Text-to-Speech
            </Link>
            <Link 
              href="/covers/new" 
              className="text-white/80 hover:text-cayenne transition-colors font-medium"
            >
              Covers
            </Link>
            <Link 
              href="/about" 
              className="text-white/80 hover:text-cayenne transition-colors font-medium"
            >
              About
            </Link>
              <Link 
              href="/auth/signin" 
              className="text-white/80 hover:text-cayenne transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-6 py-2 bg-cayenne text-white font-semibold rounded-lg 
                      hover:bg-cayenne/90 transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};