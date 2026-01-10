import type { OutputOptions, PreRenderedAsset } from "rollup";
import { defineConfig, type HmrContext, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { minify } from "html-minifier-terser";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { cloudflare } from "@cloudflare/vite-plugin";
import { Liquid, Value } from 'liquidjs';
import fs from "fs";
import MarkdownIt from "markdown-it";

export default defineConfig(({ mode }) => ({
  plugins: [
    reloadPlugin(),
    liquidPlugin(mode),
    vue(),
    minifyHtmlPlugin(),
    staticCopyPlugin(),
    cloudflare()
  ],
  build: { rollupOptions: {
    input: [ "index.html", "about.html" ],
    output: outputOptions() }
  },
  server: { fs: { allow: [ ".." ] } }
}));

function reloadPlugin(): Plugin {
  const handler = ({ file, server }: HmrContext) => {
    if ([ ".html", ".liquid" ].some(ext => file.endsWith(ext))) {
      server.ws.send({ type: "full-reload" });
    }
  };
  return { name: "reload", handleHotUpdate: handler };
}

function liquidPlugin(mode: string): Plugin {
  const engine = new Liquid({ globals: { mode } });
  registerMarkdownRenderer(engine);
  const handler = (html: string) => engine.parseAndRender(html);
  return { name: "liquid", transformIndexHtml: { order: "pre", handler } };
}

function registerMarkdownRenderer(engine: Liquid) {
  const markdown = new MarkdownIt();
  engine.registerTag("renderFile", {
    parse(token) { this.value = new Value(token.args, engine); },
    *render(ctx) {
      const file: string = yield this.value.value(ctx);
      return markdown.render(fs.readFileSync(file, "utf-8"));
    }
  });
}

function minifyHtmlPlugin(): Plugin {
  const handler = (html: string) => minify(html, {
    collapseWhitespace: true,
    removeComments: true
  });
  return { name: "minify", transformIndexHtml: handler };
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