/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  async redirects() {
    return [
      { source: '/auth/signin', destination: '/superadmin/auth/signin', permanent: false },
      { source: '/auth/signin/recovery', destination: '/superadmin/auth/signin/recovery', permanent: false },
      { source: '/auth/signup', destination: '/superadmin/auth/signup', permanent: false },
      { source: '/auth/signup/step-1', destination: '/superadmin/auth/signup/step-1', permanent: false },
      { source: '/auth/signup/success', destination: '/superadmin/auth/signup/success', permanent: false },
      { source: '/dashboard', destination: '/superadmin/dashboard', permanent: false },
    ]
  },
}

module.exports = nextConfig
