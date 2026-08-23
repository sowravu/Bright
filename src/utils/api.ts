// Central API Configuration
// When NEXT_PUBLIC_API_URL is empty, fetch requests use relative paths (/api/...)
// which Next.js rewrites to http://localhost:5000/api/... automatically.
// This ensures full functionality when running locally or via Cloudflare Tunnel.

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
