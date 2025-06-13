import type { Config } from 'tailwindcss'
import aspectRatio from '@tailwindcss/aspect-ratio'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [aspectRatio],
}

export default config
