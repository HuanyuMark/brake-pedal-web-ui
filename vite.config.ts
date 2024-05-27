import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import VueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import path from 'path'
import ElementPlus from 'unplugin-element-plus/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    // VueDevTools(),
    ElementPlus({
      defaultLocale: 'zh-Cn'
    }),
    AutoImport({
      imports: ['vue', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: path.join(__dirname, 'src', 'auto-imports.d.ts'),//在src目录找对应文件,并生成auto-imports.d.ts类型文件
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: path.join(__dirname, 'src', 'components.d.ts'),//在src目录找对应文件,并生成components.d.ts类型文件
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      // 清除console和debugger
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
