import type { NextConfig } from "next";

// sharp resolves its native libvips binding via a platform-conditional require
// (`@img/sharp-<platform>-<arch>` / `@img/sharp-libvips-<platform>-<arch>`), which
// Next's output file tracing can't always follow statically — leaving the .so file
// out of the deployed function bundle and causing ERR_DLOPEN_FAILED on Vercel.
const SHARP_NATIVE_TRACE_INCLUDES = [
  "./node_modules/sharp/**/*",
  "./node_modules/@img/sharp-linux-x64/**/*",
  "./node_modules/@img/sharp-libvips-linux-x64/**/*",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io", "*.ngrok-free.dev"],
  experimental: {
    serverActions: {
      // Default is 1MB; raw phone-camera photos need headroom before server-side resize.
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    "/register/team": SHARP_NATIVE_TRACE_INCLUDES,
    "/service-team/\\[id\\]/edit": SHARP_NATIVE_TRACE_INCLUDES,
  },
};

export default nextConfig;
