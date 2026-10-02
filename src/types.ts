import type { IconName } from "./icons.ts";

export interface TextLink {
    text: string;
    href: string;
}

export type RichText = (string | TextLink)[];

export interface ContactLink {
    label: string;
    href: string;
    icon: IconName;
}

export interface Education {
    school: string;
    degree: string;
    years: string;
    note: RichText;
    initials: string;
    logo?: string;
    href?: string;
}

export interface Tech {
    name: string;
    icon: IconName;
}

export interface SkillGroup {
    name: string;
    items: Tech[];
}

export interface Profile {
    name: string;
    role: string;
    location: string;
    languages: string[];
    githubLogin: string;
    url: string;
    description: string;
    intro: string;
    links: ContactLink[];
    education: Education[];
    skills: SkillGroup[];
}

export interface BuiltProject {
    repo: string;
    name: string;
    description: string;
    tech: Tech[];
    years?: string;
    tag?: string;
    wide?: boolean;
    homepage?: string;
    featured?: {
        label: string;
        summary: string;
    };
}

export interface CollapseRule {
    repo: string;
    title: (prs: PullRequest[]) => string;
}

export interface ContributionRules {
    ignoreOwners: string[];
    collapse: CollapseRule[];
    maxPerRepo: number;
}

export interface RepoSnapshot {
    nameWithOwner: string;
    url: string;
    description: string | null;
    homepageUrl: string | null;
    stars: number;
    createdAt: string;
    pushedAt: string;
    owner: string;
}

export interface PullRequest {
    repo: string;
    repoUrl: string;
    owner: string;
    isPrivate: boolean;
    title: string;
    url: string;
    number: number;
    state: "OPEN" | "CLOSED" | "MERGED";
    createdAt: string;
}

export interface GithubSnapshot {
    fetchedAt: string;
    login: string;
    repos: Record<string, RepoSnapshot>;
    pullRequests: PullRequest[];
    avatars: Record<string, string>;
}
