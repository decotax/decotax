import { defineConfig, Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { minify } from "html-minifier-terser";
import fs from "fs";

export default defineConfig({
  plugins: [ PageTemplatePlugin(), vue(), MinifyHtmlPlugin() ]
});

function PageTemplatePlugin(): Plugin {
  const marker = "<!-- $CONTENT -->";
  const template = fs.readFileSync("page-template.html", "utf-8");
  const handler = (html: string) => template.replace(marker, html);
  return { name: "vite-plugin-page-template",
           transformIndexHtml: { order: "pre", handler } };
}

function MinifyHtmlPlugin(): Plugin {
  const handler = (html: string) => minify(html, {
    collapseWhitespace: true,
    removeComments: true
  });
  return { name: "vite-plugin-minify-html",
           transformIndexHtml: { handler } };
}
