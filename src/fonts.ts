import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import subsetFont from "subset-font";
import { root } from "./data.ts";

// Characters the browser draws without them being in the page text, like the ellipsis from
// text-overflow. Anything else missing from a subset still renders from the full font below.
const GENERATED_CHARACTERS = "…";

const fontsourceDir = join(root, "node_modules", "@fontsource");
// Minified builds write `@font-face{`, dev builds `@font-face {`.
const FONT_FACE = /@font-face\s*\{[^}]*\}/g;
const FONT_URL = /url\(["']?\/fonts\/([\w.-]+\.woff2)["']?\)(?:\s*format\([^)]*\))?/;
const UNICODE_RANGE = /;?\s*unicode-range:\s*([^;}]+)/i;

interface FontFile {
    name: string;
    path: string;
    range: Set<number>;
}

function parseRange(range: string): Set<number> {
    const points = new Set<number>();
    for (const part of range.split(",")) {
        const [start, end = start] = part.trim().slice(2).split("-") as [string, string?];
        for (let point = parseInt(start, 16); point <= parseInt(end, 16); point++)
            points.add(point);
    }
    return points;
}

function formatRange(points: Set<number>): string {
    const sorted = [...points].toSorted((a, b) => a - b);
    const parts: string[] = [];
    for (let i = 0; i < sorted.length; i++) {
        const start = sorted[i]!;
        while (sorted[i + 1] === sorted[i]! + 1) i++;
        const end = sorted[i]!;
        const hex = (point: number) => point.toString(16).toUpperCase();
        parts.push(start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`);
    }
    return parts.join(",");
}

// Finds a @fontsource file like `jetbrains-mono-latin-400-normal.woff2` and the characters it covers.
function findFont(name: string): FontFile {
    const pkg = readdirSync(fontsourceDir)
        .filter((dir) => name.startsWith(`${dir}-`))
        .toSorted((a, b) => b.length - a.length)[0];
    if (!pkg) throw new Error(`No @fontsource package has ${name}`);
    const subset = /^(.+)-\d+-(?:normal|italic)\.woff2$/.exec(name.slice(pkg.length + 1))?.[1];
    const ranges = require(join(fontsourceDir, pkg, "unicode.json")) as Record<string, string>;
    const range = subset && ranges[subset];
    if (!range) throw new Error(`No unicode range for ${name}`);
    return { name, path: join(fontsourceDir, pkg, "files", name), range: parseRange(range) };
}

function decodeEntities(text: string): string {
    const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    return text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code: string) => {
        if (code[0] !== "#") return named[code.toLowerCase()] ?? entity;
        return String.fromCodePoint(
            code[1] === "x" || code[1] === "X"
                ? parseInt(code.slice(2), 16)
                : Number(code.slice(1)),
        );
    });
}

function visibleText(html: string): string {
    const body = html.replace(/<(style|script|svg|title)\b.*?<\/\1>/gs, "").replace(/<[^>]*>/g, "");
    return decodeEntities(body);
}

async function writeHashed(outDir: string, name: string, data: Uint8Array): Promise<string> {
    const hash = createHash("sha256").update(data).digest("hex").slice(0, 8);
    const file = `assets/${name.replace(/\.woff2$/, "")}-${hash}.woff2`;
    await Bun.write(join(outDir, file), data);
    return `/${file}`;
}

// Every @font-face in the pages' inlined CSS that points at /fonts/<file> becomes two rules:
// a subset with just the characters the pages use, and the full font for every other character.
// Browsers download the full font only if a page shows a character the subset doesn't have.
// Returns the pages with rewritten CSS and the subset URL for each original font file.
export async function subsetFonts(
    pages: string[],
    outDir: string,
): Promise<{ pages: string[]; urls: Map<string, string> }> {
    const used = new Set<number>();
    for (const char of pages.map(visibleText).join("") + GENERATED_CHARACTERS) {
        used.add(char.codePointAt(0)!);
    }

    await mkdir(join(outDir, "assets"), { recursive: true });
    const rules = new Map<string, string>();
    const urls = new Map<string, string>();

    for (const page of pages) {
        for (const [original] of page.matchAll(FONT_FACE)) {
            if (rules.has(original)) continue;
            const url = FONT_URL.exec(original);
            if (!url) continue;

            // A range declared in styles.css narrows the font's own; it's replaced by the split below.
            const font = findFont(url[1]!);
            const declared = UNICODE_RANGE.exec(original);
            const range = declared
                ? new Set([...parseRange(declared[1]!)].filter((point) => font.range.has(point)))
                : font.range;
            const rule = declared ? original.replace(declared[0], "") : original;

            const full = Buffer.from(await Bun.file(font.path).arrayBuffer());
            const inSubset = new Set([...used].filter((point) => range.has(point)));
            const rest = new Set([...range].filter((point) => !inSubset.has(point)));
            const fullUrl = await writeHashed(outDir, font.name, full);
            const fullRule = rule.replace(
                url[0],
                `url(${fullUrl})format("woff2");unicode-range:${formatRange(rest)}`,
            );

            if (inSubset.size === 0) {
                rules.set(original, fullRule);
                urls.set(font.name, fullUrl);
                continue;
            }

            const text = String.fromCodePoint(...inSubset);
            const subset = await subsetFont(full, text, { targetFormat: "woff2" });
            const subsetUrl = await writeHashed(outDir, font.name, new Uint8Array(subset));
            const subsetRule = rule.replace(
                url[0],
                `url(${subsetUrl})format("woff2");unicode-range:${formatRange(inSubset)}`,
            );
            rules.set(original, fullRule + subsetRule);
            urls.set(font.name, subsetUrl);
        }
    }

    return {
        pages: pages.map((page) => page.replace(FONT_FACE, (rule) => rules.get(rule) ?? rule)),
        urls,
    };
}
