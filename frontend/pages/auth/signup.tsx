import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
import { authService } from '@/lib/services/auth';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await authService.signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      router.push('/');
    } catch (err: any) {
      console.error('Signup failed:', err.response?.data);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.username?.[0] ||
        err.response?.data?.email?.[0] ||
        'Failed to create account. Please try again.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className={css({ minH: 'screen', display: 'flex' })}>
      {/* Left Panel - Form */}
      <div className={flex({ 
        w: { base: 'full', lg: '1/2' },
        bg: 'coffee',
        alignItems: 'center',
        justifyContent: 'center',
        p: 8
      })}>
        <div className={css({ w: 'full', maxW: 'md' })}>
          {/* Logo/Back */}
          <Link href="/" className={flex({ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            mb: 12
          })}>
            <div className={flex({ 
              w: 10,
              h: 10,
              rounded: 'full',
              bg: 'cayenne',
              alignItems: 'center',
              justifyContent: 'center'
            })}>
              <span className={css({ fontSize: '2xl' })}>🦜</span>
            </div>
            <span className={css({ 
              fontSize: '2xl',
              fontWeight: 800,
              color: 'cayenne',
              letterSpacing: '-0.025em',
              _groupHover: { opacity: 0.8 },
              transition: 'colors'
            })}>
              Parrot Core
            </span>
          </Link>

          {/* Heading */}
          <div className={css({ mb: 10 })}>
            <h1 className={css({ 
              fontSize: '5xl',
              fontWeight: 'extrabold',
              color: 'white',
              mb: 3,
              lineHeight: 'tight'
            })}>
              Create your account
            </h1>
            <p className={css({ color: 'white/60', fontSize: 'lg' })}>
              Start cloning voices and creating AI covers
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className={css({ 
              bg: 'red.500/10',
              borderLeft: '4px solid',
              borderColor: 'red.500',
              p: 4,
              mb: 6
            })}>
              <p className={css({ color: 'red.400', fontSize: 'sm', fontWeight: 'medium' })}>
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={css({ display: 'flex', flexDir: 'column', gap: 6 })}>
            {/* Username Input */}
            <div>
              <label htmlFor="username" className={css({ 
                display: 'block',
                color: 'white/80',
                fontWeight: 'medium',
                mb: 2
              })}>
                Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={css({
                  w: 'full',
                  px: 4,
                  py: 3,
                  bg: 'twilight/50',
                  border: '2px solid',
                  borderColor: 'white/10',
                  rounded: 'lg',
                  color: 'white',
                  _placeholder: { color: 'white/40' },
                  _focus: { borderColor: 'cayenne', outline: 'none' },
                  transition: 'colors'
                })}
                placeholder="johndoe"
                required
                disabled={isLoading}
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className={css({ 
                display: 'block',
                color: 'white/80',
                fontWeight: 'medium',
                mb: 2
              })}>
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={css({
                  w: 'full',
                  px: 4,
                  py: 3,
                  bg: 'twilight/50',
                  border: '2px solid',
                  borderColor: 'white/10',
                  rounded: 'lg',
                  color: 'white',
                  _placeholder: { color: 'white/40' },
                  _focus: { borderColor: 'cayenne', outline: 'none' },
                  transition: 'colors'
                })}
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className={css({ 
                display: 'block',
                color: 'white/80',
                fontWeight: 'medium',
                mb: 2
              })}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={css({
                  w: 'full',
                  px: 4,
                  py: 3,
                  bg: 'twilight/50',
                  border: '2px solid',
                  borderColor: 'white/10',
                  rounded: 'lg',
                  color: 'white',
                  _placeholder: { color: 'white/40' },
                  _focus: { borderColor: 'cayenne', outline: 'none' },
                  transition: 'colors'
                })}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className={css({ 
                display: 'block',
                color: 'white/80',
                fontWeight: 'medium',
                mb: 2
              })}>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={css({
                  w: 'full',
                  px: 4,
                  py: 3,
                  bg: 'twilight/50',
                  border: '2px solid',
                  borderColor: 'white/10',
                  rounded: 'lg',
                  color: 'white',
                  _placeholder: { color: 'white/40' },
                  _focus: { borderColor: 'cayenne', outline: 'none' },
                  transition: 'colors'
                })}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {/* Terms */}
            <div className={flex({ alignItems: 'flex-start', gap: 3 })}>
              <input
                type="checkbox"
                id="terms"
                className={css({ mt: 1, w: 4, h: 4, accentColor: 'cayenne' })}
                required
                disabled={isLoading}
              />
              <label htmlFor="terms" className={css({ color: 'white/60', fontSize: 'sm' })}>
                I agree to the{' '}
                <Link href="#" className={css({ 
                  color: 'cayenne',
                  _hover: { textDecoration: 'underline' }
                })}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className={css({ 
                  color: 'cayenne',
                  _hover: { textDecoration: 'underline' }
                })}>
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={css({
                w: 'full',
                py: 4,
                bg: 'cayenne',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 'lg',
                rounded: 'lg',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                shadow: 'lg',
                shadowColor: 'cayenne/30',
                _hover: { opacity: 0.9 },
                _active: { transform: 'scale(0.98)' },
                _disabled: { opacity: 0.5, cursor: 'not-allowed' },
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className={css({ mt: 8, textAlign: 'center' })}>
            <p className={css({ color: 'white/60' })}>
              Already have an account?{' '}
              <Link href="/auth/signin" className={css({ 
                color: 'cayenne',
                fontWeight: 'semibold',
                _hover: { textDecoration: 'underline' }
              })}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className={css({
        display: { base: 'none', lg: 'block' },
        w: { lg: '1/2' },
        position: 'relative',
        background: 'linear-gradient(to bottom right, token(colors.twilight), token(colors.coffee))',
        overflow: 'hidden'
      })}>
        <div className={flex({ 
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center'
        })}>
          <div className={css({ 
            position: 'relative',
            w: 'full',
            h: 'full',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          })}>
            <div className={css({ textAlign: 'center' })}>
              <h2 className={css({ 
                fontSize: '6xl',
                fontWeight: 'extrabold',
                color: 'white',
                mb: 6,
                lineHeight: 'tight',
                filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))'
              })}>
                Your Voice.<br/>
                Amplified.
              </h2>
              <p className={css({ 
                color: 'white/80',
                fontSize: 'xl',
                maxW: 'md',
                mx: 'auto',
                px: 6
              })}>
                Join thousands creating AI voices, covers, and content with cutting-edge technology
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Dots */}
        <div className={flex({ 
          position: 'absolute',
          bottom: 8,
          right: 8,
          gap: 2
        })}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={css({
                w: 2,
                h: 2,
                rounded: 'full',
                bg: i === 0 ? 'cayenne' : 'white/30'
              })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}