import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      new URL("https://a.espncdn.com/i/teamlogos/nba/**"),
      new URL("https://a.espncdn.com/i/headshots/nba/players/**"),
      // Fotos de las noticias.
      new URL("https://a.espncdn.com/photo/**"),
      new URL("https://espnmedia-cdn.akamaized.net/espn/media/**"),
    ],
  },
  async headers() {
    return [
      {
        // El navegador debe detectar enseguida cada versión nueva.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
