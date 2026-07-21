import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [
    "colonizable-johna-overdeferential.ngrok-free.dev",
    "192.168.43.153",
    "192.168.222.125",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/avatars/**",
      },
      {
        protocol: "https",
        hostname: "*.telesco.pe",
      },
      {
        protocol: "https",
        hostname: "*.telegram-cdn.org",
      },
    ],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
