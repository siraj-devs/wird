import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [
    "colonizable-johna-overdeferential.ngrok-free.dev",
    "192.168.43.153",
  ],
  images: {
    remotePatterns: [new URL("https://cdn.discordapp.com/avatars/**")],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
