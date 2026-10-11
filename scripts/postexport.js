// Runs after `expo export --platform web` (see package.json "build:web").
// Vercel serves dist/404.html (with a real 404 status) for any path with no file and no
// rewrite; Expo emits the not-found screen as +not-found.html, so copy it into place.
// Also drops Expo Router's dev-only route sitemap if a build ever emits it.
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const notFound = path.join(dist, "+not-found.html");
if (!fs.existsSync(notFound)) {
  console.error("postexport: dist/+not-found.html missing — did expo export run?");
  process.exit(1);
}
fs.copyFileSync(notFound, path.join(dist, "404.html"));
console.log("postexport: wrote dist/404.html");

const sitemap = path.join(dist, "_sitemap.html");
if (fs.existsSync(sitemap)) {
  fs.rmSync(sitemap);
  console.log("postexport: removed dist/_sitemap.html");
}
