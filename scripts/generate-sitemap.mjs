import { writeFileSync } from "fs";
import { join, relative } from "path";
import { globSync } from "fs";

const [outPath, srcDir] = process.argv.slice(2);
if (!outPath || !srcDir) {
  console.error(
    "Usage: bun scripts/generate-sitemap.mjs <out-path> <src-dir>",
  );
  process.exit(1);
}

try {
  // Use Bun's glob to find all .html files
  const glob = new Bun.Glob("**/*.html");
  const htmlFiles = [...glob.scanSync({ cwd: srcDir })].sort();

  if (htmlFiles.length === 0) {
    console.error(
      "error: no HTML files found — something went wrong with the build",
    );
    process.exit(1);
  }

  const baseUrl = "https://florinungur.com";
  const lastmod = new Date().toISOString().split("T")[0];

  const urls = htmlFiles.map((file) => {
    let path = file;
    // index.html → /
    if (path === "index.html") {
      path = "";
    } else if (path.endsWith("/index.html")) {
      path = path.slice(0, -"/index.html".length);
    } else if (path.endsWith(".html")) {
      path = path.slice(0, -".html".length);
    }
    const loc = path ? `${baseUrl}/${path}` : `${baseUrl}/`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  writeFileSync(outPath, sitemap, "utf8");
  console.log(`Wrote ${htmlFiles.length} URLs to ${outPath}`);
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}
