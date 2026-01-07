import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // Include your source files
  include: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  
  // Exclude files
  exclude: [],
  
  // Your custom theme
  theme: {
    extend: {
      tokens: {
        colors: {
          cayenne: { value: '#E55710' },
          coffee: { value: '#1F160A' },
          twilight: { value: '#251A66' },
        },
        fonts: {
          sans: { value: "'Rethink Sans', sans-serif" }
        }
      }
    }
  },
  
  // Output directory
  outdir: 'styled-system',
  
  // JSX framework
  jsxFramework: 'react'
})