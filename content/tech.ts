import type { Tech } from "../src/types.ts";

export const tech = {
    rust: { name: "Rust", icon: "rust" },
    typescript: { name: "TypeScript", icon: "typescript" },
    javascript: { name: "JavaScript", icon: "javascript" },
    csharp: { name: "C#", icon: "csharp" },
    cplusplus: { name: "C++", icon: "cplusplus" },
    python: { name: "Python", icon: "python" },
    shell: { name: "Shell", icon: "bash" },
    postgresql: { name: "PostgreSQL", icon: "postgresql" },
    mysql: { name: "MySQL", icon: "mysql" },
    sqlite: { name: "SQLite", icon: "sqlite" },
    tauri: { name: "Tauri", icon: "tauri" },
    react: { name: "React", icon: "react" },
    wpf: { name: "WPF", icon: "dotnet" },
    wpfWinforms: { name: "WPF / WinForms", icon: "dotnet" },
    nodejs: { name: "Node.js", icon: "nodejs" },
    git: { name: "Git", icon: "git" },
    neovim: { name: "Neovim", icon: "neovim" },
    linux: { name: "Linux", icon: "linux" },
} as const satisfies Record<string, Tech>;
