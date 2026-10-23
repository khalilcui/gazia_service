/* Bundles the TypeScript front end (src/client) into public/js/app.js. */
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/client/main.ts"],
  bundle: true,
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  format: "iife",
  target: ["es2020"],
  outfile: "public/js/app.js",
  legalComments: "none",
  logLevel: "info"
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
