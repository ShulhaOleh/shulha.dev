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

        const lines: ContributionLine[] = collapse
            ? [
                  {
                      title: collapse.title(prs),
                      url: searchUrl,
                      merged: prs.some((pr) => pr.state === "MERGED"),
                  },
              ]
            : prs.slice(0, contributionRules.maxPerRepo).map((pr) => ({
                  title: pr.title,
                  url: pr.url,
                  merged: pr.state === "MERGED",
              }));

        return {
            repo: first.repo,
            url: first.repoUrl,
            avatar: avatarPath(snapshot, first.owner),
            count: prs.length,
            lines,
            more: collapse ? 0 : Math.max(0, prs.length - contributionRules.maxPerRepo),
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
