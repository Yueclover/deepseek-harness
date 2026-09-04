import { defineConfig } from 'tsdown'

/** Bundle the Electron main process while retaining Electron's runtime-provided module. */
export default defineConfig({
  entry: ['lib/types/main.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  deps: { neverBundle: ['electron'] },
  fixedExtension: false,
  outputOptions: { codeSplitting: false },
  dts: false,
  clean: false,
})
