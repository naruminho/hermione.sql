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
      // Define a global constant that creates a direct string replacement in the frontend code
      // This prevents us from needing to use 'process.env' in the React app
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})