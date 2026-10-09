/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/dashboard',
        destination: '/',
      },
      {
        source: '/students',
        destination: '/',
      },
      {
        source: '/fees',
        destination: '/',
      },
      {
        source: '/attendance',
        destination: '/',
      },
      {
        source: '/results',
        destination: '/',
      },
      {
        source: '/idcards',
        destination: '/',
      },
      {
        source: '/teachers',
        destination: '/',
      },
      {
        source: '/reports',
        destination: '/',
      },
      {
        source: '/scanner',
        destination: '/',
      },
      {
        source: '/notices',
        destination: '/',
      },
      {
        source: '/profile',
        destination: '/',
      },
      {
        source: '/settings',
        destination: '/',
      },
      {
        source: '/signin',
        destination: '/',
      },
      {
        source: '/signup',
        destination: '/',
      },
      {
        source: '/forgot-password',
        destination: '/',
      },
      {
        source: '/setup',
        destination: '/',
      },
      {
        source: '/users',
        destination: '/',
      },
      {
        source: '/timetable',
        destination: '/',
      },
      {
        source: '/classes',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
