import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia", "@vueuse/core"],
        dts: "src/auto-imports.d.ts",
      }),
      Components({
        dts: "src/components.d.ts",
        resolvers: [
          AntDesignVueResolver({
            importStyle: false,
          }),
        ],
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 3000,
      open: true,
      // 开发环境同时兼容旧的直连路径和生产使用的 /proxy-api 网关路径。
      proxy: {
        "^/proxy-api/": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy-api/, ""),
        },
        "^/(base|user|system|refreshToken|org|oj)(/|$)": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
    },
    build: {
      target: "esnext",
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      // 启用 CSS 代码分割
      cssCodeSplit: true,
      // 资源内联限制（4KB以下的资源内联为 base64）
      assetsInlineLimit: 4096,
      // 设置 chunk 大小警告阈值
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          // 更细粒度的代码分割
          manualChunks: (id) => {
            // 分离 node_modules 中的依赖
            if (id.includes('node_modules')) {
              // Vue 核心库
              if (id.includes('vue') || id.includes('@vue')) {
                return 'vue-vendor';
              }
              // VueUse 工具库
              if (id.includes('@vueuse')) {
                return 'vueuse-vendor';
              }
              // HTTP 客户端
              if (id.includes('axios')) {
                return 'http-vendor';
              }
              // 其他第三方库
              return 'vendor';
            }
          },
          // 文件命名（带 hash，利于缓存）
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]',
        },
      },
      esbuild: {
        drop: ["console", "debugger"],
      },
    },
  };
});
