import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudflare Quick Tunnel hostnames to access Next.js dev assets.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
