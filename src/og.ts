import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { root, type ViewModel } from "./data.ts";

const WIDTH = 1200;
const HEIGHT = 630;

const gruvboxDark = {
    page: "#282828",
    line: "#504945",
    ink: "#ebdbb2",
    muted: "#a89984",
    accent: "#fe8019",
};

function font(pkg: string, file: string): Buffer {
    return readFileSync(join(root, "node_modules", "@fontsource", pkg, "files", file));
}

type Node = { type: string; props: Record<string, unknown> };

function el(type: string, style: Record<string, unknown>, children?: unknown, props = {}): Node {
    return { type, props: { style, children, ...props } };
}

export async function renderOgImage(vm: ViewModel): Promise<Buffer> {
    const avatarFile = join(root, ".build", vm.avatar);
    const extension = avatarFile.split(".").pop() === "jpg" ? "jpeg" : "png";
    const avatar = `data:image/${extension};base64,${readFileSync(avatarFile).toString("base64")}`;
    const colors = gruvboxDark;

    const card = el(
        "div",
        {
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 80,
            backgroundColor: colors.page,
            color: colors.ink,
            fontFamily: "Atkinson",
        },
        [
            el("div", { display: "flex", alignItems: "center", gap: 36 }, [
                el("img", { width: 132, height: 132 }, undefined, {
                    src: avatar,
                    width: 132,
                    height: 132,
                }),
                el("div", { display: "flex", flexDirection: "column", gap: 8 }, [
                    el("div", { fontSize: 68, fontWeight: 600 }, vm.profile.name),
                    el("div", { fontSize: 34, color: colors.muted }, vm.profile.role),
                ]),
            ]),
            el(
                "div",
                { display: "flex", fontSize: 38, lineHeight: 1.4, maxWidth: 980 },
                "Rust and TypeScript. Building Modrex, maintaining Refract.",
            ),
            el(
                "div",
                {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: `2px solid ${colors.line}`,
                    paddingTop: 28,
                    fontFamily: "JetBrains Mono",
                    fontSize: 30,
                },
                [
                    el("div", { color: colors.accent }, "shulha.dev"),
                    el("div", { color: colors.muted }, "github.com/" + vm.profile.githubLogin),
                ],
            ),
        ],
    );

    const svg = await satori(card as Parameters<typeof satori>[0], {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
            {
                name: "Atkinson",
                data: font(
                    "atkinson-hyperlegible-next",
                    "atkinson-hyperlegible-next-latin-400-normal.woff",
                ),
                weight: 400,
                style: "normal",
            },
            {
                name: "Atkinson",
                data: font(
                    "atkinson-hyperlegible-next",
                    "atkinson-hyperlegible-next-latin-600-normal.woff",
                ),
                weight: 600,
                style: "normal",
            },
            {
                name: "JetBrains Mono",
                data: font("jetbrains-mono", "jetbrains-mono-latin-500-normal.woff"),
                weight: 500,
                style: "normal",
            },
        ],
    });

    return new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render().asPng();
}
