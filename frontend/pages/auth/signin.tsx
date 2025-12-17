import React, { useState } from 'react';
import Link from 'next/link';

export default function Signin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle signin logic
    console.log('Signin:', formData);
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
              Sign into your account
            </h1>
            <p className="text-white/60 text-lg">
              Enter your credentials to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-white/80 font-medium mb-2">
                Email
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-white/80 font-medium">
                  Password
                </label>
                <Link href="#" className="text-sm text-cayenne hover:underline">
                  Forgot password?
                </Link>
              </div>
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

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-cayenne text-white font-bold text-lg rounded-lg
                       hover:bg-cayenne/90 transition-all shadow-lg shadow-cayenne/30
                       active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-coffee text-white/60">Can't sign in?</span>
            </div>
          </div>

          {/* Reset Password */}
          <button
            type="button"
            className="w-full py-3 border-2 border-white/20 text-white/80 font-medium rounded-lg
                     hover:border-white/40 hover:text-white transition-all"
          >
            Reset Password
          </button>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-white/60">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-cayenne font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual (same as signup) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-twilight to-coffee overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            <div className="glitch-container">
              <div className="glitch-layer glitch-layer-1">
                <div className="glitch-content">
                  <div className="text-9xl">🎧</div>
                </div>
              </div>
              <div className="glitch-layer glitch-layer-2">
                <div className="glitch-content">
                  <div className="text-9xl">🎧</div>
                </div>
              </div>
              <div className="glitch-layer glitch-layer-3">
                <div className="glitch-content">
                  <div className="text-9xl">🎧</div>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <h2 className="text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl">
                  Welcome<br/>Back.
                </h2>
                <p className="text-white/80 text-xl max-w-md mx-auto px-6">
                  Continue your voice cloning journey
                </p>
              </div>
            </div>

            <div className="scan-lines"></div>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === 1 ? 'bg-cayenne' : 'bg-white/30'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}