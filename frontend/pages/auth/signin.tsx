import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
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
    e.preventDefault();
    e.stopPropagation();
    
    setError(null);
    setIsLoading(true);

    console.log('🔐 Attempting sign in...');
    console.log('Email:', formData.email);

    try {
      const result = await authService.signin({
        username: formData.email,
        password: formData.password,
      });

      console.log('✅ Sign in successful!');
      console.log('🔑 Access token:', result.access_token.substring(0, 30) + '...');
      console.log('🔄 Refresh token:', result.refresh_token.substring(0, 30) + '...');
      
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
    <div className={css({ minH: 'screen', display: 'flex' })}>
      {/* Left Panel */}
      <div className={css({
        display: { base: 'none', lg: 'flex' },
        w: { lg: '1/2' },
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        bg: 'cayenne',
        minH: 'screen'
      })}>
        <div className={css({ position: 'relative', zIndex: 10, px: 16, maxW: '3xl' })}>
          <h2 className={css({
            color: 'white',
            lineHeight: 'none',
            mb: 8,
            fontSize: 'clamp(72px, 10vw, 144px)',
            fontWeight: 900,
            letterSpacing: '-0.04em'
          })}>
            WELCOME<br/>
            BACK
          </h2>
          <p className={css({ 
            color: 'white',
            fontSize: '2xl',
            fontWeight: 'medium',
            opacity: 0.9
          })}>
            Your voice. Your studio.<br/>
            Pick up where you left off.
          </p>
        </div>

        <svg 
          className={css({ position: 'absolute', bottom: 0, right: 0, opacity: 0.2 })}
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

        <div className={css({ 
          position: 'absolute',
          bottom: 12,
          right: 12,
          display: 'flex',
          gap: 3
        })}>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={css({
                w: 3,
                h: 3,
                rounded: 'full',
                bg: 'white',
                opacity: i === 0 ? 1 : 0.3
              })}
            />
          ))}
        </div>
      </div>
      {/* Right Panel */}
      <div className={flex({ 
        w: { base: 'full', lg: '1/2' },
        bg: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        p: { base: 8, lg: 12 }
      })}>
        <div className={css({ w: 'full', maxW: '360px' })}>
          <Link href="/" className={css({ 
            display: 'inline-block',
            color: 'gray.600',
            fontSize: 'sm',
            mb: 12,
            _hover: { color: 'cayenne' },
            transition: 'colors'
          })}>
            ← Back
          </Link>

          <div className={css({ mb: 10 })}>
            <h1 className={css({ 
              fontSize: '5xl',
              fontWeight: 'extrabold',
              color: 'gray.900',
              lineHeight: 'tight'
            })}>
              Sign In
            </h1>
          </div>

          {error && (
            <div className={css({ 
              bg: 'red.50',
              borderLeft: '4px solid',
              borderColor: 'red.500',
              p: 4,
              mb: 6
            })}>
              <p className={css({ color: 'red.800', fontSize: 'sm', fontWeight: 'medium' })}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className={css({ display: 'flex', flexDir: 'column', gap: 5 })}>
            <div>
              <label htmlFor="email" className={css({ 
                display: 'block',
                fontSize: 'sm',
                fontWeight: 'semibold',
                color: 'gray.900',
                mb: 2
              })}>
                Email or Username
              </label>
              <input
                type="text" 
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={css({
                  w: 'full',
                  px: 4,
                  py: 3,
                  border: '2px solid',
                  borderColor: 'gray.200',
                  rounded: 'lg',
                  color: 'gray.900',
                  fontSize: 'base',
                  _focus: { borderColor: 'cayenne', outline: 'none' },
                  transition: 'colors'
                })}
                placeholder="username or email"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <div className={flex({ 
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
              })}>
                <label htmlFor="password" className={css({ 
                  display: 'block',
                  fontSize: 'sm',
                  fontWeight: 'semibold',
                  color: 'gray.900'
                })}>
                  Password
                </label>
                <Link href="#" className={css({ 
                  fontSize: 'xs',
                  color: 'cayenne',
                  fontWeight: 'medium',
                  _hover: { textDecoration: 'underline' }
                })}>
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={css({
                  w: 'full',
                  px: 4,
                  py: 3,
                  border: '2px solid',
                  borderColor: 'gray.200',
                  rounded: 'lg',
                  color: 'gray.900',
                  fontSize: 'base',
                  _focus: { borderColor: 'cayenne', outline: 'none' },
                  transition: 'colors'
                })}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={css({
                w: 'full',
                py: 4,
                bg: 'cayenne',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 'base',
                rounded: 'lg',
                mt: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                opacity: isLoading ? 0.5 : 0.95,
                _hover: { opacity: 0.9 },
                _disabled: { cursor: 'not-allowed' },
                transition: 'all'
              })}
            >
              {isLoading ? (
                <>
                  <div className={css({ 
                    animation: 'spin',
                    w: 5,
                    h: 5,
                    border: '2px solid',
                    borderColor: 'white/30',
                    borderTopColor: 'white',
                    rounded: 'full'
                  })} />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className={css({ mt: 8, textAlign: 'center' })}>
            <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
              Don't have an account?{' '}
              <Link href="/auth/signup" className={css({ 
                color: 'cayenne',
                fontWeight: 'semibold',
                _hover: { textDecoration: 'underline' }
              })}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      
    </div>
  );
}