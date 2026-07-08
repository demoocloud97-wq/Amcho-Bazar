// Prepares dist/client for GitHub Pages after `vite build`:
//  - index.html  = the prerendered SPA shell (served at the repo root)
//  - 404.html    = same shell, so deep links (client-side routes) boot the SPA
//  - .nojekyll   = stop GitHub Pages/Jekyll from dropping files it dislikes
import { copyFileSync, writeFileSync } from "node:fs";

const dir = "dist/client";
copyFileSync(`${dir}/_shell.html`, `${dir}/index.html`);
copyFileSync(`${dir}/_shell.html`, `${dir}/404.html`);
writeFileSync(`${dir}/.nojekyll`, "");
// Bind the site to the custom domain (kept in the published branch across deploys).
writeFileSync(`${dir}/CNAME`, "shop.alfajaryouthwing.com\n");
console.log("gh-pages prep: wrote index.html, 404.html, .nojekyll, CNAME in", dir);
