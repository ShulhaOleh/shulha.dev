import { createHash } from "node:crypto";

// Cloudflare Web Analytics injects its beacon script on the live site and reports back to it.
const ANALYTICS_SCRIPT = "https://static.cloudflareinsights.com";
const ANALYTICS_REPORTS = "https://cloudflareinsights.com";

function hash(code: string): string {
    return `'sha256-${createHash("sha256").update(code).digest("base64")}'`;
}

// Hashes every inline script and stylesheet in the pages, so new inline code is allowed
// automatically and nothing else is. JSON-LD isn't executed, so CSP doesn't apply to it.
function contentSecurityPolicy(pages: string[]): string {
    const scripts = new Set<string>();
    const styles = new Set<string>();
    for (const page of pages) {
        for (const [, attributes, code] of page.matchAll(/<script([^>]*)>(.*?)<\/script>/gs)) {
            if (/\bsrc=|application\/ld\+json/.test(attributes!) || !code) continue;
            scripts.add(hash(code));
        }
        for (const [, code] of page.matchAll(/<style[^>]*>(.*?)<\/style>/gs)) {
            styles.add(hash(code!));
        }
    }

    return [
        "default-src 'none'",
        `script-src 'self' ${[...scripts].join(" ")} ${ANALYTICS_SCRIPT}`,
        `style-src ${[...styles].join(" ") || "'none'"}`,
        "img-src 'self'",
        "font-src 'self'",
        `connect-src 'self' ${ANALYTICS_REPORTS}`,
        "base-uri 'none'",
        "form-action 'none'",
        "frame-ancestors 'none'",
    ].join("; ");
}

// Header lines for _headers, applied to every path.
export function securityHeaders(pages: string[]): string[] {
    return [
        "/*",
        `  Content-Security-Policy: ${contentSecurityPolicy(pages)}`,
        "  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload",
        "  X-Frame-Options: DENY",
        "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()",
    ];
}
