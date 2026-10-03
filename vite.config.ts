import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig, type Plugin } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  const renameHtml: Plugin = {
    name: 'adms-demo-html',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html']
      if (html?.type === 'asset') {
        this.emitFile({ type: 'asset', fileName: 'adms-demo.html', source: html.source })
        delete bundle['index.html']
      }
    },
  }
  return {
    base: './',
    publicDir: false,
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile({ removeViteModuleLoader: true }), renameHtml] : [])],
    build: { assetsInlineLimit: single ? () => true : 4096, sourcemap: false, modulePreload: single ? false : undefined },
  }
})
