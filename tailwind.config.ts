import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"VINCI Sans"', 'Arial', 'Helvetica', 'sans-serif'],
        condensed: ['"VINCI Sans Condensed"', '"VINCI Sans"', 'Arial', 'sans-serif'],
        serif: ['"VINCI Serif"', 'Georgia', 'serif'],
      },
      fontSize: { base: ['14px', '20px'] },
      colors: {
        vinci: {
          bleu: '#004489',
          'bleu-fonce': '#003370',
          'bleu-clair': '#0056B3',
          'bleu-tres-clair': '#E5EFF8',
          rouge: '#E20025',
          'rouge-fonce': '#B8001E',
          'rouge-tres-clair': '#FDEAED',
          gris: '#B5ABA1',
          'gris-clair': '#F0F0F0',
          'gris-bordure': '#DCDCDC',
          texte: '#000000',
          'texte-secondaire': '#5A5A5A',
          vert: '#7AA536',
          'vert-clair': '#E8EFDA',
          jaune: '#F2AB1B',
          'jaune-clair': '#FFF7D1',
          orange: '#C26A32',
          'orange-clair': '#F9E9D9',
          'bleu-moyen': '#307BFF',
          'bleu-moyen-clair': '#E5F1F9',
        },
        border: '#DCDCDC',
        input: '#DCDCDC',
        ring: '#004489',
        background: '#FFFFFF',
        foreground: '#000000',
        primary: { DEFAULT: '#004489', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#F0F0F0', foreground: '#000000' },
        destructive: { DEFAULT: '#E20025', foreground: '#FFFFFF' },
        muted: { DEFAULT: '#F0F0F0', foreground: '#5A5A5A' },
        accent: { DEFAULT: '#E5EFF8', foreground: '#003370' },
        popover: { DEFAULT: '#FFFFFF', foreground: '#000000' },
        card: { DEFAULT: '#FFFFFF', foreground: '#000000' },
      },
      borderRadius: { lg: '6px', md: '4px', sm: '2px' },
    },
  },
  plugins: [animate],
}
export default config
