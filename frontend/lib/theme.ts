export const colors = {
  cayenneRed: '#E55710',
  coffeeBean: '#1F160A',
  deepTwilight: '#251A66',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorKey = keyof typeof colors;