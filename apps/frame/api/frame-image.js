const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0D0D1A"/>
      <stop offset="100%" stop-color="#1A2340"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" rx="32" fill="url(#bg)"/>
  <g>
    <text x="80" y="220" font-family="Arial, sans-serif" font-size="64" fill="#FFFFFF" font-weight="700">Journey Through Time</text>
    <text x="80" y="310" font-family="Arial, sans-serif" font-size="32" fill="#B3C2FF">Send encrypted letters to your future self.</text>
    <text x="80" y="390" font-family="Arial, sans-serif" font-size="28" fill="#8EA0FF">Base · Arbitrum · Monad</text>
  </g>
</svg>`;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(SVG);
}
