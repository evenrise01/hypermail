/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Add allowedDevOrigins to allow cross-origin requests from specific domains in development
  allowedDevOrigins: [
    "https://toilet-remedy-ed-sri.trycloudflare.com", // Add the specific origin causing the error
  ],
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default config;