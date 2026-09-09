/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async headers() {
    return ['/loader-v1.mp4', '/loader-v1.webm'].map(source => ({
      source,
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    }));
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
