import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { root, snapshotPath } from "../src/data.ts";
import { queryGithub } from "../src/github.ts";
import type { GithubSnapshot } from "../src/types.ts";

const avatarDir = join(root, "data", "avatars");

function getToken(): string {
    const fromEnv = process.env.GITHUB_TOKEN?.trim();
    if (fromEnv) return fromEnv;

    const gh = Bun.spawnSync(["gh", "auth", "token"], { stderr: "ignore" });
    const fromGh = gh.stdout.toString().trim();
    if (gh.exitCode === 0 && fromGh) return fromGh;

    throw new Error("No GitHub token. Set GITHUB_TOKEN or log in with `gh auth login`.");
}

const { login, pullRequests, repos, avatarUrls } = await queryGithub(getToken());

const extensions: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
};

await mkdir(avatarDir, { recursive: true });
for (const file of await readdir(avatarDir)) {
    await rm(join(avatarDir, file));
}

const avatars: Record<string, string> = {};
for (const [owner, url] of avatarUrls) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Avatar for ${owner} failed: ${response.status}`);
    const type = response.headers.get("content-type")?.split(";")[0] ?? "";
    const file = `${owner.toLowerCase()}.${extensions[type] ?? "png"}`;
    await Bun.write(join(avatarDir, file), await response.arrayBuffer());
    avatars[owner] = file;
}

const snapshot: GithubSnapshot = {
    fetchedAt: new Date().toISOString(),
    login,
    repos,
    pullRequests,
    avatars,
};

await Bun.write(snapshotPath, `${JSON.stringify(snapshot, null, 4)}\n`);
console.log(
    `Saved ${pullRequests.length} pull requests, ${Object.keys(repos).length} repos and ${avatarUrls.size} avatars.`,
);
