import React from 'react';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex } from '@/styled-system/patterns';
import { authService } from '@/lib/services/auth';

export const Header: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <header className={css({ 
      bg: 'white', 
      borderBottom: '1px solid',
      borderColor: 'gray.200',
      py: { base: 2, lg: 4 }
    })}>
      <div className={css({ 
        maxW: '80rem',
        mx: 'auto',
        px: { base: 6, lg: 8 }
      })}>
        <div className={flex({ alignItems: 'center', justifyContent: 'space-between' })}>
          {/* Brand Text */}
          <Link href="/" className={css({
            color: 'gray.900',
            fontSize: 'sm',
            fontWeight: 'semibold',
            _hover: { color: 'cayenne' },
            transition: 'colors'
          })}>
            AI Voice Cloning & Text-to-Speech Studio
          </Link>

          {/* Navigation Links */}
          <div className={flex({ alignItems: 'center', gap: 6 })}>
            <Link 
              href="/voices/new" 
              className={css({
                color: 'gray.700',
                fontSize: 'sm',
                fontWeight: 'medium',
                _hover: { color: 'cayenne' },
                transition: 'colors'
              })}
            >
              Voices
            </Link>
            <Link 
              href="/tts/new" 
              className={css({
                color: 'gray.700',
                fontSize: 'sm',
                fontWeight: 'medium',
                _hover: { color: 'cayenne' },
                transition: 'colors'
              })}
            >
              Text-to-Speech
            </Link>
            <Link 
              href="/covers/new" 
              className={css({
                color: 'gray.700',
                fontSize: 'sm',
                fontWeight: 'medium',
                _hover: { color: 'cayenne' },
                transition: 'colors'
              })}
            >
              Covers
            </Link>
            <Link 
              href="/about" 
              className={css({
                color: 'gray.700',
                fontSize: 'sm',
                fontWeight: 'medium',
                _hover: { color: 'cayenne' },
                transition: 'colors'
              })}
            >
              About
            </Link>
            
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className={css({
                  color: 'gray.700',
                  fontSize: 'sm',
                  fontWeight: 'medium',
                  _hover: { color: 'cayenne' },
                  transition: 'colors'
                })}
              >
                Logout
              </button>
            ) : (
              <>
                <Link 
                  href="/auth/signin" 
                  className={css({
                    color: 'gray.700',
                    fontSize: 'sm',
                    fontWeight: 'medium',
                    _hover: { color: 'cayenne' },
                    transition: 'colors'
                  })}
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className={css({
                    px: 6,
                    py: 2,
                    bg: 'cayenne',
                    color: 'white',
                    fontWeight: 'semibold',
                    rounded: 'lg',
                    fontSize: 'sm',
                    opacity: 0.95,
                    _hover: { opacity: 0.9 },
                    transition: 'all',
                    shadow: 'sm'
                  })}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}