const fs = require('fs');

const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0D9488" />
</svg>`;

const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <text x="512" y="512" font-family="Arial, sans-serif" font-size="240" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">EX</text>
</svg>`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0D9488" rx="256" />
  <text x="512" y="512" font-family="Arial, sans-serif" font-size="260" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">EX</text>
  <text x="512" y="700" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">EXELENT</text>
</svg>`;

const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0D9488" />
  <text x="512" y="512" font-family="Arial, sans-serif" font-size="260" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">EX</text>
  <text x="512" y="700" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">EXELENT</text>
</svg>`;

fs.writeFileSync('bg.svg', bgSvg);
fs.writeFileSync('fg.svg', fgSvg);
fs.writeFileSync('icon.svg', iconSvg);
fs.writeFileSync('splash.svg', splashSvg);
