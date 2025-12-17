import React from 'react';
import Link from 'next/link';
import { AudioGradient } from '../components/AudioGradient';
import { colors } from '../lib/theme';

export default function About() {
  return (
    <div style={styles.container}>
      <div style={styles.splitScreen}>
        {/* Left side - Text content with yellow/orange background */}
        <div style={styles.leftPanel}>
          <div style={styles.header}>
            <h1 style={styles.mainTitle}>GET TO<br/>KNOW US</h1>
          </div>
          
          <div style={styles.contentGrid}>
            <div style={styles.textBlock}>
              <h3 style={styles.sectionTitle}>What We Do</h3>
              <p style={styles.bodyText}>
                Parrot Core is an AI-powered voice cloning platform that lets you create 
                realistic text-to-speech in your own voice, or transform songs into AI covers. 
                Built with cutting-edge neural networks and audio processing.
              </p>
            </div>

            <div style={styles.textBlock}>
              <h3 style={styles.sectionTitle}>Why We Built This</h3>
              <p style={styles.bodyText}>
                Voice is personal. We believe everyone should have control over their digital 
                voice identity. Whether you're a content creator, musician, or just curious 
                about AI - Parrot Core makes voice cloning accessible.
              </p>
            </div>

            <div style={styles.textBlock}>
              <h3 style={styles.sectionTitle}>The Technology</h3>
              <p style={styles.bodyText}>
                We use Chatterbox TTS for speech synthesis, RVC for voice conversion, and 
                Demucs for vocal separation. Everything runs on your infrastructure with 
                complete privacy control.
              </p>
            </div>

            <div style={styles.textBlock}>
              <h3 style={styles.sectionTitle}>Open Source</h3>
              <p style={styles.bodyText}>
                Parrot Core is built in the open. We believe in transparency, privacy, and 
                giving users full control over their voice data. Your voice, your rules.
              </p>
            </div>
          </div>

          <div style={styles.footer}>
            <Link href="/" style={styles.backLink}>← Back Home</Link>
            <div style={styles.gradientRow}>
              <AudioGradient variant="pulse" size={40} />
              <AudioGradient variant="echo" size={40} />
              <AudioGradient variant="wave" size={40} />
            </div>
          </div>
        </div>

        {/* Right side - Visual with gradient */}
        <div style={styles.rightPanel}>
          <div style={styles.visualContent}>
            <AudioGradient variant="echo" size={300} />
            <div style={styles.visualOverlay}>
              <h2 style={styles.visualText}>
                Your Voice.<br/>
                Your AI.<br/>
                Your Control.
              </h2>
            </div>
          </div>
          
          {/* Bottom right corner badge */}
          <div style={styles.badge}>
            <span style={styles.badgeText}>Parrot<br/>Core</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.coffeeBean,
    fontFamily: 'Rethink Sans, sans-serif',
  },
  splitScreen: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'row',
  },
  // LEFT PANEL - Yellow/Orange with text
  leftPanel: {
    flex: 1,
    backgroundColor: colors.cayenneRed,
    padding: '4rem',
    display: 'flex',
    flexDirection: 'column',
    color: colors.coffeeBean,
    position: 'relative',
  },
  header: {
    marginBottom: '3rem',
  },
  mainTitle: {
    fontSize: '4.5rem',
    fontWeight: 800,
    lineHeight: '1.1',
    color: colors.coffeeBean,
    letterSpacing: '-0.02em',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    flex: 1,
  },
  textBlock: {
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    marginBottom: '0.75rem',
    color: colors.coffeeBean,
  },
  bodyText: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: colors.coffeeBean,
    opacity: 0.85,
  },
  footer: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '2rem',
  },
  backLink: {
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.coffeeBean,
    textDecoration: 'none',
    transition: 'opacity 0.2s',
  },
  gradientRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  // RIGHT PANEL - Dark with visual
  rightPanel: {
    flex: 1,
    backgroundColor: colors.deepTwilight,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualContent: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  },
  visualText: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: colors.white,
    lineHeight: '1.3',
    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  badge: {
    position: 'absolute',
    bottom: '2rem',
    right: '2rem',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: colors.cayenneRed,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `3px solid ${colors.white}`,
  },
  badgeText: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: colors.white,
    textAlign: 'center',
    lineHeight: '1.2',
  },
};