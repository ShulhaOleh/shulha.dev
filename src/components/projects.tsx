import type { BuiltView, ContributionGroup, ViewModel } from "../data.ts";
import { Avatar, Icon, SectionTitle, TechList } from "./ui.tsx";

function FilterButton({ filter, label }: { filter: string; label: string }) {
    return (
        <button
            type="button"
            data-filter-button={filter}
            aria-pressed={filter === "all" ? "true" : "false"}
            class="cursor-pointer border-r border-line px-3.5 py-1.5 text-muted last:border-r-0 hover:text-ink aria-pressed:bg-surface aria-pressed:text-ink"
        >
            {label}
        </button>
    );
}

function ProjectTile({ project }: { project: BuiltView }) {
    return (
        <a
            href={project.url}
            class={`group flex min-w-0 flex-col gap-1.5 border border-line bg-surface px-4.5 py-4 hover:border-muted ${project.wide ? "sm:col-span-2" : ""}`}
        >
            <span class="flex items-center gap-2.5 font-semibold">
                <Avatar src={project.avatar} size="sm" />
                <span class="group-hover:text-accent" safe>
                    {project.name}
                </span>
                {[project.role, project.tag]
                    .filter((tag) => tag !== undefined)
                    .map((tag) => (
                        <span
                            class="border border-accent px-1.75 py-px font-mono text-[11px] font-normal text-accent"
                            safe
                        >
                            {tag}
                        </span>
                    ))}
            </span>
            <span class="text-muted" safe>
                {project.description}
            </span>
            <span class="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-1 font-mono text-xs whitespace-nowrap text-muted">
                <TechList items={project.tech} />
                <span class="flex items-center gap-2">
                    {project.stars !== null && (
                        <>
                            <span class="flex items-center gap-1">
                                <Icon name="star" class="size-3.5" />
                                {project.stars}
                            </span>
                            <span aria-hidden="true">·</span>
                        </>
                    )}
                    <span safe>{project.years}</span>
                </span>
            </span>
        </a>
    );
}

function RepoGroup({ group }: { group: ContributionGroup }) {
    return (
        <div class="border-t border-line py-3.5">
            <a
                href={group.url}
                class="flex items-center gap-2.5 font-mono text-sm hover:text-accent"
            >
                <Avatar src={group.avatar} size="sm" />
                <span class="min-w-0 truncate" safe>
                    {group.repo}
                </span>
                <span class="ml-auto text-xs text-muted">{group.count}</span>
            </a>
            <ul class="mt-2 ml-7.5 flex flex-col gap-1.5">
                {group.lines.map((line) => (
                    <li class="flex items-start gap-2.5">
                        <Icon
                            name={line.merged ? "merged" : "open"}
                            class={`mt-1 size-4 ${line.merged ? "text-accent" : "text-muted"}`}
                        />
                        <a href={line.url} class="hover:text-accent" safe>
                            {line.title}
                        </a>
                    </li>
                ))}
                {group.more > 0 && (
                    <li class="ml-6.5 text-sm text-muted">
                        <a href={group.moreUrl} class="hover:text-accent">
                            +{group.more} more
                        </a>
                    </li>
                )}
            </ul>
        </div>
    );
}

export function ProjectsPanel({ vm }: { vm: ViewModel }) {
    const repoCount = vm.groups.length;

    return (
        <section
            id="projects"
            data-panel="projects"
            aria-label="Projects"
            class="scroll-mt-10 md:scroll-mt-16"
        >
            <div
                data-filters
                role="group"
                aria-label="Filter projects"
                class="flex w-max border border-line font-mono text-[13px]"
            >
                <FilterButton filter="all" label="All" />
                <FilterButton filter="built" label={`Built ${vm.built.length}`} />
                <FilterButton filter="contributed" label={`Contributed ${vm.prCount}`} />
            </div>

            <div data-group="built">
                <SectionTitle count={String(vm.built.length)}>Built</SectionTitle>
                <div class="grid gap-3 sm:grid-cols-2">
                    {vm.built.map((project) => (
                        <ProjectTile project={project} />
                    ))}
                </div>
            </div>

            <div data-group="contributed">
                <SectionTitle
                    count={`${vm.prCount} PRs, ${repoCount} ${repoCount === 1 ? "repo" : "repos"}`}
                    aside={
                        <>
                            <span class="flex items-center gap-1.5">
                                <Icon name="merged" class="size-3.5 text-accent" />
                                merged
                            </span>
                            <span class="flex items-center gap-1.5">
                                <Icon name="open" class="size-3.5" />
                                open
                            </span>
                        </>
                    }
                >
                    Contributed
                </SectionTitle>
                {vm.groups.map((group) => (
                    <RepoGroup group={group} />
                ))}
            </div>
        </section>
    );
}
