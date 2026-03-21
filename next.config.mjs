/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/tarjeta-pdf": ["./node_modules/@sparticuz/chromium/**"],
    "/api/receta-pdf": ["./node_modules/@sparticuz/chromium/**"]
  }
};

export default nextConfig;

