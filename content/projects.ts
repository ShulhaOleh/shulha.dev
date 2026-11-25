import type { BuiltProject, ContributionRules, PullRequest } from "../src/types.ts";
import { tech } from "./tech.ts";

export const builtProjects: BuiltProject[] = [
    {
        repo: "modrexio/modrex",
        name: "Modrex",
        description:
            "Cross-platform mod manager for Windows and Linux. One-click installs, updates and load order across several games.",
        tech: [tech.rust, tech.tauri, tech.react, tech.typescript],
        homepage: "https://modrex.net",
        wide: true,
        role: "founder",
        featured: {
            summary:
                "Cross-platform mod manager: one-click installs, mod updates and load-order management across several games. Rust backend, React and TypeScript front end, on Tauri.",
        },
    },
    {
        repo: "RefractMC/Refract_MC",
        name: "Refract",
        description:
            "Open-source Minecraft launcher with a customizable UI and built-in Modrinth and CurseForge support.",
        tech: [tech.rust, tech.tauri, tech.react, tech.typescript],
        homepage: "https://refractmc.net",
        wide: true,
        role: "maintainer",
        featured: {
            summary:
                "Open-source Minecraft launcher with a customizable UI and built-in Modrinth and CurseForge support. I work on Linux support, packaging and the installer.",
        },
    },
    {
        repo: "ShulhaOleh/DiplomaProject",
        name: "Medical Clinic Management System",
        description:
            "Windows desktop app for clinic staff, defended as my diploma project. Separate workflows for doctors, receptionists and administrators.",
        tech: [tech.csharp, tech.wpf, tech.mysql],
        years: "2025",
        tag: "diploma",
        wide: true,
    },
    {
        repo: "modrexio/mget",
        name: "mget",
        description: "One-line curl installer for Linux and macOS. Refract installs with it.",
        tech: [tech.shell],
    },
    {
        repo: "ShulhaOleh/mouse-jiggler",
        name: "mouse-jiggler",
        description: "Cross-platform mouse jiggler.",
        tech: [tech.cplusplus],
    },
];

export const contributionRules: ContributionRules = {
    ignoreOwners: ["ShulhaOleh", "modrexio", "RefractMC"],
    maxPerRepo: 3,
    collapse: [
        {
            repo: "microsoft/winget-pkgs",
            key: (pr) => wingetManifest(pr)?.id,
            line: (prs) => {
                const manifests = prs.map(wingetManifest).filter((m) => m !== undefined);
                const { id, folder } = manifests[0]!;
                const name = id.split(".").at(-1);
                const versions = manifests
                    .filter((m) => m.added)
                    .map((m) => m.version)
                    .toSorted(compareVersions);
                const first = versions.at(0);
                const last = versions.at(-1);
                const noun = prs.length === 1 ? "release manifest" : "release manifests";
                const title =
                    first && last
                        ? `${name} ${noun}, ${first === last ? first : `${first} to ${last}`}`
                        : `${name} ${noun}`;
                const merged = prs.some((pr) => pr.state === "MERGED");
                const url =
                    prs.length > 1 && merged
                        ? `${prs[0]!.repoUrl}/tree/master/${folder}`
                        : undefined;
                return { title, url };
            },
        },
    ],
};

function wingetManifest(pr: PullRequest) {
    const file = pr.firstFile;
    const parts = file?.path.split("/") ?? [];
    if (!file || parts[0] !== "manifests" || parts.length < 6) return undefined;
    return {
        id: parts.slice(2, -2).join("."),
        version: parts.at(-2)!,
        folder: parts.slice(0, -2).join("/"),
        added: file.changeType === "ADDED",
    };
}

function compareVersions(a: string, b: string): number {
    const left = a.split(/[.\-+]/);
    const right = b.split(/[.\-+]/);
    for (let i = 0; i < Math.max(left.length, right.length); i++) {
        const x = left[i] ?? "0";
        const y = right[i] ?? "0";
        const order =
            /^\d+$/.test(x) && /^\d+$/.test(y) ? Number(x) - Number(y) : x.localeCompare(y);
        if (order !== 0) return order;
    }
    return 0;
}
