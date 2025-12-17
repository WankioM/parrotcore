import React from 'react';
import { colors } from '../../lib/theme';

export default function NewCover() {
  return (
    <div style={{ padding: '2rem', backgroundColor: colors.coffeeBean, minHeight: '100vh' }}>
      <h1 style={{ color: colors.cayenneRed, fontSize: '2.5rem', fontFamily: 'Rethink Sans' }}>
        🎵 Create AI Song Cover
      </h1>
      <p style={{ color: colors.white, marginTop: '1rem' }}>
        Coming soon: Upload a song and convert it to your voice!
      </p>
    </div>
  );
}