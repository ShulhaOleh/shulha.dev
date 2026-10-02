import { FrontPanel } from "./components/front.tsx";
import { ProjectsPanel } from "./components/projects.tsx";
import { Sidebar } from "./components/sidebar.tsx";
import type { ViewModel } from "./data.ts";

const bootScript = `(()=>{const d=document.documentElement;d.classList.add("js");d.dataset.tab=location.hash==="#projects"?"projects":"front";d.dataset.filter="all"})()`;

// kitajs doesn't type `media` on <meta>.
function themeColor(color: string, scheme: "light" | "dark"): string {
    return `<meta name="theme-color" content="${color}" media="(prefers-color-scheme: ${scheme})">`;
}

export function Page({ vm }: { vm: ViewModel }) {
    const { profile } = vm;
    const ogImage = `${profile.url}/og.png`;

    return (
        <>
            {"<!doctype html>"}
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <title safe>{profile.name}</title>
                    <meta name="description" content={profile.description} />
                    <meta name="color-scheme" content="light dark" />
                    {themeColor("#fbf1c7", "light")}
                    {themeColor("#282828", "dark")}
                    <link rel="canonical" href={`${profile.url}/`} />

                    <meta property="og:type" content="website" />
                    <meta property="og:url" content={`${profile.url}/`} />
                    <meta property="og:title" content={profile.name} />
                    <meta property="og:description" content={profile.description} />
                    <meta property="og:image" content={ogImage} />
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                    <meta name="twitter:card" content="summary_large_image" />

                    <link rel="icon" href={vm.avatar} />
                    <link rel="apple-touch-icon" href={vm.avatar} />

                    <script>{bootScript}</script>
                    <link rel="stylesheet" href="../src/styles.css" />
                    <script type="module" src="../src/client.ts"></script>
                </head>
                <body>
                    <div class="mx-auto grid max-w-250 gap-12 px-5 py-10 md:grid-cols-[250px_minmax(0,1fr)] md:gap-16 md:px-10 md:py-16">
                        <Sidebar vm={vm} />
                        <main class="min-w-0">
                            <FrontPanel vm={vm} />
                            <ProjectsPanel vm={vm} />
                        </main>
                    </div>
                </body>
            </html>
        </>
    );
}
