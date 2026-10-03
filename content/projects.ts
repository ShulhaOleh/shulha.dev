import type { BuiltProject, ContributionRules } from "../src/types.ts";
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
            title: (prs) => {
                const versions = prs
                    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
                    .map((pr) => /version (\S+)/i.exec(pr.title)?.[1])
                    .filter((version) => version !== undefined);
                const first = versions.at(0);
                const last = versions.at(-1);
                return first && last && first !== last
                    ? `Modrex release manifests, ${first} to ${last}`
                    : "Modrex release manifests";
            },
        },
    ],
};
