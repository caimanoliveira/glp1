/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The PWA service worker is a plain static file in /public (sw.js); no bundler
  // integration needed for a single-user app. See public/sw.js.
};

export default nextConfig;
