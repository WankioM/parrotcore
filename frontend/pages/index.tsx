import React from 'react';
import Link from 'next/link';
import { AudioGradient } from '../components/AudioGradient';
import { colors } from '../lib/theme';

export default function Home() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
            <h1 style={styles.title}>Parrot Core</h1>
            <p style={styles.subtitle}>AI Voice Cloning & Text-to-Speech</p>
            <Link href="/about" style={styles.aboutLink}>
                Get to Know Us →
            </Link>
            </header>

      <div style={styles.gradientShowcase}>
        <AudioGradient variant="wave" size={120} />
        <AudioGradient variant="ripple" size={120} />
        <AudioGradient variant="pulse" size={120} />
        <AudioGradient variant="echo" size={120} />
      </div>

      <div style={styles.cardGrid}>
        <Link href="/voices/new" style={styles.card}>
          <h2 style={styles.cardTitle}>🎤 Create Voice Profile</h2>
          <p style={styles.cardDesc}>Upload voice samples to clone your voice</p>
        </Link>

        <Link href="/tts/new" style={styles.card}>
          <h2 style={styles.cardTitle}>💬 Text-to-Speech</h2>
          <p style={styles.cardDesc}>Convert text to speech using your cloned voice</p>
        </Link>

        <Link href="/covers/new" style={styles.card}>
          <h2 style={styles.cardTitle}>🎵 AI Song Covers</h2>
          <p style={styles.cardDesc}>Create song covers in your voice</p>
        </Link>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: colors.coffeeBean,
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  title: {
    fontSize: '4rem',
    fontWeight: 800,
    color: colors.cayenneRed,
    marginBottom: '0.5rem',
    fontFamily: 'Rethink Sans, sans-serif',
  },
  subtitle: {
    fontSize: '1.5rem',
    color: colors.white,
    opacity: 0.8,
  },
  gradientShowcase: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '4rem',
    flexWrap: 'wrap',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: colors.deepTwilight,
    padding: '2rem',
    borderRadius: '12px',
    border: `2px solid ${colors.cayenneRed}`,
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
    textDecoration: 'none',
  },
  cardTitle: {
    fontSize: '1.8rem',
    color: colors.white,
    marginBottom: '1rem',
    fontFamily: 'Rethink Sans, sans-serif',
  },
  cardDesc: {
    fontSize: '1rem',
    color: colors.white,
    opacity: 0.7,
  },
  aboutLink: {
  display: 'inline-block',
  marginTop: '1rem',
  fontSize: '1rem',
  color: colors.cayenneRed,
  textDecoration: 'none',
  fontWeight: 600,
  transition: 'opacity 0.2s',
},
};