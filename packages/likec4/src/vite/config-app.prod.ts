import { viteAliases } from '@/vite/aliases'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import { hasProtocol, withLeadingSlash, withTrailingSlash } from 'ufo'
import type { InlineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import type { LikeC4 } from '../LikeC4'
import { type ViteLogger } from '../logger'
import { LikeC4VitePlugin } from '../vite-plugin/plugin'
import { chunkSizeWarningLimit, viteAppRoot, viteLogger } from './utils'

export type LikeC4ViteConfig = {
  customLogger?: ViteLogger
  languageServices: LikeC4
  outputDir?: string | undefined
  base?: string | undefined
  title?: string | undefined
  webcomponentPrefix?: string | undefined
  useHashHistory?: boolean | undefined
  useOverviewGraph?: boolean | undefined
  likec4AssetsDir: string
  outputSingleFile?: boolean | undefined
}

export const viteConfig = async ({ languageServices, likec4AssetsDir, ...cfg }: LikeC4ViteConfig) => {
  const customLogger = cfg.customLogger ?? viteLogger
  const root = viteAppRoot()
  const useOverviewGraph = cfg?.useOverviewGraph === true
  customLogger.info(`${k.cyan('likec4 app root')} ${k.dim(root)}`)

  const outDir = cfg.outputDir ?? resolve(languageServices.workspace, 'dist')
  customLogger.info(k.cyan('outDir') + ' ' + k.dim(outDir))

  let base = '/'
  if (cfg.base) {
    base = withTrailingSlash(cfg.base)
    if (!hasProtocol(base) && base !== './') {
      base = withLeadingSlash(base)
    }
  }
  if (base !== '/') {
    customLogger.info(`${k.green('app base url')} ${k.dim(base)}`)
  }

  const webcomponentPrefix = cfg.webcomponentPrefix ?? 'likec4'
  const title = cfg.title ?? 'LikeC4'

  const isSingleFile = cfg.outputSingleFile ?? false

  return {
    isDev: false,
    likec4AssetsDir,
    webcomponentPrefix,
    title,
    root,
    languageServices,
    clearScreen: false,
    base,
    resolve: {
      conditions: ['production'],
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
      alias: {
        ...viteAliases(),
        'likec4/previews': likec4AssetsDir,
      },
    },
    configFile: false,
    mode: 'production',
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        '@likec4/core/types',
        '@likec4/core/model',
        '@likec4/core/compute-view/relationships',
        '@likec4/core/utils',
        '@likec4/core',
        'likec4/vite-plugin/internal',
      ],
      noDiscovery: true,
    },
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          target: 'ESNext',
          jsx: 'react-jsx',
        },
      },
    },
    define: {
      WEBCOMPONENT_PREFIX: JSON.stringify(webcomponentPrefix),
      PAGE_TITLE: JSON.stringify(title),
      __USE_OVERVIEW_GRAPH__: useOverviewGraph ? 'true' : 'false',
      __USE_HASH_HISTORY__: cfg?.useHashHistory === true ? 'true' : 'false',
      'process.env.NODE_ENV': '"production"',
    },
    build: {
      outDir,
      modulePreload: false,
      emptyOutDir: false,
      sourcemap: false,
      cssMinify: true,
      minify: true,
      copyPublicDir: true,
      chunkSizeWarningLimit,
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
        },
        ...(!isSingleFile && {
          input: [
            resolve(root, 'index.html'),
            resolve(root, 'src', 'main.js'),
            resolve(root, 'src', 'fonts.css'),
            resolve(root, 'src', 'style.css'),
          ],
          output: {
            compact: true,
            manualChunks: (id) => {
              if (id.includes('/likec4/node_modules/')) {
                return 'vendors'
              }
              return undefined
            },
          },
        }),
      },
    },
    customLogger,
    plugins: [
      react(),
      LikeC4VitePlugin({
        languageServices: languageServices.languageServices,
        useOverviewGraph: useOverviewGraph,
      }),
      // Enable single file output
      isSingleFile ? viteSingleFile() : undefined,
    ].filter(Boolean),
  } satisfies InlineConfig & Omit<LikeC4ViteConfig, 'customLogger'> & { isDev: boolean }
}
