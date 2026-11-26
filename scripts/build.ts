import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import tailwind from "bun-plugin-tailwind";
import { buildViewModel, loadSnapshot, root } from "../src/data.ts";
import { subsetFonts } from "../src/fonts.ts";
import { resolveImages } from "../src/images.ts";
import { renderOgImage } from "../src/og.ts";
import { NotFoundPage } from "../src/not-found.tsx";
import { Page } from "../src/page.tsx";
import { securityHeaders } from "../src/security.ts";
import { robotsTxt, sitemapXml } from "../src/seo.ts";

const dev = process.argv.includes("--dev");
const buildDir = join(root, ".build");
const outDir = join(root, "dist");
const started = performance.now();

const vm = buildViewModel(await loadSnapshot());
// Cloudflare Pages serves 404.html with a 404 status for every unknown path.
const rendered: Record<string, string> = {
    "index.html": await Page({ vm }),
    "404.html": await NotFoundPage({ vm }),
};
const names = Object.keys(rendered);

await rm(buildDir, { recursive: true, force: true });
await rm(outDir, { recursive: true, force: true });
await mkdir(buildDir, { recursive: true });
const withImages = await resolveImages(buildDir, Object.values(rendered));
await Promise.all(names.map((name, i) => Bun.write(join(buildDir, name), withImages[i]!)));

const result = await Bun.build({
    entrypoints: names.map((name) => join(buildDir, name)),
    outdir: outDir,
    minify: !dev,
    sourcemap: dev ? "linked" : "none",
    plugins: [tailwind],
    // Bun inlines CSS url() assets as base64, so fonts are written by subsetFonts() below.
    external: ["/fonts/*"],
    // Every file in assets/ has a content hash in its name, so _headers caches it for a year.
    naming: {
        entry: "[dir]/[name].[ext]",
        chunk: "assets/[name]-[hash].[ext]",
        asset: "assets/[name]-[hash].[ext]",
    },
    // Asset paths start at the root, because 404.html is served at any depth.
    publicPath: "/",
});

if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
}

const inlined = new Set<string>();

async function inline(html: string, tag: RegExp, wrap: (code: string) => string): Promise<string> {
    for (const [whole, href] of html.matchAll(tag)) {
        const path = join(outDir, href!.replace(/^\.?\//, ""));
        const code = (await Bun.file(path).text()).trim();
        if (/<\/(style|script)/i.test(code)) throw new Error(`${href} can't be inlined safely`);
        // A page without scripts still gets an empty bundle from Bun; it's dropped.
        html = html.replace(whole, () => (code ? wrap(code) : ""));
        inlined.add(path);
    }
    return html;
}

let pages: string[] = [];
for (const name of names) {
    let html = await Bun.file(join(outDir, name)).text();
    // Stylesheets are inlined so the first paint doesn't wait for a second request.
    const stylesheet = /<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g;
    if (!html.includes('<link rel="stylesheet"')) throw new Error(`No stylesheet in ${name}`);
    html = await inline(html, stylesheet, (css) => `<style>${css}</style>`);
    // Scripts are tiny, so they're inlined too. Dev builds keep the files so source maps work.
    if (!dev) {
        const script = /<script type="module"[^>]*src="([^"]+\.js)"[^>]*><\/script>/g;
        html = await inline(html, script, (js) => `<script type="module">${js}</script>`);
    }
    pages.push(html);
}
await Promise.all([...inlined].map((path) => rm(path)));

// Fonts are cut down to the characters the pages use.
const fonts = await subsetFonts(pages, outDir);
pages = fonts.pages;

// Bun's HTML bundler tries to resolve preload hrefs, so the links are added after bundling.
const preloadFonts = [
    "atkinson-hyperlegible-next-latin-400-normal.woff2",
    "atkinson-hyperlegible-next-latin-600-normal.woff2",
    "jetbrains-mono-latin-400-normal.woff2",
];
const preloadLinks = preloadFonts
    .map((file) => {
        const url = fonts.urls.get(file);
        if (!url) throw new Error(`Preloaded font is not in styles.css: ${file}`);
        return `<link rel="preload" as="font" type="font/woff2" href="${url}" crossorigin>`;
    })
    .join("");
await Promise.all(
    names.map((name, i) =>
        Bun.write(
            join(outDir, name),
            pages[i]!.replace("<style>", () => `${preloadLinks}<style>`),
        ),
    ),
);

await Bun.write(join(outDir, "resume.pdf"), Bun.file(join(root, "content", "resume.pdf")));
await Bun.write(
    join(outDir, "_headers"),
    [
        "/resume.pdf",
        '  Content-Disposition: inline; filename="Oleh-Shulha-Resume.pdf"',
        "/assets/*",
        "  Cache-Control: public, max-age=31536000, immutable",
        ...securityHeaders(pages),
        // Browsers' built-in PDF viewers can break under a page CSP.
        "/resume.pdf",
        "  ! Content-Security-Policy",
        "",
    ].join("\n"),
);
await Bun.write(join(outDir, "og.png"), await renderOgImage(vm));
await Bun.write(join(outDir, "robots.txt"), robotsTxt(vm.profile));
await Bun.write(join(outDir, "sitemap.xml"), sitemapXml(vm.profile, new Date()));

const ms = Math.round(performance.now() - started);
console.log(`Built ${result.outputs.length + 1} files into dist/ in ${ms} ms.`);
