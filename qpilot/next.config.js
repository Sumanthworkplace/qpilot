/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["geist"],
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
  },
};

module.exports = nextConfig;
