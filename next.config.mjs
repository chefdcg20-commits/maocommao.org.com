/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  outputFileTracingRoot: process.cwd(),
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
