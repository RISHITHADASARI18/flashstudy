/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "https://flashstudy-backend.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
