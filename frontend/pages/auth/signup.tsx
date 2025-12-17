import React, { useState } from 'react';
import Link from 'next/link';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle signup logic
    console.log('Signup:', formData);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 bg-coffee flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo/Back */}
          <Link href="/" className="inline-flex items-center gap-2 mb-12 group">
            <div className="w-10 h-10 rounded-full bg-cayenne flex items-center justify-center">
              <span className="text-2xl">🦜</span>
            </div>
            <span className="studio-heading text-2xl group-hover:text-cayenne/80 transition-colors">
              Parrot Core
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-10">
            <h1 className="text-5xl font-extrabold text-white mb-3 leading-tight">
              Create your account
            </h1>
            <p className="text-white/60 text-lg">
              Start cloning voices and creating AI covers
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-white/80 font-medium mb-2">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-twilight/50 border-2 border-white/10 
                         rounded-lg text-white placeholder-white/40
                         focus:border-cayenne focus:outline-none transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-white/80 font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-twilight/50 border-2 border-white/10 
                         rounded-lg text-white placeholder-white/40
                         focus:border-cayenne focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-white/80 font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-twilight/50 border-2 border-white/10 
                         rounded-lg text-white placeholder-white/40
                         focus:border-cayenne focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-4 h-4 accent-cayenne"
                required
              />
              <label htmlFor="terms" className="text-white/60 text-sm">
                I agree to the{' '}
                <Link href="#" className="text-cayenne hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-cayenne hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-cayenne text-white font-bold text-lg rounded-lg
                       hover:bg-cayenne/90 transition-all shadow-lg shadow-cayenne/30
                       active:scale-[0.98]"
            >
              Create Account
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-white/60">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-cayenne font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-twilight to-coffee overflow-hidden">
        {/* Glitch Effect Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Main Image Layer */}
            <div className="glitch-container">
              <div className="glitch-layer glitch-layer-1">
                <div className="glitch-content">
                  <div className="text-9xl">🎤</div>
                </div>
              </div>
              <div className="glitch-layer glitch-layer-2">
                <div className="glitch-content">
                  <div className="text-9xl">🎤</div>
                </div>
              </div>
              <div className="glitch-layer glitch-layer-3">
                <div className="glitch-content">
                  <div className="text-9xl">🎤</div>
                </div>
              </div>
            </div>

            {/* Overlay Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <h2 className="text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl">
                  Your Voice.<br/>
                  Amplified.
                </h2>
                <p className="text-white/80 text-xl max-w-md mx-auto px-6">
                  Join thousands creating AI voices, covers, and content with cutting-edge technology
                </p>
              </div>
            </div>

            {/* Scan Lines Effect */}
            <div className="scan-lines"></div>
          </div>
        </div>

        {/* Bottom Dots */}
        <div className="absolute bottom-8 right-8 flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === 0 ? 'bg-cayenne' : 'bg-white/30'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}