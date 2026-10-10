import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Security headers. Applied in production only — the dev bundler needs
 * `eval` and cross-origin HMR sockets, which a strict CSP would block.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lets the sandboxed preview host reach the dev server without CORS warnings.
  allowedDevOrigins: ["*.e2b.app"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Keep the icon + drei bundles small by only shipping what we import.
    optimizePackageImports: ["lucide-react", "@react-three/drei"],
  },
  async headers() {
    if (!isProd) return [];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
