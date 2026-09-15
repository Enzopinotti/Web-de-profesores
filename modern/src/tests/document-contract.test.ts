import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productionUrl = "https://enzopinotti.github.io/Web-de-profesores/";

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("public document contract", () => {
  it("uses the production Pages URL as canonical and og:url authority", () => {
    const html = read("index.html");
    expect(html).toContain('rel="canonical"');
    expect(html).toContain(`href="${productionUrl}"`);
    expect(html).toContain('property="og:url"');
    expect(html).toContain(`content="${productionUrl}"`);
    expect(html).toContain("Content-Security-Policy");
  });

  it("publishes one sitemap URL and robots points to it", () => {
    const robots = read("public/robots.txt");
    const sitemap = read("public/sitemap.xml");
    expect(robots).toContain(`${productionUrl}sitemap.xml`);
    expect(sitemap.match(/<loc>/g)).toHaveLength(1);
    expect(sitemap).toContain(`<loc>${productionUrl}</loc>`);
  });
});
