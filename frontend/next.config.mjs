/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*', 'peso-sandbag-jockstrap.ngrok-free.dev', '*.ngrok-free.dev'],
  async rewrites() {
    return [
      {
        source: '/gaming_marketplace_spa.html',
        destination: '/',
      },
      {
        source: '/gaming_marketplace_profile.html',
        destination: '/profile',
      },
      {
        source: '/gaming_marketplace_catalog.html',
        destination: '/catalog',
      },
      {
        source: '/gaming_marketplace_messages.html',
        destination: '/messages',
      },
      {
        source: '/gaming_marketplace_all_lots.html',
        destination: '/lots',
      },
    ];
  },
};

export default nextConfig;
