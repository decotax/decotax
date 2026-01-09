import type { OutputOptions, PreRenderedAsset } from "rollup";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { minify } from "html-minifier-terser";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { cloudflare } from "@cloudflare/vite-plugin";
import liquid from "@vituum/vite-plugin-liquid";

export default defineConfig({
  plugins: [
    liquid(),
    vue(),
    minifyHtmlPlugin(),
    staticCopyPlugin(),
    cloudflare()
  ],
  build: { rollupOptions: {
    input: ["index.liquid.html"],
    output: outputOptions()
  } },
  server: { fs: { allow: [ ".." ] } }
});

function minifyHtmlPlugin(): Plugin {
  const handler = (html: string) => minify(html, {
    collapseWhitespace: true,
    removeComments: true
  });
  return { name: "vite-plugin-minify-html",
           transformIndexHtml: { handler } };
}

function staticCopyPlugin(): Plugin[] {
  const targets = [
    { src: "../logo/favicon.ico", dest: "." },
    { src: "_headers", dest: "." }
  ];
  return viteStaticCopy({ targets });
}

function outputOptions(): OutputOptions {
  const rev = process.env.VITE_REV;
  const dir = rev ? `r${rev}` : "assets";
  return {
    assetFileNames: (info: PreRenderedAsset) => {
      const is_font = info.names[0].match(/\.woff2$/);
      return `${is_font ? "fonts" : dir}/[name][extname]`;
    },
    chunkFileNames: `${dir}/[name].js`,
    entryFileNames: `${dir}/main.js`
  };
}