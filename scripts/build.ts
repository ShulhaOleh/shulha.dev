import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import tailwind from "bun-plugin-tailwind";
import { buildViewModel, loadSnapshot, root } from "../src/data.ts";
import { resolveImages } from "../src/images.ts";
import { renderOgImage } from "../src/og.ts";
import { Page } from "../src/page.tsx";
import { robotsTxt, sitemapXml } from "../src/seo.ts";

const dev = process.argv.includes("--dev");
const buildDir = join(root, ".build");
const outDir = join(root, "dist");
const started = performance.now();

const vm = buildViewModel(await loadSnapshot());
const html = await Page({ vm });

await rm(buildDir, { recursive: true, force: true });
await rm(outDir, { recursive: true, force: true });
await mkdir(buildDir, { recursive: true });
await Bun.write(join(buildDir, "index.html"), await resolveImages(buildDir, html));

const result = await Bun.build({
    entrypoints: [join(buildDir, "index.html")],
    outdir: outDir,
    minify: !dev,
    sourcemap: dev ? "linked" : "none",
    plugins: [tailwind],
    // Bun inlines CSS url() assets as base64, so fonts are copied over below.
    external: ["/fonts/*"],
    // Every file in assets/ has a content hash in its name, so _headers caches it for a year.
    naming: {
        entry: "[dir]/[name].[ext]",
        chunk: "assets/[name]-[hash].[ext]",
        asset: "assets/[name]-[hash].[ext]",
    },
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

// Bun's HTML bundler tries to resolve preload hrefs, so the links are added after bundling.
const preloadFonts = [
    "atkinson-hyperlegible-next-latin-400-normal.woff2",
    "atkinson-hyperlegible-next-latin-600-normal.woff2",
    "jetbrains-mono-latin-400-normal.woff2",
];
const preloadLinks = preloadFonts
    .map((file) => {
        if (!fontFiles.includes(file))
            throw new Error(`Preloaded font is not in styles.css: ${file}`);
        return `<link rel="preload" as="font" type="font/woff2" href="/fonts/${file}" crossorigin>`;
    })
    .join("");

// The stylesheet is inlined so the first paint doesn't wait for a second request.
const indexPath = join(outDir, "index.html");
const bundledHtml = await Bun.file(indexPath).text();
const stylesheetLink = /<link rel="stylesheet"[^>]*href="\.\/([\w./-]+\.css)"[^>]*>/.exec(
    bundledHtml,
);
if (!stylesheetLink) throw new Error("No stylesheet link found in the bundled page");
const cssPath = join(outDir, stylesheetLink[1]!);
const bundledCss = await Bun.file(cssPath).text();
if (bundledCss.includes("</style")) throw new Error("Stylesheet can't be inlined safely");
let finalHtml = bundledHtml.replace(
    stylesheetLink[0],
    () => `${preloadLinks}<style>${bundledCss}</style>`,
);
await rm(cssPath);

// The client script is tiny, so it's inlined too. Dev builds keep the file so its source map works.
if (!dev) {
    const scriptTag = /<script type="module"[^>]*src="\.\/([\w./-]+\.js)"[^>]*><\/script>/.exec(
        finalHtml,
    );
    if (!scriptTag) throw new Error("No client script found in the bundled page");
    const scriptPath = join(outDir, scriptTag[1]!);
    const script = await Bun.file(scriptPath).text();
    if (script.includes("</script")) throw new Error("Client script can't be inlined safely");
    finalHtml = finalHtml.replace(
        scriptTag[0],
        () => `<script type="module">${script.trim()}</script>`,
    );
    await rm(scriptPath);
}

await Bun.write(indexPath, finalHtml);

await Bun.write(join(outDir, "resume.pdf"), Bun.file(join(root, "content", "resume.pdf")));
await Bun.write(
    join(outDir, "_headers"),
    [
        "/resume.pdf",
        '  Content-Disposition: inline; filename="Oleh-Shulha-Resume.pdf"',
        "/fonts/*",
        "  Cache-Control: public, max-age=31536000, immutable",
        "/assets/*",
        "  Cache-Control: public, max-age=31536000, immutable",
        "",
    ].join("\n"),
);
await Bun.write(join(outDir, "og.png"), await renderOgImage(vm));
await Bun.write(join(outDir, "robots.txt"), robotsTxt(vm.profile));
await Bun.write(join(outDir, "sitemap.xml"), sitemapXml(vm.profile, new Date()));

const ms = Math.round(performance.now() - started);
console.log(`Built ${result.outputs.length + 1} files into dist/ in ${ms} ms.`);
