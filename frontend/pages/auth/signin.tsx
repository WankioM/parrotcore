import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authService } from '@/lib/services/auth';

export default function Signin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // This prevents page reload
    e.stopPropagation(); // Extra safety
    
    setError(null);
    setIsLoading(true);

    console.log('🔐 Attempting sign in...');
    console.log('Email:', formData.email);

    try {
      const result = await authService.signin({
        email: formData.email,
        password: formData.password,
      });

      console.log('✅ Sign in successful!');
      console.log('📝 Access token:', result.access_token.substring(0, 30) + '...');
      console.log('🔄 Refresh token:', result.refresh_token.substring(0, 30) + '...');
      
      // Wait a bit so you can see the console
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🚀 Redirecting to home...');
      router.push('/');
    } catch (err: any) {
      console.error('❌ Sign in failed');
      console.error('Error details:', err.response?.data);
      
      setError(
        err.response?.data?.detail || 
        err.response?.data?.error || 
        'Invalid email or password'
      );
      setIsLoading(false);
    }
  };

  return (
    // FIXED: Changed from flex-col lg:flex-row to just flex
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-full lg:w-1/3 bg-white flex items-center justify-center p-8 lg:p-12">
        <div className="w-full" style={{ maxWidth: '360px' }}>
          <Link href="/" className="inline-block text-gray-600 hover:text-cayenne transition-colors mb-12 text-sm">
            ← Back
          </Link>

          <div className="mb-10">
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
              Sign In
            </h1>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Change label and input */}
<div>
  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
    Email or Username
  </label>
  <input
    type="text" 
    id="email"
    value={formData.email}
    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900
             focus:border-cayenne focus:outline-none transition-colors text-base"
    placeholder="username or email"
    required
    disabled={isLoading}
  />
</div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                  Password
                </label>
                <Link href="#" className="text-xs text-cayenne hover:underline font-medium">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900
                         focus:border-cayenne focus:outline-none transition-colors text-base"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-cayenne text-white font-bold text-base rounded-lg
                       hover:bg-cayenne transition-all disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-8"
              style={{ opacity: isLoading ? 0.5 : 0.95 }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-cayenne font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Side by side */}
      <div 
        className="hidden lg:flex lg:w-2/3 relative overflow-hidden items-center justify-center"
        style={{ backgroundColor: '#E55710', minHeight: '100vh' }}
      >
        <div className="relative z-10 px-16 max-w-3xl">
          <h2 
            className="text-white leading-none mb-8"
            style={{ 
              fontSize: 'clamp(80px, 11vw, 160px)',
              fontWeight: 900,
              letterSpacing: '-0.04em'
            }}
          >
            WELCOME<br/>
            BACK
          </h2>
          <p className="text-white text-2xl font-medium" style={{ opacity: 0.9 }}>
            Your voice. Your studio. <br/>Pick up where you left off.
          </p>
        </div>

        <svg 
          className="absolute bottom-0 right-0 opacity-20" 
          width="600" 
          height="400" 
          viewBox="0 0 600 400"
          style={{ transform: 'translate(10%, 10%)' }}
        >
          <rect x="0" y="120" width="60" height="160" fill="white" rx="30"/>
          <rect x="80" y="80" width="60" height="240" fill="white" rx="30"/>
          <rect x="160" y="40" width="60" height="320" fill="white" rx="30"/>
          <rect x="240" y="100" width="60" height="200" fill="white" rx="30"/>
          <rect x="320" y="60" width="60" height="280" fill="white" rx="30"/>
          <rect x="400" y="140" width="60" height="120" fill="white" rx="30"/>
          <rect x="480" y="100" width="60" height="200" fill="white" rx="30"/>
        </svg>

        <div className="absolute bottom-12 right-12 flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: 'white',
                opacity: i === 0 ? 1 : 0.3
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}