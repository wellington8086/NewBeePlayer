import { defineConfig } from 'vite'
import glslifyCompiler from 'vite-plugin-glslify'

export default defineConfig({
  plugins: [
    glslifyCompiler()
  ],
  build: {
    reportCompressedSize: false
  }
})
