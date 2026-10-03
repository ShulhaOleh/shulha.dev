import type { ViewModel } from "../data.ts";
import type { IconName } from "../icons.ts";
import { Icon } from "./ui.tsx";

function TabLink({
    tab,
    icon,
    label,
    count,
}: {
    tab: "about" | "projects";
    icon: IconName;
    label: string;
    count?: number;
}) {
    return (
        <a
            href={`#${tab}`}
            data-tab-link={tab}
            class="flex items-center gap-2.5 py-1 text-muted hover:text-ink"
        >
            <Icon name={icon} />
            {label}
            {count !== undefined && (
                <span class="ml-1 font-mono text-xs font-normal text-muted md:ml-auto">
                    {count}
                </span>
            )}
        </a>
    );
}

export function Sidebar({ vm }: { vm: ViewModel }) {
    const { profile } = vm;

    return (
        <aside class="flex flex-col gap-8 md:sticky md:top-16 md:self-start">
            <div>
                <h1 class="text-lg font-semibold" safe>
                    {profile.name}
                </h1>
                <p class="text-muted" safe>
                    {profile.role}
                </p>
                <div class="mt-2 flex flex-col gap-1 text-[13px] text-muted">
                    <span class="flex items-center gap-1.5">
                        <Icon name="pin" class="size-3.5" />
                        <span safe>{profile.location}</span>
                    </span>
                    <span class="flex items-center gap-1.5">
                        <Icon name="languages" class="size-3.5" />
                        <span safe>{profile.languages.join(", ")}</span>
                    </span>
                </div>
            </div>

            <nav aria-label="Sections" class="flex gap-6 md:flex-col md:gap-0.5">
                <TabLink tab="about" icon="about" label="About" />
                <TabLink
                    tab="projects"
                    icon="projects"
                    label="Projects"
                    count={vm.built.length + vm.prCount}
                />
            </nav>

            <div class="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[13px] md:flex-col">
                {profile.links.map((link) => (
                    <a href={link.href} class="group flex items-center gap-2.5 hover:text-accent">
                        <Icon name={link.icon} class="size-4 text-muted group-hover:text-accent" />
                        <span safe>{link.label}</span>
                    </a>
                ))}
            </div>
        </aside>
    );
}
