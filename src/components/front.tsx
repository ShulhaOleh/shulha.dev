import type { BuiltView, ViewModel } from "../data.ts";
import type { Education, RichText } from "../types.ts";
import { Avatar, ExternalLink, hostOf, Icon, SectionTitle, TechList } from "./ui.tsx";

function Rich({ parts }: { parts: RichText }) {
    return (
        <>
            {parts.map((part) =>
                typeof part === "string" ? (
                    <span safe>{part}</span>
                ) : (
                    <a href={part.href} class="text-accent hover:underline" safe>
                        {part.text}
                    </a>
                ),
            )}
        </>
    );
}

function FeaturedCard({ project }: { project: BuiltView }) {
    const featured = project.featured!;

    return (
        <article class="grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 gap-y-1 border border-line bg-surface px-5.5 py-5">
            <Avatar src={project.avatar} size="lg" />
            <div>
                <div class="font-mono text-xs text-muted" safe>
                    {featured.label}
                </div>
                <h3 class="text-lg font-semibold" safe>
                    {project.name}
                </h3>
            </div>
            <p class="col-start-2 text-muted" safe>
                {featured.summary}
            </p>
            <div class="col-start-2 mt-2 flex flex-col gap-2 font-mono text-[13px]">
                <span class="text-muted">
                    <TechList items={project.tech} />
                </span>
                <span class="flex flex-wrap gap-x-3.5 gap-y-1">
                    {project.homepage && (
                        <ExternalLink href={project.homepage}>
                            {hostOf(project.homepage)}
                        </ExternalLink>
                    )}
                    <ExternalLink href={project.url}>github</ExternalLink>
                </span>
            </div>
        </article>
    );
}

function SchoolLogo({ school }: { school: Education }) {
    const logo = school.logo ? (
        <img
            src={`../${school.logo}`}
            alt=""
            width={36}
            height={36}
            loading="lazy"
            class="size-9 object-cover"
        />
    ) : (
        <span
            class="flex size-9 items-center justify-center border border-line font-mono text-xs text-muted"
            safe
        >
            {school.initials}
        </span>
    );

    if (!school.href) return <span class="row-span-2">{logo}</span>;

    return (
        <a
            href={school.href}
            tabindex="-1"
            aria-hidden="true"
            class="row-span-2 self-start transition-opacity hover:opacity-80"
        >
            {logo}
        </a>
    );
}

function EducationRow({ school }: { school: Education }) {
    return (
        <div class="grid grid-cols-[36px_minmax(0,1fr)] gap-x-4 gap-y-0.5 border-t border-line py-3.5 sm:grid-cols-[36px_minmax(0,1fr)_auto]">
            <SchoolLogo school={school} />
            <span class="font-medium">
                {school.href ? (
                    <a href={school.href} class="hover:text-accent hover:underline" safe>
                        {school.school}
                    </a>
                ) : (
                    <span safe>{school.school}</span>
                )}
                <span safe>{`, ${school.degree}`}</span>
            </span>
            <span
                class="col-start-2 font-mono text-[13px] whitespace-nowrap text-muted sm:col-start-auto"
                safe
            >
                {school.years}
            </span>
            <p class="col-start-2 text-muted sm:col-span-2">
                <Rich parts={school.note} />
            </p>
        </div>
    );
}

export function FrontPanel({ vm }: { vm: ViewModel }) {
    const { profile } = vm;

    return (
        <section
            id="front"
            data-panel="front"
            aria-label="Front"
            class="scroll-mt-10 md:scroll-mt-16"
        >
            <p class="text-[21px] leading-normal text-pretty" safe>
                {profile.intro}
            </p>

            <div class="mt-9 flex flex-col gap-3">
                {vm.featured.map((project) => (
                    <FeaturedCard project={project} />
                ))}
            </div>

            <SectionTitle>Education</SectionTitle>
            {profile.education.map((school) => (
                <EducationRow school={school} />
            ))}

            <SectionTitle>Skills</SectionTitle>
            <div class="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-x-4 gap-y-2.5">
                {profile.skills.map((group) => (
                    <>
                        <span class="pt-1.5 font-mono text-[13px] text-muted" safe>
                            {group.name}
                        </span>
                        <div class="flex flex-wrap gap-2 font-mono text-[13px]">
                            {group.items.map((item) => (
                                <span class="flex items-center gap-2 border border-line bg-surface px-2.75 py-1.25">
                                    <Icon name={item.icon} class="size-3.5" />
                                    <span safe>{item.name}</span>
                                </span>
                            ))}
                        </div>
                    </>
                ))}
            </div>
        </section>
    );
}
