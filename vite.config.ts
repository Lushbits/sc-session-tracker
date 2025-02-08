import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "src": path.resolve(__dirname, "./src")
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
    hmr: {
      host: 'localhost'
    }
  },
  define: {
    'process.env': {
      VITE_SUPABASE_URL: JSON.stringify(process.env.VITE_SUPABASE_URL),
      VITE_SUPABASE_ANON_KEY: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY)
    }
  }
})
