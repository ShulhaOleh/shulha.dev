import { hostOf, Icon } from "./components/ui.tsx";
import type { ViewModel } from "./data.ts";
import { iconSprite } from "./icons.ts";
import { BaseHead } from "./page.tsx";

// Cloudflare Pages serves 404.html with a 404 status for every unknown path.
export function NotFoundPage({ vm }: { vm: ViewModel }) {
    const { profile } = vm;
    const content = (
        <div class="mx-auto max-w-250 px-5 py-10 md:px-10 md:py-16">
            <a href="/" class="group inline-block">
                <span class="block text-lg font-semibold group-hover:text-accent" safe>
                    {profile.name}
                </span>
                <span class="block text-muted" safe>
                    {profile.role}
                </span>
            </a>
            <main class="mt-12 md:mt-16">
                <p class="font-mono text-xs text-muted">404</p>
                <h1 class="mt-1 text-[21px] leading-normal">Page not found</h1>
                <p class="mt-2 text-muted">There's nothing at this address.</p>
                <a
                    href="/"
                    class="mt-6 inline-flex items-center gap-1.5 font-mono text-[13px] text-accent hover:underline"
                >
                    <Icon name="back" class="size-3.5" />
                    <span safe>{`back to ${hostOf(profile.url)}`}</span>
                </a>
            </main>
        </div>
    );
    const sprite = iconSprite();

    return (
        <>
            {"<!doctype html>"}
            <html lang="en">
                <head>
                    <BaseHead vm={vm} title={`Page not found · ${profile.name}`} />
                    <meta name="robots" content="noindex" />
                </head>
                <body>
                    {sprite}
                    {content}
                </body>
            </html>
        </>
    );
}
