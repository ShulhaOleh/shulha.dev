import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import tailwind from "bun-plugin-tailwind";
import { buildViewModel, loadSnapshot, root } from "../src/data.ts";
import { renderOgImage } from "../src/og.ts";
import { Page } from "../src/page.tsx";

const dev = process.argv.includes("--dev");
const buildDir = join(root, ".build");
const outDir = join(root, "dist");
const started = performance.now();

const vm = buildViewModel(await loadSnapshot());
const html = await Page({ vm });

await rm(buildDir, { recursive: true, force: true });
await rm(outDir, { recursive: true, force: true });
await mkdir(buildDir, { recursive: true });
await Bun.write(join(buildDir, "index.html"), html);

const result = await Bun.build({
    entrypoints: [join(buildDir, "index.html")],
    outdir: outDir,
    minify: !dev,
    sourcemap: dev ? "linked" : "none",
    plugins: [tailwind],
    // Bun inlines CSS url() assets as base64, so fonts are copied over below.
    external: ["/fonts/*"],
});

if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
}

const css = await Bun.file(join(root, "src", "styles.css")).text();
const fontFiles = [...css.matchAll(/\/fonts\/([\w.-]+\.woff2)/g)].map((match) => match[1]!);
const fontPackages = ["atkinson-hyperlegible-next", "jetbrains-mono"];

for (const file of fontFiles) {
    const pkg = fontPackages.find((name) => file.startsWith(name));
    if (!pkg) throw new Error(`No @fontsource package for ${file}`);
    const source = join(root, "node_modules", "@fontsource", pkg, "files", file);
    await Bun.write(join(outDir, "fonts", file), Bun.file(source));
}

await Bun.write(join(outDir, "og.png"), await renderOgImage(vm));

const ms = Math.round(performance.now() - started);
console.log(`Built ${result.outputs.length + 1} files into dist/ in ${ms} ms.`);
