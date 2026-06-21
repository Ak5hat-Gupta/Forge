/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Raise from the 60s default so static data collection survives slow CI/build hosts.
  staticPageGenerationTimeout: 180,
};
export default nextConfig;
