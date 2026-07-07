// Resolve a /public asset against the deploy base path (e.g. GitHub Pages /<repo>/).
// Vite inlines import.meta.env.BASE_URL at build time.
export const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, "")}`;
