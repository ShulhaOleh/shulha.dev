import type { Children, PropsWithChildren } from "@kitajs/html";
import { iconSvg, type IconName } from "../icons.ts";
import type { Tech } from "../types.ts";

export function Icon({ name, class: className = "size-4" }: { name: IconName; class?: string }) {
    return iconSvg(name, `shrink-0 ${className}`);
}

const avatarSizes = {
    sm: { px: 20, class: "size-5" },
    lg: { px: 44, class: "size-11" },
} as const;

export function Avatar({ src, size }: { src: string; size: keyof typeof avatarSizes }) {
    const { px, class: className } = avatarSizes[size];
    return (
        <img
            src={src}
            alt=""
            width={px}
            height={px}
            loading="lazy"
            class={`${className} shrink-0 bg-line object-cover`}
        />
    );
}

export function SectionTitle({
    children,
    count,
    aside,
}: PropsWithChildren<{ count?: string; aside?: Children }>) {
    return (
        <h2 class="mt-13 mb-3 flex flex-wrap items-baseline gap-x-2.5 font-semibold">
            {children}
            {count && (
                <span class="font-mono text-xs font-normal text-muted" safe>
                    {count}
                </span>
            )}
            {aside && (
                <span class="ml-auto flex gap-4 font-mono text-xs font-normal text-muted">
                    {aside}
                </span>
            )}
        </h2>
    );
}

export function ExternalLink({ href, children }: PropsWithChildren<{ href: string }>) {
    return (
        <a href={href} class="inline-flex items-center gap-1 text-accent hover:underline">
            {children}
            <Icon name="external" class="size-3.5" />
        </a>
    );
}

export function TechList({ items }: { items: Tech[] }) {
    return (
        <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
            {items.map((item) => (
                <span class="flex items-center gap-1.5 whitespace-nowrap">
                    <Icon name={item.icon} class="size-3.5" />
                    <span safe>{item.name}</span>
                </span>
            ))}
        </span>
    );
}

export function hostOf(url: string): string {
    return new URL(url).host.replace(/^www\./, "");
}
