import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="editorial-section py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand Column */}
          <div>
            <span className="text-xl font-bold text-gray-900">Parrot Core</span>
            <p className="text-gray-600 text-sm leading-relaxed mt-4">
              AI-powered voice cloning and text-to-speech studio. 
              Your voice, your control.
            </p>
          </div>

          {/* Links Column */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Studio</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/voices/new" className="text-gray-600 hover:text-cayenne transition-colors text-sm">
                  Create Voice Profile
                </Link>
              </li>
              <li>
                <Link href="/tts/new" className="text-gray-600 hover:text-cayenne transition-colors text-sm">
                  Text-to-Speech
                </Link>
              </li>
              <li>
                <Link href="/covers/new" className="text-gray-600 hover:text-cayenne transition-colors text-sm">
                  AI Song Covers
                </Link>
              </li>
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-cayenne transition-colors text-sm">
                  Get to Know Us
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-cayenne transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-cayenne transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} Parrot Core. Open source voice cloning.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-cayenne transition-colors text-sm">
              GitHub
            </a>
            <a href="#" className="text-gray-500 hover:text-cayenne transition-colors text-sm">
              Documentation
            </a>
            <a href="#" className="text-gray-500 hover:text-cayenne transition-colors text-sm">
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};