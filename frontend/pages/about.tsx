import React from 'react';
import { css } from '@/styled-system/css';
import { flex, grid } from '@/styled-system/patterns';

export default function About() {
  return (
    <div className={flex({ 
      flexDir: { base: 'column', lg: 'row' }
    })}>
      {/* Left Panel */}
      <div className={css({ 
        w: { base: 'full', lg: '1/2' },
        bg: 'cayenne',
        color: 'white',
        p: { base: 12, lg: 16 },
        display: 'flex',
        flexDir: 'column'
      })}>
        <h1 className={css({ 
          fontSize: { base: '6xl', lg: '7xl' },
          fontWeight: 'extrabold',
          mb: 12,
          lineHeight: 'tight'
        })}>
          GET TO<br/>
          KNOW US
        </h1>
        
        <div className={grid({ 
          columns: { base: 1, md: 2 },
          gap: 8,
          flex: 1
        })}>
          <div>
            <h3 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 3 })}>
              What We Do
            </h3>
            <p className={css({ opacity: 0.85, lineHeight: 'relaxed' })}>
              Parrot Core is an AI-powered voice cloning platform that lets you create 
              realistic text-to-speech in your own voice, or transform songs into AI covers.
            </p>
          </div>

          <div>
            <h3 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 3 })}>
              Why We Built This
            </h3>
            <p className={css({ opacity: 0.85, lineHeight: 'relaxed' })}>
              Voice is personal. We believe everyone should have control over their digital 
              voice identity.
            </p>
          </div>

          <div>
            <h3 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 3 })}>
              The Technology
            </h3>
            <p className={css({ opacity: 0.85, lineHeight: 'relaxed' })}>
              We use Chatterbox TTS, RVC for voice conversion, and Demucs for vocal separation.
            </p>
          </div>

          <div>
            <h3 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: 3 })}>
              Open Source
            </h3>
            <p className={css({ opacity: 0.85, lineHeight: 'relaxed' })}>
              Built in the open. Your voice, your rules.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className={css({ 
        w: { base: 'full', lg: '1/2' },
        bg: 'twilight',
        minH: { base: '50vh', lg: 'screen' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      })}>
        {/* Background Pattern */}
        <svg 
          className={css({ 
            position: 'absolute',
            inset: 0,
            w: 'full',
            h: 'full',
            opacity: 0.1
          })}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>

        {/* Main Content */}
        <div className={flex({ 
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          h: 'full',
          w: 'full',
          pointerEvents: 'none'
        })}>
          <h2 className={css({ 
            fontSize: '5xl',
            fontWeight: 'extrabold',
            textAlign: 'center',
            lineHeight: 'tight',
            color: 'white',
            filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))'
          })}>
            Your Voice.<br/>
            Your AI.<br/>
            Your Control.
          </h2>
        </div>
        
        {/* Badge */}
        <div className={flex({ 
          position: 'absolute',
          bottom: 8,
          right: 8,
          w: 20,
          h: 20,
          rounded: 'full',
          bg: 'cayenne',
          border: '4px solid',
          borderColor: 'white',
          alignItems: 'center',
          justifyContent: 'center'
        })}>
          <span className={css({ 
            color: 'white',
            fontWeight: 'extrabold',
            fontSize: 'xs',
            textAlign: 'center',
            lineHeight: 'tight'
          })}>
            Parrot<br/>Core
          </span>
        </div>
      </div>
    </div>
  );
}