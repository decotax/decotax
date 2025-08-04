import { defineConfig, Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { minify } from "html-minifier-terser";
import { viteStaticCopy } from "vite-plugin-static-copy";
import fs from "fs";

export default defineConfig({
  plugins: [
    pageTemplatePlugin(),
    vue(),
    minifyHtmlPlugin(),
    staticCopyPlugin()
  ]
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