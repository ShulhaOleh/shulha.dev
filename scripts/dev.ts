import { watch } from "node:fs";
import { join, normalize } from "node:path";
import { root } from "../src/data.ts";

const port = Number(process.env.PORT ?? 3000);
const outDir = join(root, "dist");
const watched = ["src", "content", "data"];
const reloadScript = `<script>new EventSource("/__reload").onmessage = () => location.reload();</script>`;

const clients = new Set<ReadableStreamDefaultController<string>>();
let building = false;
let queued = false;

async function build(): Promise<void> {
    if (building) {
        queued = true;
        return;
    }
    building = true;
    const proc = Bun.spawn(["bun", "scripts/build.ts", "--dev"], {
        cwd: root,
        stdout: "inherit",
        stderr: "inherit",
    });
    const ok = (await proc.exited) === 0;
    building = false;

    if (queued) {
        queued = false;
        return build();
    }
    if (ok) {
        for (const client of clients) client.enqueue("data: reload\n\n");
    }
}

let timer: Timer | undefined;
for (const dir of watched) {
    watch(join(root, dir), { recursive: true }, () => {
        clearTimeout(timer);
        timer = setTimeout(build, 80);
    });
}

await build();

Bun.serve({
    port,
    idleTimeout: 0,
    async fetch(request) {
        const { pathname } = new URL(request.url);

        if (pathname === "/__reload") {
            let self: ReadableStreamDefaultController<string>;
            const stream = new ReadableStream<string>({
                start(controller) {
                    self = controller;
                    clients.add(controller);
                },
                cancel() {
                    clients.delete(self);
                },
            });
            return new Response(stream, {
                headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
            });
        }

        const path = normalize(join(outDir, pathname === "/" ? "index.html" : pathname));
        if (!path.startsWith(outDir)) return new Response("Forbidden", { status: 403 });

        const file = Bun.file(path);
        if (!(await file.exists())) return new Response("Not found", { status: 404 });

        if (path.endsWith(".html")) {
            const html = (await file.text()).replace("</body>", `${reloadScript}</body>`);
            return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
        }
        return new Response(file);
    },
});

console.log(`Dev server on http://localhost:${port}`);
