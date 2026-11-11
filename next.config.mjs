/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '20mb' },
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'exceljs'],
  },
}
export default nextConfig
