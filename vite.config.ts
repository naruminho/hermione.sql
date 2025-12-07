import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // We cast process to any here because this file RUNS in Node (build time), so it's safe.
  const env = loadEnv(mode, (process as any).cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Define a global constant that creates a direct string replacement in the frontend code
      // This prevents us from needing to use 'process.env' in the React app
      '__GOOGLE_API_KEY__': JSON.stringify(env.API_KEY)
    }
  }
})