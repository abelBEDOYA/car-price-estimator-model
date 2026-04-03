/** @type {import('next').NextConfig} */
const backendInternal = (
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const nextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  /** Mismo criterio que Vite `proxy /backend` en olympic-rowing: el navegador llama al mismo origen. */
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendInternal}/:path*`,
      },
    ];
  },
};

export default nextConfig;
