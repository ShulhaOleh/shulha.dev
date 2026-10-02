import { fingerprint, queryGithub } from "../../src/github.ts";

interface Env {
    GITHUB_TOKEN: string;
    DEPLOY_HOOK_URL: string;
    STATE: {
        get(key: string): Promise<string | null>;
        put(key: string, value: string): Promise<void>;
    };
}

export default {
    async scheduled(_controller: unknown, env: Env): Promise<void> {
        const current = await fingerprint(await queryGithub(env.GITHUB_TOKEN));
        if (current === (await env.STATE.get("fingerprint"))) return;

        const response = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
        if (!response.ok) throw new Error(`Deploy hook failed: ${response.status}`);
        await env.STATE.put("fingerprint", current);
    },
};
