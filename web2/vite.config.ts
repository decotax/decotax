import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { minify } from "html-minifier-terser";

const MinifyHtmlPlugin = () => {
  const handler = (html: string) => minify(html, {
    collapseWhitespace: true,
    removeComments: true
  });
  return {
    name: "minify-html",
    transformIndexHtml: { handler }
  };
};

export default defineConfig({
  plugins: [ vue(), MinifyHtmlPlugin() ]
});
