import type { Profile } from "./types.ts";

export function personJsonLd(profile: Profile): string {
    const [locality, region] = profile.location.split(", ");
    const [current, ...past] = profile.education;
    const school = (entry: Profile["education"][number]) => ({
        "@type": "EducationalOrganization",
        name: entry.school,
        ...(entry.href && { sameAs: entry.href }),
    });

    const person = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: profile.name,
        alternateName: profile.alternateNames,
        url: `${profile.url}/`,
        image: `https://github.com/${profile.githubLogin}.png`,
        description: profile.description,
        jobTitle: "Computer Science student",
        email: profile.links.find((link) => link.href.startsWith("mailto:"))?.href,
        address: { "@type": "PostalAddress", addressLocality: locality, addressRegion: region },
        ...(current && { affiliation: school(current) }),
        alumniOf: past.map(school),
        knowsLanguage: profile.languages,
        knowsAbout: profile.skills.flatMap((group) => group.items.map((item) => item.name)),
        sameAs: profile.links
            .filter((link) => link.href.startsWith("https://"))
            .map((link) => link.href),
    };

    return JSON.stringify(person).replaceAll("<", "\\u003c");
}

export function robotsTxt(profile: Profile): string {
    return `User-agent: *\nAllow: /\n\nSitemap: ${profile.url}/sitemap.xml\n`;
}

export function sitemapXml(profile: Profile, lastModified: Date): string {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        `    <url><loc>${profile.url}/</loc><lastmod>${lastModified.toISOString().slice(0, 10)}</lastmod></url>`,
        "</urlset>",
        "",
    ].join("\n");
}
