require("esbuild")
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "out.js",
    minify: true,
    target: "node16",
    platform: "node",
  })
  .catch(() => process.exit(1));
