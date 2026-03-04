import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Fast Refresh is enabled by default
      include: "**/*.{jsx,tsx}",
    })
  ],
  server: {
    // Optimize HMR
    hmr: {
      overlay: true, // Show errors as overlay
    },
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster HMR
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
    ],
  },
})
