import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Pour Docker avec build optimisé
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.loura.app',
        pathname: '/**',
      },
      {
        protocol:'https',
        hostname: "randomuser.me",
        pathname:"/*",
      }
    ],
  },
};

export default nextConfig;
