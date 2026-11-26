import { mkdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

// Images are shown at 2x their CSS size so they stay sharp on high-density screens.
const DENSITY = 2;
// An image shown at several sizes is written once at the largest of them, as long as no slot
// is more than this many times smaller. A big hero never makes a small icon download it.
const MAX_REUSE_RATIO = 2.5;

const requested = new Map<string, Set<number>>();
const TOKEN = /@@image\((\d+),([^)]+)\)@@/g;

// `source` is relative to .build/index.html, like every other asset in the page.
// Returns a placeholder that resolveImages() swaps for the real file once every size is known.
export function sized(source: string, size: number): string {
    const sizes = requested.get(source) ?? new Set();
    sizes.add(size);
    requested.set(source, sizes);
    return `@@image(${size},${source})@@`;
}

function groupSizes(sizes: Set<number>): Map<number, number> {
    const target = new Map<number, number>();
    let largest = 0;
    for (const size of [...sizes].toSorted((a, b) => b - a)) {
        if (largest === 0 || size * MAX_REUSE_RATIO < largest) largest = size;
        target.set(size, largest);
    }
    return target;
}

// Writes the resized WebP files next to the pages and returns the pages with real paths.
// Pass every page at once so they share one file per image.
export async function resolveImages(buildDir: string, pages: string[]): Promise<string[]> {
    const outputs = new Map<string, { source: string; size: number }>();
    const paths = new Map<string, string>();

    for (const [source, sizes] of requested) {
        for (const [size, target] of groupSizes(sizes)) {
            const output = `img/${basename(source, extname(source))}-${target}.webp`;
            const existing = outputs.get(output);
            if (existing && existing.source !== source) {
                throw new Error(`${source} and ${existing.source} would both become ${output}`);
            }
            outputs.set(output, { source, size: target });
            paths.set(`${size},${source}`, `./${output}`);
        }
    }

    await mkdir(join(buildDir, "img"), { recursive: true });
    await Promise.all(
        [...outputs].map(([output, { source, size }]) =>
            sharp(join(buildDir, source))
                .resize(size * DENSITY, size * DENSITY, { fit: "cover" })
                // Lower qualities leave faint smudges on the flat white backgrounds of logos.
                .webp({ quality: 92, effort: 6 })
                .toFile(join(buildDir, output)),
        ),
    );
    requested.clear();

    return pages.map((html) =>
        html.replace(TOKEN, (_, size: string, source: string) => paths.get(`${size},${source}`)!),
    );
}
