import { join } from "node:path";
import { profile } from "../content/profile.ts";
import { builtProjects, contributionRules } from "../content/projects.ts";
import type { BuiltProject, GithubSnapshot, Profile, PullRequest } from "./types.ts";

export const root = join(import.meta.dir, "..");
export const snapshotPath = join(root, "data", "github.json");

const ACTIVE_WITHIN_DAYS = 120;
const MIN_STARS_SHOWN = 1;

export interface BuiltView extends BuiltProject {
    url: string;
    avatar: string;
    years: string;
    stars: number | null;
    release: string | null;
}

export interface ContributionLine {
    title: string;
    url: string;
    merged: boolean;
}

export interface ContributionGroup {
    repo: string;
    url: string;
    avatar: string;
    count: number;
    lines: ContributionLine[];
    more: number;
    moreUrl: string;
}

export interface ViewModel {
    profile: Profile;
    avatar: string;
    built: BuiltView[];
    featured: BuiltView[];
    groups: ContributionGroup[];
    prCount: number;
}

export async function loadSnapshot(): Promise<GithubSnapshot> {
    const file = Bun.file(snapshotPath);
    if (!(await file.exists())) {
        throw new Error("data/github.json is missing. Run `bun run fetch` first.");
    }
    return (await file.json()) as GithubSnapshot;
}

// Relative to .build/index.html so the bundler picks the files up and hashes them.
function avatarPath(snapshot: GithubSnapshot, login: string): string {
    const file = snapshot.avatars[login] ?? snapshot.avatars[snapshot.login];
    if (!file) throw new Error(`No avatar downloaded for ${login}. Run \`bun run fetch\`.`);
    return `../data/avatars/${file}`;
}

function yearRange(createdAt: string, pushedAt: string, now: Date): string {
    const start = new Date(createdAt).getFullYear();
    const pushed = new Date(pushedAt);
    const active = now.getTime() - pushed.getTime() < ACTIVE_WITHIN_DAYS * 24 * 60 * 60 * 1000;
    const end = active ? "now" : String(pushed.getFullYear());
    return end === String(start) ? end : `${start} – ${end}`;
}

// Tags like "1.5.0" read as versions with a "v"; other tags are shown as they are.
// Snapshots fetched before releases were tracked have no field at all.
function releaseLabel(tag: string | null | undefined): string | null {
    if (!tag) return null;
    return /^\d/.test(tag) ? `v${tag}` : tag;
}

function buildBuilt(snapshot: GithubSnapshot): BuiltView[] {
    const now = new Date(snapshot.fetchedAt);

    return builtProjects.map((project) => {
        const repo = snapshot.repos[project.repo];
        if (!repo)
            throw new Error(`${project.repo} is not in the snapshot. Run \`bun run fetch\`.`);

        return {
            ...project,
            url: repo.url,
            avatar: avatarPath(snapshot, repo.owner),
            years: project.years ?? yearRange(repo.createdAt, repo.pushedAt, now),
            stars: repo.stars >= MIN_STARS_SHOWN ? repo.stars : null,
            release: releaseLabel(repo.latestRelease),
        };
    });
}

function buildContributions(snapshot: GithubSnapshot): ContributionGroup[] {
    const ignored = new Set(contributionRules.ignoreOwners.map((owner) => owner.toLowerCase()));
    const byRepo = new Map<string, PullRequest[]>();

    for (const pr of snapshot.pullRequests) {
        if (pr.isPrivate || pr.state === "CLOSED" || ignored.has(pr.owner.toLowerCase())) continue;
        const list = byRepo.get(pr.repo) ?? [];
        list.push(pr);
        byRepo.set(pr.repo, list);
    }

    const groups = [...byRepo.values()].map((prs) => {
        prs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const first = prs[0]!;
        const searchUrl = `${first.repoUrl}/pulls?q=${encodeURIComponent(`is:pr author:${snapshot.login}`)}`;
        const collapse = contributionRules.collapse.find((rule) => rule.repo === first.repo);

        const entries: PullRequest[][] = [];
        const byKey = new Map<string, PullRequest[]>();
        for (const pr of prs) {
            const key = collapse?.key(pr);
            if (key === undefined) {
                entries.push([pr]);
                continue;
            }
            const entry = byKey.get(key);
            if (entry) {
                entry.push(pr);
            } else {
                byKey.set(key, [pr]);
                entries.push(byKey.get(key)!);
            }
        }

        const lines: ContributionLine[] = entries
            .slice(0, contributionRules.maxPerRepo)
            .map((entry) => {
                const merged = entry.some((pr) => pr.state === "MERGED");
                if (!collapse || collapse.key(entry[0]!) === undefined) {
                    return { title: entry[0]!.title, url: entry[0]!.url, merged };
                }
                const line = collapse.line(entry);
                const url = line.url ?? (entry.length === 1 ? entry[0]!.url : searchUrl);
                return { title: line.title, url, merged };
            });

        return {
            repo: first.repo,
            url: first.repoUrl,
            avatar: avatarPath(snapshot, first.owner),
            count: prs.length,
            lines,
            more: Math.max(0, entries.length - contributionRules.maxPerRepo),
            moreUrl: searchUrl,
            latest: first.createdAt,
        };
    });

    return groups
        .sort((a, b) => b.latest.localeCompare(a.latest))
        .map(({ latest: _latest, ...group }) => group);
}

export function buildViewModel(snapshot: GithubSnapshot): ViewModel {
    const built = buildBuilt(snapshot);
    const groups = buildContributions(snapshot);

    return {
        profile,
        avatar: avatarPath(snapshot, snapshot.login),
        built,
        featured: built.filter((project) => project.featured),
        groups,
        prCount: groups.reduce((sum, group) => sum + group.count, 0),
    };
}
