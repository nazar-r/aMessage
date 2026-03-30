import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '..')}},
  root: path.resolve(__dirname, '..'),
  cacheDir: path.resolve(__dirname, '../node_modules/.vite'),
})