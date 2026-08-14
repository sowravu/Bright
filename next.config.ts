import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  // Allow Cloudflare Quick Tunnel hostnames to access Next.js dev assets.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
