import React from 'react';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex, grid } from '@/styled-system/patterns';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={css({ 
      bg: 'gray.50', 
      borderTop: '1px solid',
      borderColor: 'gray.200',
      mt: 'auto'
    })}>
      <div className={css({ 
        maxW: '80rem',
        mx: 'auto',
        px: { base: 6, lg: 8 },
        py: 12
      })}>
        <div className={grid({ 
          columns: { base: 1, md: 3 }, 
          gap: 12 
        })}>
          {/* Brand Column */}
          <div>
            <span className={css({ 
              fontSize: 'xl', 
              fontWeight: 'bold', 
              color: 'gray.900' 
            })}>
              Parrot Core
            </span>
            <p className={css({ 
              color: 'gray.600', 
              fontSize: 'sm', 
              lineHeight: 'relaxed', 
              mt: 4 
            })}>
              AI-powered voice cloning and text-to-speech studio. 
              Your voice, your control.
            </p>
          </div>

          {/* Links Column */}
          <div>
            <h3 className={css({ 
              fontWeight: 'bold', 
              color: 'gray.900', 
              mb: 4 
            })}>
              Studio
            </h3>
            <ul className={css({ display: 'flex', flexDir: 'column', gap: 2 })}>
              <li>
                <Link 
                  href="/voices/new" 
                  className={css({
                    color: 'gray.600',
                    fontSize: 'sm',
                    _hover: { color: 'cayenne' },
                    transition: 'colors'
                  })}
                >
                  Create Voice Profile
                </Link>
              </li>
              <li>
                <Link 
                  href="/tts/new" 
                  className={css({
                    color: 'gray.600',
                    fontSize: 'sm',
                    _hover: { color: 'cayenne' },
                    transition: 'colors'
                  })}
                >
                  Text-to-Speech
                </Link>
              </li>
              <li>
                <Link 
                  href="/covers/new" 
                  className={css({
                    color: 'gray.600',
                    fontSize: 'sm',
                    _hover: { color: 'cayenne' },
                    transition: 'colors'
                  })}
                >
                  AI Song Covers
                </Link>
              </li>
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <h3 className={css({ 
              fontWeight: 'bold', 
              color: 'gray.900', 
              mb: 4 
            })}>
              About
            </h3>
            <ul className={css({ display: 'flex', flexDir: 'column', gap: 2 })}>
              <li>
                <Link 
                  href="/about" 
                  className={css({
                    color: 'gray.600',
                    fontSize: 'sm',
                    _hover: { color: 'cayenne' },
                    transition: 'colors'
                  })}
                >
                  Get to Know Us
                </Link>
              </li>
              <li>
                <a 
                  href="#" 
                  className={css({
                    color: 'gray.600',
                    fontSize: 'sm',
                    _hover: { color: 'cayenne' },
                    transition: 'colors'
                  })}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={css({
                    color: 'gray.600',
                    fontSize: 'sm',
                    _hover: { color: 'cayenne' },
                    transition: 'colors'
                  })}
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={css({
          mt: 12,
          pt: 8,
          borderTop: '1px solid',
          borderColor: 'gray.200'
        })}>
          <div className={flex({ 
            flexDir: { base: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 4
          })}>
            <p className={css({ color: 'gray.500', fontSize: 'sm' })}>
              © {currentYear} Parrot Core. Open source voice cloning.
            </p>
            <div className={flex({ gap: 6 })}>
              <a 
                href="#" 
                className={css({
                  color: 'gray.500',
                  fontSize: 'sm',
                  _hover: { color: 'cayenne' },
                  transition: 'colors'
                })}
              >
                GitHub
              </a>
              <a 
                href="#" 
                className={css({
                  color: 'gray.500',
                  fontSize: 'sm',
                  _hover: { color: 'cayenne' },
                  transition: 'colors'
                })}
              >
                Documentation
              </a>
              <a 
                href="#" 
                className={css({
                  color: 'gray.500',
                  fontSize: 'sm',
                  _hover: { color: 'cayenne' },
                  transition: 'colors'
                })}
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};