import type { Profile } from "../src/types.ts";
import { tech } from "./tech.ts";

export const profile: Profile = {
    name: "Oleh Shulha",
    alternateNames: ["Олег Шульга", "ShulhaOleh"],
    role: "CS student, UAlbany",
    location: "Albany, NY",
    languages: ["English", "Ukrainian", "Russian"],
    githubLogin: "ShulhaOleh",
    url: "https://shulha.dev",
    description:
        "Computer Science student at the University at Albany. Rust and TypeScript. Building Modrex, maintaining Refract.",
    intro: "Computer Science student at the University at Albany. I write Rust, TypeScript and C#, and right now I'm building Modrex, a mod manager for Windows and Linux, and co-maintaining Refract, a Minecraft launcher. Looking for a software engineering internship.",
    links: [
        { label: "oleh@shulha.dev", href: "mailto:oleh@shulha.dev", icon: "mail" },
        { label: "ShulhaOleh", href: "https://github.com/ShulhaOleh", icon: "github" },
        { label: "oleh-shulha", href: "https://linkedin.com/in/oleh-shulha", icon: "linkedin" },
    ],
    education: [
        {
            school: "University at Albany",
            degree: "B.S. Computer Science",
            years: "2026 – 2027",
            note: ["GPA 4.0. Expected graduation December 2027."],
            initials: "UA",
            logo: "content/logos/ualbany.png",
            href: "https://www.linkedin.com/school/university-at-albany/",
        },
        {
            school: "Kharkiv Computer Applied College",
            degree: "Associate in Software Engineering",
            years: "2021 – 2025",
            note: [
                "GPA 3.88, full scholarship. Diploma project: ",
                {
                    text: "Medical Clinic Management System",
                    href: "https://github.com/ShulhaOleh/DiplomaProject",
                },
                ".",
            ],
            initials: "KC",
            logo: "content/logos/compcollege.png",
            href: "https://www.linkedin.com/school/compcollege/",
        },
        {
            school: "IT STEP Academy",
            degree: "Certificate in Software Engineering",
            years: "2018 – 2022",
            note: ["GPA 3.54. Kharkiv, Ukraine."],
            initials: "IT",
            logo: "content/logos/itstep.jpg",
            href: "https://www.linkedin.com/company/step-it-academy",
        },
    ],
    skills: [
        {
            name: "languages",
            items: [
                tech.rust,
                tech.typescript,
                tech.csharp,
                tech.cplusplus,
                tech.javascript,
                tech.python,
            ],
        },
        {
            name: "databases",
            items: [tech.postgresql, tech.mysql, tech.sqlite],
        },
        {
            name: "frameworks",
            items: [tech.tauri, tech.react, tech.wpfWinforms, tech.nodejs],
        },
        {
            name: "tools",
            items: [tech.git, tech.neovim, tech.linux],
        },
    ],
};
