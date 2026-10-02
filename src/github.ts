import { profile } from "../content/profile.ts";
import { builtProjects } from "../content/projects.ts";
import type { PullRequest, RepoSnapshot } from "./types.ts";

const OWN_AVATAR_SIZE = 192;
const AVATAR_SIZE = 96;

interface Owner {
    login: string;
    avatarUrl: string;
}

interface PullRequestPage {
    user: {
        login: string;
        avatarUrl: string;
        pullRequests: {
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
            nodes: {
                title: string;
                url: string;
                number: number;
                state: PullRequest["state"];
                createdAt: string;
                repository: {
                    nameWithOwner: string;
                    url: string;
                    isPrivate: boolean;
                    owner: Owner;
                };
            }[];
        };
    };
}

interface RepoNode {
    nameWithOwner: string;
    url: string;
    description: string | null;
    homepageUrl: string | null;
    stargazerCount: number;
    createdAt: string;
    pushedAt: string;
    owner: Owner;
}

export interface GithubData {
    login: string;
    pullRequests: PullRequest[];
    repos: Record<string, RepoSnapshot>;
    avatarUrls: Map<string, string>;
}

const pullRequestQuery = `
    query ($login: String!, $after: String) {
        user(login: $login) {
            login
            avatarUrl(size: ${OWN_AVATAR_SIZE})
            pullRequests(first: 100, after: $after, orderBy: { field: CREATED_AT, direction: DESC }) {
                pageInfo { hasNextPage endCursor }
                nodes {
                    title url number state createdAt
                    repository {
                        nameWithOwner url isPrivate
                        owner { login avatarUrl(size: ${AVATAR_SIZE}) }
                    }
                }
            }
        }
    }
`;

const repoFields = `
    nameWithOwner url description homepageUrl stargazerCount createdAt pushedAt
    owner { login avatarUrl(size: ${AVATAR_SIZE}) }
`;

export async function queryGithub(token: string): Promise<GithubData> {
    async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
        const response = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                Authorization: `bearer ${token}`,
                "Content-Type": "application/json",
                "User-Agent": "shulha.dev",
            },
            body: JSON.stringify({ query, variables }),
        });
        if (!response.ok) {
            throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
        }
        const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
        if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("\n"));
        if (!json.data) throw new Error("GitHub API returned no data.");
        return json.data;
    }

    let login = profile.githubLogin;
    const avatarUrls = new Map<string, string>();
    // The user's avatar is fetched larger for the favicon and link preview; keep that copy.
    const addOwner = (owner: Owner) => {
        if (owner.login.toLowerCase() !== login.toLowerCase()) {
            avatarUrls.set(owner.login, owner.avatarUrl);
        }
    };

    const pullRequests: PullRequest[] = [];
    let after: string | null = null;
    do {
        const page: PullRequestPage = await graphql<PullRequestPage>(pullRequestQuery, {
            login: profile.githubLogin,
            after,
        });
        login = page.user.login;
        avatarUrls.set(login, page.user.avatarUrl);

        for (const node of page.user.pullRequests.nodes) {
            const repo = node.repository;
            addOwner(repo.owner);
            pullRequests.push({
                repo: repo.nameWithOwner,
                repoUrl: repo.url,
                owner: repo.owner.login,
                isPrivate: repo.isPrivate,
                title: node.title,
                url: node.url,
                number: node.number,
                state: node.state,
                createdAt: node.createdAt,
            });
        }

        const { hasNextPage, endCursor } = page.user.pullRequests.pageInfo;
        after = hasNextPage ? endCursor : null;
    } while (after);

    const repoQuery = `query {\n${builtProjects
        .map((project, index) => {
            const [owner, name] = project.repo.split("/");
            return `r${index}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ${repoFields} }`;
        })
        .join("\n")}\n}`;
    const repoData = await graphql<Record<string, RepoNode | null>>(repoQuery);

    const repos: Record<string, RepoSnapshot> = {};
    builtProjects.forEach((project, index) => {
        const node = repoData[`r${index}`];
        if (!node) throw new Error(`Repository ${project.repo} not found or not public.`);
        addOwner(node.owner);
        repos[project.repo] = {
            nameWithOwner: node.nameWithOwner,
            url: node.url,
            description: node.description,
            homepageUrl: node.homepageUrl,
            stars: node.stargazerCount,
            createdAt: node.createdAt,
            pushedAt: node.pushedAt,
            owner: node.owner.login,
        };
    });

    return { login, pullRequests, repos, avatarUrls };
}

export async function fingerprint(data: GithubData): Promise<string> {
    const shown = {
        pullRequests: data.pullRequests
            .map((pr) => [pr.repo, pr.number, pr.title, pr.state, pr.isPrivate])
            .sort(),
        repos: Object.values(data.repos)
            .map((repo) => [repo.nameWithOwner, repo.stars, repo.pushedAt.slice(0, 10)])
            .sort(),
    };
    const bytes = new TextEncoder().encode(JSON.stringify(shown));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
