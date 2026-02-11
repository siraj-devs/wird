import "./src/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [
    "colonizable-johna-overdeferential.ngrok-free.dev",
    "192.168.43.153",
  ],
};

export default nextConfig;
