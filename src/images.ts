import { mkdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

// Images are shown at 2x their CSS size so they stay sharp on high-density screens.
const DENSITY = 2;

interface Variant {
    source: string;
    size: number;
}

const variants = new Map<string, Variant>();

// Paths are relative to .build/index.html, like every other asset in the page.
// Returns the path of a square WebP copy sized for `size` CSS pixels; writeImages() creates it.
export function sized(source: string, size: number): string {
    const name = basename(source, extname(source));
    const output = `img/${name}-${size}.webp`;
    const existing = variants.get(output);
    if (existing && existing.source !== source) {
        throw new Error(`${source} and ${existing.source} would both become ${output}`);
    }
    variants.set(output, { source, size });
    return `./${output}`;
}

export async function writeImages(buildDir: string): Promise<void> {
    await mkdir(join(buildDir, "img"), { recursive: true });
    await Promise.all(
        [...variants].map(([output, { source, size }]) =>
            sharp(join(buildDir, source))
                .resize(size * DENSITY, size * DENSITY, { fit: "cover" })
                // Lower qualities leave faint smudges on the flat white backgrounds of logos.
                .webp({ quality: 92, effort: 6 })
                .toFile(join(buildDir, output)),
        ),
    );
    variants.clear();
}
