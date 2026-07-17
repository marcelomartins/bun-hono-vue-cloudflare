import { fileURLToPath, URL } from 'node:url'
import { cloudflare } from '@cloudflare/vite-plugin'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const rootWranglerPath = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url))
const rootStatePath = fileURLToPath(new URL('../.wrangler/state', import.meta.url))

export default defineConfig(({ command, isPreview, mode }) => {
  const unifiedCloudflareDev = command === 'serve'
    && isPreview !== true
    && mode === 'cloudflare'

  return {
    plugins: [
      ...(unifiedCloudflareDev
        ? [
            cloudflare({
              configPath: rootWranglerPath,
              persistState: { path: rootStatePath },
              config: {
                assets: {
                  // Public SSG files do not exist during development, so let
                  // Vue Router render them through the regular Vite index.
                  not_found_handling: 'single-page-application',
                },
              },
            }),
          ]
        : []),
      vue(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@api': fileURLToPath(new URL('../worker-api/src', import.meta.url)),
      },
    },
    build: {
      outDir: '../dist/web-vue',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          'index-spa': fileURLToPath(new URL('./index-spa.html', import.meta.url)),
        },
      },
    },
  }
})
