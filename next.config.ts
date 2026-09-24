import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["dried-eagles-wholesale-herald.trycloudflare.com"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
