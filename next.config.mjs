/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export: o app é 100% client-side (Supabase roda no browser),
  // então geramos HTML/JS estáticos em ./out para servir no Cloudflare
  // (Workers static assets / Pages). Ver wrangler.toml e o workflow de deploy.
  output: "export",
  images: { unoptimized: true },
  // The PWA service worker is a plain static file in /public (sw.js); no bundler
  // integration needed for a single-user app. See public/sw.js.
};

export default nextConfig;
