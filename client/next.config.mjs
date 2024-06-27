/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    API_URL: process.env.API_URL,
    BACKEND_URL: process.env.BACKEND_URL,
  },
};

export default nextConfig;
