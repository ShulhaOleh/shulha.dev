import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as si from "simple-icons";

const modules = join(import.meta.dir, "..", "node_modules");

const lucide = {
    pin: "map-pin",
    languages: "languages",
    about: "user-round",
    projects: "folder-git-2",
    external: "arrow-up-right",
    merged: "git-merge",
    open: "git-pull-request",
    star: "star",
    mail: "mail",
    file: "file-text",
} as const;

const tabler = {
    linkedin: "brand-linkedin",
} as const;

const devicon = {
    csharp: "csharp/csharp-plain",
    mysql: "mysql/mysql-original",
} as const;

const brands = {
    github: si.siGithub,
    instagram: si.siInstagram,
    x: si.siX,
    rust: si.siRust,
    typescript: si.siTypescript,
    javascript: si.siJavascript,
    dotnet: si.siDotnet,
    cplusplus: si.siCplusplus,
    python: si.siPython,
    postgresql: si.siPostgresql,
    sqlite: si.siSqlite,
    tauri: si.siTauri,
    react: si.siReact,
    nodejs: si.siNodedotjs,
    bun: si.siBun,
    bash: si.siGnubash,
    git: si.siGit,
    neovim: si.siNeovim,
    linux: si.siLinux,
} as const;

export type IconName =
    keyof typeof lucide | keyof typeof tabler | keyof typeof devicon | keyof typeof brands;

interface IconData {
    body: string;
    stroke: boolean;
    viewBox: string;
}

function svgBody(file: string): string {
    const svg = readFileSync(file, "utf8");
    const open = svg.indexOf(">", svg.indexOf("<svg")) + 1;
    return svg.slice(open, svg.lastIndexOf("</svg>")).replace(/\s+/g, " ").trim();
}

const icons = new Map<IconName, IconData>();

for (const [name, file] of Object.entries(lucide)) {
    const body = svgBody(join(modules, "lucide-static", "icons", `${file}.svg`));
    icons.set(name as IconName, { body, stroke: true, viewBox: "0 0 24 24" });
}

for (const [name, file] of Object.entries(tabler)) {
    const body = svgBody(join(modules, "@tabler", "icons", "icons", "outline", `${file}.svg`));
    icons.set(name as IconName, { body, stroke: true, viewBox: "0 0 24 24" });
}

for (const [name, file] of Object.entries(devicon)) {
    const body = svgBody(join(modules, "devicon", "icons", `${file}.svg`)).replace(
        /\s?fill="[^"]*"/g,
        "",
    );
    icons.set(name as IconName, { body, stroke: false, viewBox: "0 0 128 128" });
}

for (const [name, icon] of Object.entries(brands)) {
    icons.set(name as IconName, {
        body: `<path d="${icon.path}"/>`,
        stroke: false,
        viewBox: "0 0 24 24",
    });
}

const strokePaint =
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

// Each icon is drawn once in a sprite and every use points at it, so repeated icons cost a few bytes.
const used = new Set<IconName>();

export function iconSvg(name: IconName, className: string): string {
    if (!icons.has(name)) throw new Error(`Unknown icon: ${name}`);
    used.add(name);
    return `<svg class="${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

// Call after the rest of the page is rendered, so every icon it used is known.
export function iconSprite(): string {
    const symbols = [...used].map((name) => {
        const icon = icons.get(name)!;
        const paint = icon.stroke ? strokePaint : 'fill="currentColor"';
        return `<symbol id="i-${name}" viewBox="${icon.viewBox}"><g ${paint}>${icon.body}</g></symbol>`;
    });
    used.clear();
    return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" class="absolute" aria-hidden="true">${symbols.join("")}</svg>`;
}
