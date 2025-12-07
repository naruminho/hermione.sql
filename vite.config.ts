import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Using '.' instead of process.cwd() avoids TS error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react()],
    define: {
      // Explicitly expose keys to the frontend bundle
      'import.meta.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY)
    }
  }
})
