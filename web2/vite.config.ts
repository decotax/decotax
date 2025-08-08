import type { OutputOptions, PreRenderedAsset } from "rollup";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { minify } from "html-minifier-terser";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { cloudflare } from "@cloudflare/vite-plugin";
import fs from "fs";

export default defineConfig({
  plugins: [
    pageTemplatePlugin(),
    vue(),
    minifyHtmlPlugin(),
    staticCopyPlugin(),
    cloudflare()
  ],
  build: { rollupOptions: { output: outputOptions() } },
  server: { fs: { allow: [ ".." ] } }
});

function pageTemplatePlugin(): Plugin {
  const marker = "<!-- $CONTENT -->";
  const template = fs.readFileSync("page-template.html", "utf-8");
  const handler = (html: string) => template.replace(marker, html);
  return { name: "vite-plugin-page-template",
           transformIndexHtml: { order: "pre", handler } };
}

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
    { src: "../logo/favicon.ico", dest: "." }
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