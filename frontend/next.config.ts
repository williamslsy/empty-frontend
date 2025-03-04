import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["raw.githubusercontent.com", "localhost", "github.com"],
  },
  redirects: async () => [
    {
      source: "/",
      destination: "/swap",
      permanent: true,
    },
  ],
};

export default nextConfig;
